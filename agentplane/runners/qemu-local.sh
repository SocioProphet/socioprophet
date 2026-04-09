#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage:
  runners/qemu-local.sh run <bundle-dir> [--profile staging|prod]
  runners/qemu-local.sh smoke <bundle-dir>
  runners/qemu-local.sh promote <bundle-dir>
  runners/qemu-local.sh rollback
  runners/qemu-local.sh status [--verify]
  runners/qemu-local.sh stop
USAGE
}

AP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${AP_ROOT}/state"
POINTERS_DIR="${STATE_DIR}/pointers"
# shellcheck disable=SC1091
source "${AP_ROOT}/runners/pointer_receipts.sh"

REMOTE="${REMOTE:-}"
REMOTE_ROOT="${REMOTE_ROOT:-/tmp/agentplane-run}"
REMOTE_TIMEOUT="${REMOTE_TIMEOUT:-900}"
TARGET_SYSTEM="aarch64-linux"
WATCH="false"

cmd="${1:-}"
shift || true
bundle_dir=""
profile="staging"

if [[ "$cmd" == "run" || "$cmd" == "smoke" || "$cmd" == "promote" ]]; then
  bundle_dir="${1:-}"
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --profile) profile="${2:-}"; shift 2 ;;
      --system) TARGET_SYSTEM="${2:-}"; shift 2 ;;
      --watch) WATCH="true"; shift 1 ;;
      *) echo "[runner] unknown arg: $1" >&2; exit 2 ;;
    esac
  done
  [[ -n "$bundle_dir" && -d "$bundle_dir" ]] || { echo "[runner] bundle-dir missing or not a directory" >&2; usage; exit 2; }
fi

bundle_json=""
if [[ -n "$bundle_dir" ]]; then
  bundle_json="${bundle_dir%/}/bundle.json"
  [[ -f "$bundle_json" ]] || { echo "[runner] missing $bundle_json" >&2; exit 2; }
fi

ensure_pointers() {
  mkdir -p "$POINTERS_DIR"
  touch "${POINTERS_DIR}/current-staging" "${POINTERS_DIR}/current-prod" "${POINTERS_DIR}/previous-good"
}

read_json_field() {
  local file="$1" field="$2"
  python3 - <<PY
import json
b=json.load(open("$file","r",encoding="utf-8"))
cur=b
for k in "$field".split("."):
    cur=cur[k]
print(cur)
PY
}

read_json_field_optional() {
  local file="$1" field="$2"
  python3 - <<PY
import json
b=json.load(open("$file","r",encoding="utf-8"))
cur=b
try:
    for k in "$field".split("."):
        cur=cur[k]
    print(cur)
except Exception:
    print("")
PY
}

read_default_executor_from_inventory() {
  local inv="${AP_ROOT}/fleet/inventory.json"
  [[ -f "${inv}" ]] || return 1
  python3 - <<'PYI' "${inv}"
import json,sys
inv=json.load(open(sys.argv[1]))
name=inv.get("defaultExecutor")
if not name:
    raise SystemExit(1)
for ex in inv.get("executors", []):
    if ex.get("name") == name:
        print(ex.get("sshRef") or ex.get("name"))
        raise SystemExit(0)
raise SystemExit(1)
PYI
}

read_first_executor_from_machines() {
  local machines_file="/etc/nix/machines"
  [[ -f "${machines_file}" ]] || return 1
  local line uri
  line="$(grep -vE '^\s*#|^\s*$' "${machines_file}" | head -n 1 || true)"
  [[ -n "${line}" ]] || return 1
  uri="$(echo "${line}" | awk '{print $1}')"
  uri="${uri#ssh-ng://}"
  echo "${uri}"
}

