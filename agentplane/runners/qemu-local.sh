
#!/usr/bin/env bash
set -euo pipefail

# qemu-local backend (v0): contract-first.
# Today: validate bundle, run smoke, emit artifacts, manage pointers.
# Next: build+boot NixOS VM and execute smoke inside guest (same interface).

usage() {
  cat <<USAGE
Usage:
  runners/qemu-local.sh run <bundle-dir> [--profile staging|prod]
  runners/qemu-local.sh smoke <bundle-dir>
  runners/qemu-local.sh promote <bundle-dir>
  runners/qemu-local.sh rollback
  runners/qemu-local.sh status
  runners/qemu-local.sh stop

Notes:
  - <bundle-dir> is a directory containing bundle.json
  - v0 does not boot a VM yet; it is contract+artifacts+pointers.
USAGE
}

AP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${AP_ROOT}/state"
POINTERS_DIR="${STATE_DIR}/pointers"

# Safe defaults for set -u (do not assume remote vars exist outside the remote branch)
REMOTE="${REMOTE:-}"
REMOTE_ROOT="${REMOTE_ROOT:-}"
REMOTE_TIMEOUT="${REMOTE_TIMEOUT:-900}"  # seconds; hard deadline for VM run

cmd="${1:-}"
shift || true

bundle_dir=""
profile="staging"

TARGET_SYSTEM="aarch64-linux"
WATCH="false"

if [[ "$cmd" == "run" || "$cmd" == "smoke" || "$cmd" == "promote" ]]; then
  bundle_dir="${1:-}"
  shift || true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --profile) profile="${2:-}"; shift 2;;
      --system) TARGET_SYSTEM="${2:-}"; shift 2;;
      --watch) WATCH="true"; shift 1;;
      *) echo "[runner] unknown arg: $1" >&2; exit 2;;
    esac
  done
  if [[ -z "$bundle_dir" || ! -d "$bundle_dir" ]]; then
    echo "[runner] bundle-dir missing or not a directory" >&2
    usage; exit 2
  fi
fi

bundle_json=""
if [[ -n "$bundle_dir" ]]; then
  bundle_json="${bundle_dir%/}/bundle.json"
  [[ -f "$bundle_json" ]] || { echo "[runner] missing $bundle_json" >&2; exit 2; }
fi



read_default_executor_from_inventory() {
  local inv="${AP_ROOT}/fleet/inventory.json"
  [[ -f "${inv}" ]] || return 1
  python3 - <<'PYI' "${inv}"
import json,sys
inv=json.load(open(sys.argv[1]))
name=inv.get("defaultExecutor")
if not name: raise SystemExit(1)
for ex in inv.get("executors",[]):
    if ex.get("name")==name:
        print(ex.get("sshRef") or ex.get("name"))
        raise SystemExit(0)
raise SystemExit(1)
PYI
}

read_first_executor_from_machines() {
  # Determinate macOS often uses builders = @/etc/nix/machines
  local machines_file="/etc/nix/machines"
  [[ -f "${machines_file}" ]] || return 1
  # first non-empty, non-comment line
  local line
  line="$(grep -vE '^\s*#|^\s*$' "${machines_file}" | head -n 1 || true)"
  [[ -n "${line}" ]] || return 1
  # field1 is like ssh-ng://lima-nixbuilder or ssh-ng://user@host
  local uri
  uri="$(echo "${line}" | awk '{print $1}')"
  uri="${uri#ssh-ng://}"
  echo "${uri}"
  return 0
}

