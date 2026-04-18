#!/usr/bin/env bash
set -euo pipefail

require_file() {
  local p="$1"
  [[ -s "$p" ]] || { echo "[runner] missing required artifact: $p" >&2; return 1; }
}

bundle_out_dir() {
  local bundle_json="$1"
  python3 - "$bundle_json" <<'PY'
import json, sys
b = json.load(open(sys.argv[1], "r", encoding="utf-8"))
print(b["spec"]["artifacts"]["outDir"])
PY
}

bundle_lane() {
  local bundle_json="$1"
  python3 - "$bundle_json" <<'PY'
import json, sys
b = json.load(open(sys.argv[1], "r", encoding="utf-8"))
print((b.get("spec") or {}).get("policy", {}).get("lane", ""))
PY
}

check_bundle_exists() {
  local bundle_dir="$1"
  [[ -d "${bundle_dir%/}" && -f "${bundle_dir%/}/bundle.json" ]]
}

check_bundle_closure() {
  local bundle_json="$1"
  local ap_root="$2"
  local out_dir abs_out
  out_dir="$(bundle_out_dir "$bundle_json")" || return 1
  if [[ "${out_dir}" = /* ]]; then
    abs_out="${out_dir}"
  else
    abs_out="${ap_root%/}/${out_dir}"
  fi

  require_file "${abs_out}/validation-artifact.json" || return 1
  require_file "${abs_out}/run-artifact.json" || return 1
  require_file "${abs_out}/placement-receipt.json" || return 1
  require_file "${abs_out}/replay-artifact.json" || return 1

  python3 - <<'PY' "${abs_out}/validation-artifact.json" "${abs_out}/run-artifact.json" "${abs_out}/placement-receipt.json"
import json, sys

val = json.load(open(sys.argv[1], "r", encoding="utf-8"))
run = json.load(open(sys.argv[2], "r", encoding="utf-8"))
rec = json.load(open(sys.argv[3], "r", encoding="utf-8"))

assert val.get("kind") == "ValidationArtifact"
assert val.get("result") == "pass"

assert isinstance(run.get("backend"), str) and run["backend"]

decision = rec.get("decision", {})
assert isinstance(decision.get("backend"), str) and decision["backend"]
sched = decision.get("scheduler", {})
assert isinstance(sched.get("sshRef"), str) and sched["sshRef"]

assert run["backend"] == decision["backend"]
PY
}

assert_profile_lane_match() {
  local bundle_json="$1"
  local profile="$2"
  local lane
  lane="$(bundle_lane "$bundle_json")"
  if [[ "$profile" == "prod" && "$lane" != "prod" ]]; then
    echo "[runner] ERROR: bundle lane=${lane} cannot advance current-prod without explicit override" >&2
    return 1
  fi
}

emit_pointer_mutation_receipt() {
  local ap_root="$1"
  local cmd="$2"
  local pointer="$3"
  local old_target="$4"
  local new_target="$5"
  local bundle_json="${new_target%/}/bundle.json"
  local out_dir
  out_dir="$(bundle_out_dir "$bundle_json")" || return 1
  local abs_out hist_dir ts receipt
  if [[ "${out_dir}" = /* ]]; then
    abs_out="${out_dir}"
  else
    abs_out="${ap_root%/}/${out_dir}"
  fi
  hist_dir="${ap_root%/}/state/history"
  mkdir -p "${hist_dir}"
  ts="$(date -u +%Y%m%dT%H%M%SZ)"
  receipt="${hist_dir}/pointer-mutation-${ts}.json"

  python3 - <<'PY' "$bundle_json" "$cmd" "$pointer" "$old_target" "$new_target" "$abs_out" "$receipt"
import datetime, json, os, sys
bundle_json, cmd, pointer, old_target, new_target, abs_out, receipt = sys.argv[1:]
b = json.load(open(bundle_json, "r", encoding="utf-8"))
md = b.get("metadata") or {}
pol = (b.get("spec") or {}).get("policy") or {}
report = {
    "kind": "PointerMutationReceipt",
    "capturedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "command": cmd,
    "pointer": pointer,
    "oldTarget": old_target or None,
    "newTarget": new_target,
    "bundle": {
        "path": new_target,
        "name": md.get("name"),
        "version": md.get("version"),
        "lane": pol.get("lane"),
    },
    "closure": {
        "validationArtifact": os.path.join(abs_out, "validation-artifact.json"),
        "runArtifact": os.path.join(abs_out, "run-artifact.json"),
        "placementReceipt": os.path.join(abs_out, "placement-receipt.json"),
        "replayArtifact": os.path.join(abs_out, "replay-artifact.json"),
    },
}
json.dump(report, open(receipt, "w", encoding="utf-8"), indent=2, sort_keys=True)
print(receipt)
PY
}

status_verify() {
  local ap_root="$1"
  local pointer_dir="${ap_root%/}/state/pointers"
  for f in current-staging current-prod previous-good; do
    local target
    target="$(cat "${pointer_dir}/${f}" 2>/dev/null || true)"
    if [[ -z "${target}" ]]; then
      echo "${f}: <unset>"
      continue
    fi
    if ! check_bundle_exists "${target}"; then
      echo "${f}: BROKEN (missing bundle)"
      continue
    fi
    if ! check_bundle_closure "${target%/}/bundle.json" "${ap_root}"; then
      echo "${f}: BROKEN (closure invalid)"
      continue
    fi
    echo "${f}: OK -> ${target}"
  done
}