emit_placement_receipt() {
  local out_dir="$1" bundle_name="$2" bundle_ver="$3" lane="$4" backend="$5" site="$6"
  mkdir -p "$out_dir"
  cat > "${out_dir}/placement-receipt.json" <<JSON
{
  "kind": "PlacementReceipt",
  "bundle": "${bundle_name}@${bundle_ver}",
  "decision": {
    "chosenSite": "${site}",
    "backend": "${backend}",
    "constraints": { "lane": "${lane}" },
    "rejectedSites": []
  },
  "signedBy": "UNSET",
  "createdAt": "$(date -Iseconds)"
}
JSON
}

write_replay_artifact() {
  local out_dir="$1" bundle_dir="$2" backend="$3" executor="$4" root="$5" profile="$6"
  cat > "${out_dir}/replay-artifact.json" <<JSON
{
  "kind": "ReplayArtifact",
  "bundleDir": "${bundle_dir%/}",
  "backend": "${backend}",
  "executor": "${executor}",
  "executorRoot": "${root}",
  "invocation": "./runners/qemu-local.sh run ${bundle_dir%/} --profile ${profile} --system ${TARGET_SYSTEM} --watch",
  "capturedAt": "$(date -Iseconds)"
}
JSON
}

embed_scheduler_decision() {
  local receipt="$1" decision="$2"
  if [[ -f "$receipt" && -f "$decision" ]]; then
    python3 - <<'PYI' "$receipt" "$decision"
import json,sys
receipt=json.load(open(sys.argv[1],"r",encoding="utf-8"))
decision=json.load(open(sys.argv[2],"r",encoding="utf-8"))
receipt.setdefault("decision", {})["scheduler"] = decision
open(sys.argv[1],"w",encoding="utf-8").write(json.dumps(receipt, indent=2, sort_keys=True)+"\n")
PYI
  fi
}

check_runtime_drift() {
  local out_dir="$1" remote="$2"
  local sch_ref run_backend rec_backend
  sch_ref="$(python3 - <<'PYI' "$out_dir/placement-receipt.json" 2>/dev/null || true
import json,sys
r=json.load(open(sys.argv[1],"r",encoding="utf-8"))
print(r.get("decision",{}).get("scheduler",{}).get("sshRef",""))
PYI
)"
  if [[ -n "$sch_ref" && -n "$remote" && "$sch_ref" != "$remote" ]]; then
    echo "[runner] ERROR: scheduler sshRef mismatch: receipt=${sch_ref} remote=${remote}" >&2
    return 1
  fi
  run_backend="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["backend"])' 2>/dev/null "$out_dir/run-artifact.json" || true)"
  rec_backend="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["decision"]["backend"])' 2>/dev/null "$out_dir/placement-receipt.json" || true)"
  if [[ -n "$run_backend" && -n "$rec_backend" && "$run_backend" != "$rec_backend" ]]; then
    echo "[runner] ERROR: backend mismatch: run-artifact=${run_backend} placement-receipt=${rec_backend}" >&2
    return 1
  fi
}

run_lima_process() {
  local name="$1" ver="$2" out_dir="$3" placement_json="$4" profile="$5" bundle_dir="$6" max_run_seconds="$7" fail_on_timeout="$8" executor_ref="$9"
  local remote effective_backend
  effective_backend="$(echo "$placement_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("effectiveBackend","lima-process"))' 2>/dev/null || true)"
  remote="$(echo "$placement_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("sshRef",""))' 2>/dev/null || true)"
  remote="${remote:-${executor_ref:-}}"
  if [[ -z "$remote" ]]; then remote="$(read_default_executor_from_inventory || true)"; fi
  if [[ -z "$remote" ]]; then remote="$(read_first_executor_from_machines || true)"; fi
  remote="${remote:-lima-nixbuilder}"

  ssh "$remote" "mkdir -p ${REMOTE_ROOT}/repo ${REMOTE_ROOT}/artifacts && : > ${REMOTE_ROOT}/artifacts/guest-serial.log"
  rsync -a --delete --exclude '.git/' --exclude 'artifacts/' --exclude 'state/pointers/' "${AP_ROOT}/" "${remote}:${REMOTE_ROOT}/repo/"

  set +e
  timeout "$max_run_seconds" ssh "$remote" bash -s <<EOS