read_json_field() {
  # minimal JSON reader: python stdlib only
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
  # Returns empty string if the path is missing (no traceback).
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

ensure_pointers() {
  mkdir -p "$POINTERS_DIR"
  touch "${POINTERS_DIR}/current-staging" "${POINTERS_DIR}/current-prod" "${POINTERS_DIR}/previous-good"
}

emit_run_artifact() {
  local out_dir="$1" bundle_name="$2" bundle_ver="$3" lane="$4"
  mkdir -p "$out_dir"
  cat > "${out_dir}/run-artifact.json" <<JSON
{
  "kind": "RunArtifact",
  "bundle": "${bundle_name}@${bundle_ver}",
  "lane": "${lane}",
  "backend": "${backend}",
  "startedAt": "$(date -Iseconds)",
  "endedAt": "$(date -Iseconds)",
  "result": "pass",
  "notes": "v0 runner: smoke executed on host. Next: smoke executed inside guest VM."
}
JSON
}

emit_placement_receipt() {
  local out_dir="$1" bundle_name="$2" bundle_ver="$3" lane="$4" backend="${5:-qemu-local}" site="${6:-local-host}"
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

case "$cmd" in
  run)
    # Host prerequisites (fail fast, product-grade)
    command -v python3 >/dev/null || { echo "[runner] ERROR: python3 is required" >&2; exit 2; }
    command -v nix >/dev/null || {
      echo "[runner] ERROR: nix is required for VM builds (nix command not found)." >&2
      echo "[runner] Hint: install Nix on this host, or run this backend on a Linux host with Nix." >&2
      exit 2
    }
    ensure_pointers
    echo "[runner] validate bundle..."
    "${AP_ROOT}/scripts/validate_bundle.py" "$bundle_json" >/dev/null

    name="$(read_json_field "$bundle_json" "metadata.name")"
    PLACEMENT_JSON="$(python3 scripts/select-executor.py "$bundle_json")"
    ver="$(read_json_field "$bundle_json" "metadata.version")"
    out_dir="$(read_json_field "$bundle_json" "spec.artifacts.outDir")"
    backend_intent="$(read_json_field "$bundle_json" "spec.vm.backendIntent")"
    # Caps guard: prevent slow/hanging nested VM backends when executor has no KVM.
    # If backendIntent requests VM, but executor caps.kvm is false, force lima-process.
    if [[ "${backend_intent}" == "qemu" || "${backend_intent}" == "microvm" ]]; then
      # Try read caps.kvm from fleet inventory for default executor (best-effort; empty means unknown)
      KVM_CAP="$(python3 - <<'PYI' 2>/dev/null || true
import json
from pathlib import Path
inv=Path("fleet/inventory.json")
if inv.exists():
    d=json.load(inv.open())
    name=d.get("defaultExecutor")
    for ex in d.get("executors",[]):
        if ex.get("name")==name:
            print(ex.get("caps",{}).get("kvm",""))
PYI
)"
      if [[ "${KVM_CAP}" == "False" || "${KVM_CAP}" == "false" ]]; then
        backend_intent="lima-process"
      fi
    fi

    max_run_seconds="$(read_json_field "$bundle_json" "spec.policy.maxRunSeconds")"
    fail_on_timeout="$(read_json_field "$bundle_json" "spec.policy.failOnTimeout")"
    executor_ref="$(read_json_field_optional "$bundle_json" "spec.executor.ref")"
    smoke_script="$(read_json_field "$bundle_json" "spec.smoke.script")"

    # Local-fast mode: run agent directly in the Lima executor (no nested QEMU under TCG)
    if [[ "${backend_intent}" == "lima-process" ]]; then
      REMOTE="$(echo "${PLACEMENT_JSON}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["sshRef"])' 2>/dev/null || true)"
      REMOTE="${REMOTE:-${executor_ref:-}}"
      if [[ -z "${REMOTE}" ]]; then
        REMOTE="$(read_default_executor_from_inventory || true)"
      fi
      if [[ -z "${REMOTE}" ]]; then
        REMOTE="$(read_first_executor_from_machines || true)"
      fi
      REMOTE="${REMOTE:-lima-nixbuilder}"
      REMOTE_ROOT="/tmp/agentplane-run"
      REMOTE_TIMEOUT="${max_run_seconds}"

      echo "[runner] lima-process: delegating to ${REMOTE} (timeout=${REMOTE_TIMEOUT}s)"
      ssh "${REMOTE}" "mkdir -p ${REMOTE_ROOT}/repo ${REMOTE_ROOT}/artifacts && : > ${REMOTE_ROOT}/artifacts/guest-serial.log"
      rsync -a --delete --exclude ".git/" --exclude "artifacts/" --exclude "state/pointers/" "${AP_ROOT}/" "${REMOTE}:${REMOTE_ROOT}/repo/"

      if [[ "${WATCH}" == "true" ]]; then
        echo "[watch] streaming remote guest-serial.log (tail -F)..."
        ssh "${REMOTE}" "tail -n +1 -F ${REMOTE_ROOT}/artifacts/guest-serial.log 2>/dev/null || true" &
        WATCH_PID=$!
        trap "kill ${WATCH_PID} >/dev/null 2>&1 || true" EXIT
      fi

      set +e
      timeout "${REMOTE_TIMEOUT}" ssh "${REMOTE}" bash -s <<'EOS'