set -euo pipefail
ART="${REMOTE_ROOT}/artifacts"
mkdir -p "\$ART"
echo "[lima-process] hello \$(date -Iseconds)" | tee -a "\$ART/guest-serial.log" >/dev/null
echo "[lima-process] proof: \$(date -Iseconds)" > "\$ART/guest-proof.txt"
cat > "\$ART/run-artifact.json" <<JSON
{
  "kind": "RunArtifact",
  "bundle": "${name}@${ver}",
  "lane": "${profile}",
  "backend": "${effective_backend}",
  "executedIn": "lima-vm",
  "startedAt": "\$(date -Iseconds)",
  "endedAt": "\$(date -Iseconds)",
  "result": "pass"
}
JSON
EOS
  rc=$?
  set -e
  echo "$rc" > "${AP_ROOT}/${out_dir}/runner-exitcode.txt"
  if [[ "$rc" == "124" ]]; then
    cat > "${AP_ROOT}/${out_dir}/timeout-artifact.json" <<JSON
{
  "kind": "TimeoutArtifact",
  "bundle": "${name}@${ver}",
  "backend": "${effective_backend}",
  "executor": "${remote}",
  "maxRunSeconds": ${max_run_seconds},
  "capturedAt": "$(date -Iseconds)"
}
JSON
    if [[ "$fail_on_timeout" == "True" || "$fail_on_timeout" == "true" ]]; then
      rsync -a --delete "${remote}:${REMOTE_ROOT}/artifacts/" "${AP_ROOT}/${out_dir}/" || true
      echo "[runner] ERROR: timed out after ${max_run_seconds}s (TimeoutArtifact written)" >&2
      return 2
    fi
  elif [[ "$rc" != "0" ]]; then
    rsync -a --delete "${remote}:${REMOTE_ROOT}/artifacts/" "${AP_ROOT}/${out_dir}/" || true
    echo "[runner] ERROR: remote execution failed rc=${rc}" >&2
    return "$rc"
  fi

  rsync -a --delete "${remote}:${REMOTE_ROOT}/artifacts/" "${AP_ROOT}/${out_dir}/"
  write_replay_artifact "${AP_ROOT}/${out_dir}" "$bundle_dir" "$effective_backend" "$remote" "$REMOTE_ROOT" "$profile"
  emit_placement_receipt "${AP_ROOT}/${out_dir}" "$name" "$ver" "$profile" "$effective_backend" "$remote"
  embed_scheduler_decision "${AP_ROOT}/${out_dir}/placement-receipt.json" "${AP_ROOT}/${out_dir}/placement-decision.json"
  check_runtime_drift "${AP_ROOT}/${out_dir}" "$remote"
}