set -euo pipefail
REMOTE_ROOT="/tmp/agentplane-run"
ART="${REMOTE_ROOT}/artifacts"
mkdir -p "${ART}"

# A tiny "agent" run that writes proof artifacts deterministically
echo "[lima-process] hello $(date -Iseconds)" | tee -a "${ART}/guest-serial.log" >/dev/null
echo "[lima-process] proof: $(date -Iseconds)" > "${ART}/guest-proof.txt"

cat > "${ART}/run-artifact.json" <<JSON
{
  "kind": "RunArtifact",
  "bundle": "example-agent@0.1.0",
  "lane": "staging",
  "backend": "lima-process",
  "executedIn": "lima-vm",
  "startedAt": "$(date -Iseconds)",
  "endedAt": "$(date -Iseconds)",
  "result": "pass"
}
JSON
EOS

      RC=$?
      set -e
      echo "${RC}" > "${AP_ROOT}/${out_dir}/runner-exitcode.txt"
      if [[ "${RC}" == "124" ]]; then
        cat > "${AP_ROOT}/${out_dir}/timeout-artifact.json" <<JSON
{
  "kind": "TimeoutArtifact",
  "bundle": "${name}@${ver}",
  "backend": "lima-process",
  "executor": "${REMOTE}",
  "maxRunSeconds": ${REMOTE_TIMEOUT},
  "capturedAt": "$(date -Iseconds)"
}
JSON
        if [[ "${fail_on_timeout}" == "True" || "${fail_on_timeout}" == "true" ]]; then
          echo "[runner] ERROR: timed out after ${REMOTE_TIMEOUT}s (TimeoutArtifact written)" >&2
          rsync -a --delete "${REMOTE}:${REMOTE_ROOT}/artifacts/" "${AP_ROOT}/${out_dir}/" || true
          exit 2
        fi
      fi

      rsync -a --delete "${REMOTE}:${REMOTE_ROOT}/artifacts/" "${AP_ROOT}/${out_dir}/"
      # Replay artifact (fleet-shaped): how to reproduce this run
      cat > "${AP_ROOT}/${out_dir}/replay-artifact.json" <<JSON
{
  "kind": "ReplayArtifact",
  "bundleDir": "${bundle_dir%/}",
  "backend": "lima-process",
  "executor": "${REMOTE}",
  "executorRoot": "${REMOTE_ROOT}",
  "invocation": "./runners/qemu-local.sh run ${bundle_dir%/} --profile ${profile} --system ${TARGET_SYSTEM} --watch",
  "capturedAt": "$(date -Iseconds)"
}
JSON

      echo "[runner] emit placement receipt (host-side scheduling receipt)..."
            echo "${PLACEMENT_JSON}" > "${AP_ROOT}/${out_dir}/placement-decision.json"
      emit_placement_receipt "${AP_ROOT}/${out_dir}" "$name" "$ver" "$profile" "lima-process" "${REMOTE}"
      # Embed PlacementDecision into PlacementReceipt (evidence coherence)
      if [[ -f "${AP_ROOT}/${out_dir}/placement-decision.json" && -f "${AP_ROOT}/${out_dir}/placement-receipt.json" ]]; then
        python3 - <<'PYI' "${AP_ROOT}/${out_dir}/placement-receipt.json" "${AP_ROOT}/${out_dir}/placement-decision.json"