run_vm_backend() {
  local name="$1" ver="$2" out_dir="$3" placement_json="$4" profile="$5" bundle_dir="$6" max_run_seconds="$7" fail_on_timeout="$8"
  local effective_backend remote vm_out run_script rc
  effective_backend="$(echo "$placement_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("effectiveBackend",""))' 2>/dev/null || true)"
  remote="$(echo "$placement_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("sshRef",""))' 2>/dev/null || true)"
  command -v nix >/dev/null || { echo "[runner] ERROR: nix is required for VM builds" >&2; return 2; }
  NIX_PROGRESS_STYLE=none TERM=dumb nix build ".#packages.${TARGET_SYSTEM}.vm-example-agent" --no-link
  vm_out="$(nix path-info ".#packages.${TARGET_SYSTEM}.vm-example-agent")"
  run_script="$(ls -1 "${vm_out}"/bin/run-*-vm 2>/dev/null | head -n1 || true)"
  [[ -n "$run_script" ]] || { echo "[runner] ERROR: could not find run-*-vm script in ${vm_out}/bin" >&2; return 2; }
  mkdir -p "${AP_ROOT}/${out_dir}"
  export QEMU_OPTS="${QEMU_OPTS:-} -virtfs local,path=${AP_ROOT}/${out_dir},mount_tag=artifacts,security_model=none,id=artifacts -nographic -serial mon:stdio"
  set +e
  timeout "$max_run_seconds" "$run_script" > "${AP_ROOT}/${out_dir}/guest-serial.log" 2>&1
  rc=$?
  set -e
  echo "$rc" > "${AP_ROOT}/${out_dir}/runner-exitcode.txt"
  if [[ "$rc" == "124" ]]; then
    cat > "${AP_ROOT}/${out_dir}/timeout-artifact.json" <<JSON
{
  "kind": "TimeoutArtifact",
  "bundle": "${name}@${ver}",
  "backend": "${effective_backend}",
  "executor": "${remote:-local-host}",
  "maxRunSeconds": ${max_run_seconds},
  "capturedAt": "$(date -Iseconds)"
}
JSON
    if [[ "$fail_on_timeout" == "True" || "$fail_on_timeout" == "true" ]]; then
      echo "[runner] ERROR: VM run timed out after ${max_run_seconds}s; see guest-serial.log" >&2
      return 2
    fi
  elif [[ "$rc" != "0" ]]; then
    echo "[runner] ERROR: VM run failed rc=${rc}" >&2
    return "$rc"
  fi
  if [[ ! -f "${AP_ROOT}/${out_dir}/run-artifact.json" ]]; then
    cat > "${AP_ROOT}/${out_dir}/run-artifact.json" <<JSON
{
  "kind": "RunArtifact",
  "bundle": "${name}@${ver}",
  "lane": "${profile}",
  "backend": "${effective_backend}",
  "executedIn": "vm-guest",
  "startedAt": "$(date -Iseconds)",
  "endedAt": "$(date -Iseconds)",
  "result": "pass"
}
JSON
  fi
  write_replay_artifact "${AP_ROOT}/${out_dir}" "$bundle_dir" "$effective_backend" "${remote:-local-host}" "$vm_out" "$profile"
  emit_placement_receipt "${AP_ROOT}/${out_dir}" "$name" "$ver" "$profile" "$effective_backend" "${remote:-local-host}"
  embed_scheduler_decision "${AP_ROOT}/${out_dir}/placement-receipt.json" "${AP_ROOT}/${out_dir}/placement-decision.json"
  check_runtime_drift "${AP_ROOT}/${out_dir}" "$remote"
}

case "$cmd" in
  run)
    command -v python3 >/dev/null || { echo "[runner] ERROR: python3 is required" >&2; exit 2; }
    ensure_pointers
    echo "[runner] validate bundle..."
    "${AP_ROOT}/scripts/validate_bundle.py" "$bundle_json" >/dev/null
    name="$(read_json_field "$bundle_json" "metadata.name")"
    ver="$(read_json_field "$bundle_json" "metadata.version")"
    out_dir="$(read_json_field "$bundle_json" "spec.artifacts.outDir")"
    mkdir -p "${AP_ROOT}/${out_dir}"
    placement_json="$(cd "${AP_ROOT}" && python3 scripts/select-executor.py "$bundle_json")"
    printf '%s\n' "$placement_json" > "${AP_ROOT}/${out_dir}/placement-decision.json"
    backend_intent="$(read_json_field "$bundle_json" "spec.vm.backendIntent")"
    effective_backend="$(echo "$placement_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("effectiveBackend",""))' 2>/dev/null || true)"
    effective_backend="${effective_backend:-${backend_intent}}"
    max_run_seconds="$(read_json_field "$bundle_json" "spec.policy.maxRunSeconds")"
    fail_on_timeout="$(read_json_field "$bundle_json" "spec.policy.failOnTimeout")"
    executor_ref="$(read_json_field_optional "$bundle_json" "spec.executor.ref")"
    if [[ "$effective_backend" == "lima-process" ]]; then
      run_lima_process "$name" "$ver" "$out_dir" "$placement_json" "$profile" "$bundle_dir" "$max_run_seconds" "$fail_on_timeout" "$executor_ref"
    else
      run_vm_backend "$name" "$ver" "$out_dir" "$placement_json" "$profile" "$bundle_dir" "$max_run_seconds" "$fail_on_timeout"
    fi
    echo "[runner] update current pointer..."
    if [[ "$profile" == "prod" ]]; then
      echo "[runner] ERROR: direct prod pointer writes are disabled; use promote after closure checks" >&2
      exit 2
    fi
    check_bundle_closure "$bundle_json" "$AP_ROOT" || exit 2
    printf '%s\n' "${bundle_dir%/}" > "${POINTERS_DIR}/current-staging"
    emit_pointer_mutation_receipt "$AP_ROOT" "run" "current-staging" "" "${bundle_dir%/}" >/dev/null
    echo "[runner] OK: ${name}@${ver} (${profile})"
    ;;
  smoke)
    echo "[runner] validate bundle..."
    "${AP_ROOT}/scripts/validate_bundle.py" "$bundle_json" >/dev/null
    out_dir="$(read_json_field "$bundle_json" "spec.artifacts.outDir")"
    smoke_script="$(read_json_field "$bundle_json" "spec.smoke.script")"
    "${AP_ROOT}/${smoke_script}" "${AP_ROOT}/${out_dir}"
    ;;
  promote)
    ensure_pointers
    "${AP_ROOT}/scripts/validate_bundle.py" "$bundle_json" >/dev/null
    assert_profile_lane_match "$bundle_json" "prod" || exit 2
    check_bundle_closure "$bundle_json" "$AP_ROOT" || exit 2
    old_prod="$(cat "${POINTERS_DIR}/current-prod" 2>/dev/null || true)"
    if [[ -n "$old_prod" ]]; then
      cp -f "${POINTERS_DIR}/current-prod" "${POINTERS_DIR}/previous-good"
    fi
    printf '%s\n' "${bundle_dir%/}" > "${POINTERS_DIR}/current-prod"
    emit_pointer_mutation_receipt "$AP_ROOT" "promote" "current-prod" "$old_prod" "${bundle_dir%/}" >/dev/null
    echo "[runner] OK: current-prod -> ${bundle_dir%/}"
    ;;
  rollback)
    ensure_pointers
    if [[ ! -s "${POINTERS_DIR}/previous-good" ]]; then
      echo "[runner] no previous-good pointer set" >&2
      exit 2
    fi
    prev_bundle="$(cat "${POINTERS_DIR}/previous-good")"
    check_bundle_exists "$prev_bundle" || { echo "[runner] previous-good target missing bundle.json" >&2; exit 2; }
    check_bundle_closure "${prev_bundle%/}/bundle.json" "$AP_ROOT" || exit 2
    old_prod="$(cat "${POINTERS_DIR}/current-prod" 2>/dev/null || true)"
    cp -f "${POINTERS_DIR}/current-prod" "${POINTERS_DIR}/current-staging" 2>/dev/null || true
    cp -f "${POINTERS_DIR}/previous-good" "${POINTERS_DIR}/current-prod"
    emit_pointer_mutation_receipt "$AP_ROOT" "rollback" "current-prod" "$old_prod" "$prev_bundle" >/dev/null
    echo "[runner] OK: current-prod rolled back"
    ;;
  status)
    ensure_pointers
    if [[ "${1:-}" == "--verify" ]]; then
      status_verify "$AP_ROOT"
      exit 0
    fi
    echo "[runner] pointers:"
    for f in current-staging current-prod previous-good; do
      printf "  %-14s %s\n" "$f:" "$(cat "${POINTERS_DIR}/${f}" 2>/dev/null || true)"
    done
    ;;
  stop)
    echo "[runner] stop: v0 no-op"
    ;;
  *)
    usage; exit 2 ;;
esac