import json,sys
receipt=json.load(open(sys.argv[1],"r",encoding="utf-8"))
decision=json.load(open(sys.argv[2],"r",encoding="utf-8"))
receipt.setdefault("decision", {})["scheduler"] = decision
open(sys.argv[1],"w",encoding="utf-8").write(json.dumps(receipt, indent=2, sort_keys=True)+"\n")
PYI
      fi

      # Drift guard: scheduler sshRef must match executor used
      SCH_REF="$(python3 - <<'PYI' "${AP_ROOT}/${out_dir}/placement-receipt.json" 2>/dev/null || true
import json,sys
r=json.load(open(sys.argv[1],"r",encoding="utf-8"))
print(r.get("decision",{}).get("scheduler",{}).get("sshRef",""))
PYI
)"
      if [[ -n "${SCH_REF}" && "${SCH_REF}" != "${REMOTE}" ]]; then
        echo "[runner] ERROR: scheduler sshRef mismatch: receipt=${SCH_REF} remote=${REMOTE}" >&2
        exit 2
      fi

      # Drift guard: placement receipt backend must match run-artifact backend
      if [[ -f "${AP_ROOT}/${out_dir}/run-artifact.json" && -f "${AP_ROOT}/${out_dir}/placement-receipt.json" ]]; then
        RUN_BACKEND="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["backend"])' 2>/dev/null "${AP_ROOT}/${out_dir}/run-artifact.json" || true)"
        REC_BACKEND="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["decision"]["backend"])' 2>/dev/null "${AP_ROOT}/${out_dir}/placement-receipt.json" || true)"
        if [[ -n "${RUN_BACKEND}" && -n "${REC_BACKEND}" && "${RUN_BACKEND}" != "${REC_BACKEND}" ]]; then
          echo "[runner] ERROR: backend mismatch: run-artifact=${RUN_BACKEND} placement-receipt=${REC_BACKEND}" >&2
          exit 2
        fi
      fi

      echo "[runner] update current-${profile} pointer..."
      printf '%s\n' "${bundle_dir%/}" > "${POINTERS_DIR}/current-${profile}"
      echo "[runner] OK: ${name}@${ver} (${profile}) [lima-process]"
      exit 0
    fi

    echo "[runner] build VM artifact (flake package vm-example-agent)..."
    HOST_SYS="$(uname -s | tr '[:upper:]' '[:lower:]')"
    if [[ "${HOST_SYS}" == "darwin" && "${TARGET_SYSTEM}" == *"-linux" ]]; then
      # On macOS we need a remote Linux builder; building Linux closures locally is not available.
      BUILDERS="$(nix config show 2>/dev/null | awk -F" = " '/^builders =/ {print $2}' | head -n1 | tr -d ' ')"
      if [[ -z "${BUILDERS}" ]]; then
        echo "[runner] ERROR: target system ${TARGET_SYSTEM} requires a remote Linux builder, but nix.builders is empty." >&2
        echo "[runner] Remediation: set builders = ssh-ng://user@<linux-host> ${TARGET_SYSTEM} ... in /etc/nix/nix.conf" >&2
        echo "[runner] This is expected on hotspot/NAT networks with no reachable Linux host." >&2
        exit 2
      fi
    fi
    HOST_SYS="$(uname -s | tr '[:upper:]' '[:lower:]')"
    if [[ "${HOST_SYS}" == "darwin" && "${TARGET_SYSTEM}" == *"-linux" ]]; then
      # On macOS we need a remote Linux builder; building Linux closures locally is not available.
      BUILDERS="$(nix config show 2>/dev/null | awk -F" = " '/^builders =/ {print $2}' | head -n1 | tr -d ' ')"
      if [[ -z "${BUILDERS}" ]]; then
        echo "[runner] ERROR: target system ${TARGET_SYSTEM} requires a remote Linux builder, but nix.builders is empty." >&2
        echo "[runner] Remediation: set builders = ssh-ng://user@<linux-host> ${TARGET_SYSTEM} ... in /etc/nix/nix.conf" >&2
        echo "[runner] This is expected on hotspot/NAT networks with no reachable Linux host." >&2
        exit 2
      fi
    fi
    # Build VM artifact. On Linux, add --extra-experimental-features if needed.
    NIX_PROGRESS_STYLE=none TERM=dumb nix build --log-format raw --quiet ".#packages.${TARGET_SYSTEM}.vm-example-agent" --no-link

    # Find the VM run script from the build output
    VM_OUT="$(nix path-info ".#packages.${TARGET_SYSTEM}.vm-example-agent")"
    RUN_SCRIPT="$(ls -1 "${VM_OUT}"/bin/run-*-vm 2>/dev/null | head -n1 || true)"
    if [[ -z "timeout 900 timeout ${REMOTE_TIMEOUT} ${RUN_SCRIPT} > ${REMOTE_ROOT}/artifacts/guest-serial.log 2>&1; echo $? > ${REMOTE_ROOT}/artifacts/runner-exitcode.txt > ${REMOTE_ROOT}/artifacts/guest-serial.log 2>&1" ]]; then
      echo "[runner] ERROR: could not find run-*-vm script in ${VM_OUT}/bin" >&2
      exit 2
    fi

    echo "[runner] run VM (guest executes smoke and powers off)..."
    mkdir -p "${AP_ROOT}/${out_dir}"

    # If we are on macOS and the target is Linux, we must run the VM on Linux too.
    if [[ "${HOST_SYS}" == "darwin" && "${TARGET_SYSTEM}" == *"-linux" ]]; then
      REMOTE="lima-nixbuilder"
      REMOTE_ROOT="/tmp/agentplane-run"
      ssh "${REMOTE}" "mkdir -p ${REMOTE_ROOT}/repo ${REMOTE_ROOT}/artifacts && : > ${REMOTE_ROOT}/artifacts/guest-serial.log"
      echo "[runner] darwin->linux: delegating build+run to ${REMOTE} (rsync repo + artifacts, run QEMU there, sync artifacts back)"

      # Sync repo (excluding runtime artifacts) to remote
      rsync -a --delete --exclude ".git/" --exclude "artifacts/" --exclude "state/pointers/" "${AP_ROOT}/" "${REMOTE}:${REMOTE_ROOT}/repo/"

      # Sync artifacts dir to remote (so QEMU can mount it)
      rsync -a "${AP_ROOT}/${out_dir}/" "${REMOTE}:${REMOTE_ROOT}/artifacts/" || true

      # Build+run inside remote Linux
      if [[ "${WATCH}" == "true" ]]; then
        echo "[watch] streaming remote guest-serial.log (tail -F)..."
        ssh "${REMOTE}" "tail -n +1 -F ${REMOTE_ROOT}/artifacts/guest-serial.log 2>/dev/null || true" &
        WATCH_PID=$!
        trap "kill ${WATCH_PID} >/dev/null 2>&1 || true" EXIT
      fi
      ssh "${REMOTE}" "mkdir -p ${REMOTE_ROOT}/repo ${REMOTE_ROOT}/artifacts && : > ${REMOTE_ROOT}/artifacts/guest-serial.log"
ssh "${REMOTE}" REMOTE_ROOT="${REMOTE_ROOT}" TARGET_SYSTEM="${TARGET_SYSTEM}" REMOTE_TIMEOUT="${REMOTE_TIMEOUT}" QEMU_OPTS="${QEMU_OPTS:-}" bash -s <<'EOS'
set -euo pipefail
. /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh

cd "${REMOTE_ROOT}/repo"
NIX_PROGRESS_STYLE=none TERM=dumb nix build --log-format raw --quiet ".#packages.${TARGET_SYSTEM}.vm-example-agent" --no-link

VM_OUT="$(nix path-info ".#packages.${TARGET_SYSTEM}.vm-example-agent")"
RUN_SCRIPT="$(ls -1 "${VM_OUT}"/bin/run-*-vm | head -n1)"

mkdir -p "${REMOTE_ROOT}/artifacts"
export QEMU_OPTS="${QEMU_OPTS:-} -virtfs local,path=${REMOTE_ROOT}/artifacts,mount_tag=artifacts,security_model=none,id=artifacts -nographic -serial mon:stdio"

timeout "${REMOTE_TIMEOUT}" "${RUN_SCRIPT}" >> "${REMOTE_ROOT}/artifacts/guest-serial.log" 2>&1
echo "$?" > "${REMOTE_ROOT}/artifacts/runner-exitcode.txt"
EOS


      # Sync artifacts back
      rsync -a --delete "${REMOTE}:${REMOTE_ROOT}/artifacts/" "${AP_ROOT}/${out_dir}/"
      # If timeout fired, mark run as failed (timeout exit code is 124)
      if [[ -f "${AP_ROOT}/${out_dir}/runner-exitcode.txt" ]]; then
        RC="$(cat "${AP_ROOT}/${out_dir}/runner-exitcode.txt" | tr -d '\n\r')"
        if [[ "${RC}" == "124" ]]; then
          echo "[runner] ERROR: VM run timed out after ${REMOTE_TIMEOUT}s; see guest-serial.log" >&2
          exit 2
        fi
      fi

      echo "[runner] emit placement receipt (host-side scheduling receipt)..."
    else
      # Local Linux host path
      export QEMU_OPTS="${QEMU_OPTS:-} -virtfs local,path=${AP_ROOT}/${out_dir},mount_tag=artifacts,security_model=none,id=artifacts"
      "${RUN_SCRIPT}" >/dev/null
      echo "[runner] emit placement receipt (host-side scheduling receipt)..."
    fi
    emit_placement_receipt "${AP_ROOT}/${out_dir}" "$name" "$ver" "$profile" "lima-process" "${REMOTE}"
    echo "[runner] NOTE: run-artifact.json should now be guest-authored in ${out_dir}"

    echo "[runner] update current-${profile} pointer..."
    printf '%s\n' "${bundle_dir%/}" > "${POINTERS_DIR}/current-${profile}"

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
    echo "[runner] promote: staging -> prod pointer swap"
    # move prod to previous-good if set
    if [[ -s "${POINTERS_DIR}/current-prod" ]]; then
      cp -f "${POINTERS_DIR}/current-prod" "${POINTERS_DIR}/previous-good"
    fi
    printf '%s\n' "${bundle_dir%/}" > "${POINTERS_DIR}/current-prod"
    echo "[runner] OK: current-prod -> ${bundle_dir%/}"
    ;;

  rollback)
    ensure_pointers
    if [[ ! -s "${POINTERS_DIR}/previous-good" ]]; then
      echo "[runner] no previous-good pointer set" >&2
      exit 2
    fi
    echo "[runner] rollback: current-prod -> previous-good"
    cp -f "${POINTERS_DIR}/current-prod" "${POINTERS_DIR}/current-staging" 2>/dev/null || true
    cp -f "${POINTERS_DIR}/previous-good" "${POINTERS_DIR}/current-prod"
    echo "[runner] OK: current-prod rolled back"
    ;;

  status)
    ensure_pointers
    echo "[runner] pointers:"
    for f in current-staging current-prod previous-good; do
      printf "  %-14s %s\n" "$f:" "$(cat "${POINTERS_DIR}/${f}" 2>/dev/null || true)"
    done
    ;;

  stop)
    # v0 no-op; future: kill VM pidfiles
    echo "[runner] stop: v0 no-op (no VM yet)"
    ;;

  *)
    usage; exit 2;;
esac
