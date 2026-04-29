#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export AGENTPLANE_SKIP_SSH=1
GEN="${ROOT}/agentplane/tests/generated"

cleanup() {
  rm -rf "${ROOT}/state" "${GEN}"
}
trap cleanup EXIT

ok() { echo "[ok] $*"; }
fail() { echo "[fail] $*" >&2; exit 1; }

python3 - <<'PY' "${GEN}"
from pathlib import Path
import json, sys, shutil
root = Path(sys.argv[1])
if root.exists():
    shutil.rmtree(root)
root.mkdir(parents=True)

def write_json(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2, sort_keys=True)+"\n")

def make_bundle(dir_name, *, lane='prod', dirty=False, rev='3907fc4f3788ff5b7e4002731c35b56f63119a4b', policy_hash='sha256:testpack', backend='lima-process', requested_ref=None):
    d = root/dir_name
    d.mkdir(parents=True, exist_ok=True)
    bundle = {
      'apiVersion':'agentplane.socioprophet.org/v0.1','kind':'Bundle',
      'metadata':{'createdAt':'2026-04-01T00:00:00Z','licensePolicy':{'allowAGPL':False},'name':dir_name,'version':'0.1.0','source':{'git':{'dirty':dirty,'rev':rev}}},
      'spec':{
        'artifacts':{'outDir':'artifacts'},
        'policy':{'failOnTimeout':True,'humanGateRequired':False,'lane':lane,'maxRunSeconds':20,'policyPackHash':policy_hash,'policyPackRef':'policy-packs/test/default'},
        'secrets':{'required':['EXAMPLE_AGENT_TOKEN_FILE'],'secretRefRoot':'secrets://user'},
        'smoke':{'script':'bundles/example-agent/smoke.sh'},
        'vm':{'backendIntent':backend,'modulePath':'bundles/example-agent/vm.nix'}
      }
    }
    if requested_ref:
        bundle['spec']['executor']={'ref':requested_ref}
    write_json(d/'bundle.json', bundle)
    return d, bundle

def write_closure(d, bundle, *, receipt_backend='lima-process', run_backend='lima-process', scheduler_ref='lima-nixbuilder', effective_backend=None, chosen_executor='lima-nixbuilder'):
    out = d/'artifacts'
    out.mkdir(exist_ok=True)
    name=bundle['metadata']['name']; ver=bundle['metadata']['version']; backend_intent=bundle['spec']['vm']['backendIntent']
    write_json(out/'validation-artifact.json', {'kind':'ValidationArtifact','bundle':f'{name}@{ver}','bundlePath':str((d/'bundle.json').resolve()),'validatedAt':'2026-04-01T00:00:00Z','result':'pass'})
    pd={'kind':'PlacementDecision','capturedAt':'2026-04-01T00:00:00Z','backendIntent':backend_intent,'requiresKvm':(effective_backend or backend_intent) in ('qemu','microvm'),'chosenExecutor':chosen_executor,'sshRef':scheduler_ref,'caps':{'os':'linux','arch':'aarch64','kvm':False},'rejected':[]}
    if effective_backend is not None:
        pd['effectiveBackend']=effective_backend
        pd['requestedExecutorRef']=bundle.get('spec',{}).get('executor',{}).get('ref')
        pd['normalized']=effective_backend != backend_intent
        pd['normalizationReason']='no-reachable-kvm-executor' if pd['normalized'] else None
    write_json(out/'placement-decision.json', pd)
    write_json(out/'placement-receipt.json', {'kind':'PlacementReceipt','bundle':f'{name}@{ver}','decision':{'chosenSite':scheduler_ref,'backend':receipt_backend,'constraints':{'lane':bundle['spec']['policy']['lane']},'rejectedSites':[],'scheduler':pd},'signedBy':'UNSET','createdAt':'2026-04-01T00:00:00Z'})
    write_json(out/'run-artifact.json', {'kind':'RunArtifact','bundle':f'{name}@{ver}','lane':bundle['spec']['policy']['lane'],'backend':run_backend,'result':'pass'})
    write_json(out/'replay-artifact.json', {'kind':'ReplayArtifact','bundleDir':str(d.resolve()),'backend':run_backend,'executor':scheduler_ref,'capturedAt':'2026-04-01T00:00:00Z'})

cases = [
    ('ok-prod', dict(lane='prod')),
    ('vm-normalizes-on-no-kvm', dict(lane='prod', backend='qemu')),
    ('governed-unpinned', dict(lane='staging', dirty=True, rev='UNSET', policy_hash='UNSET')),
    ('explicit-executor-mismatch', dict(lane='prod', requested_ref='expected-executor')),
    ('backend-drift', dict(lane='prod')),
    ('prod-pointer-to-staging-lane', dict(lane='staging')),
    ('promote-without-closure', dict(lane='prod')),
]
for name,opts in cases:
    d,b = make_bundle(name, **opts)
    if name == 'governed-unpinned':
        write_closure(d,b)
    elif name == 'explicit-executor-mismatch':
        write_closure(d,b, scheduler_ref='different-executor')
    elif name == 'backend-drift':
        write_closure(d,b, receipt_backend='lima-process', run_backend='qemu')
    elif name == 'prod-pointer-to-staging-lane':
        write_closure(d,b)
    elif name == 'promote-without-closure':
        out=d/'artifacts'; out.mkdir(exist_ok=True)
        write_json(out/'validation-artifact.json', {'kind':'ValidationArtifact','bundle':f"{b['metadata']['name']}@{b['metadata']['version']}",'bundlePath':str((d/'bundle.json').resolve()),'validatedAt':'2026-04-01T00:00:00Z','result':'pass'})
        write_json(out/'placement-decision.json', {'kind':'PlacementDecision','capturedAt':'2026-04-01T00:00:00Z','backendIntent':'lima-process','effectiveBackend':'lima-process','requiresKvm':False,'chosenExecutor':'lima-nixbuilder','sshRef':'lima-nixbuilder','caps':{'os':'linux','arch':'aarch64','kvm':False},'rejected':[]})
        write_json(out/'placement-receipt.json', {'kind':'PlacementReceipt','decision':{'backend':'lima-process','scheduler':{'sshRef':'lima-nixbuilder'}}})
        write_json(out/'run-artifact.json', {'kind':'RunArtifact','backend':'lima-process'})
    elif name == 'vm-normalizes-on-no-kvm':
        write_closure(d,b, receipt_backend='lima-process', run_backend='lima-process', scheduler_ref='lima-nixbuilder', effective_backend='lima-process')
    else:
        write_closure(d,b, effective_backend='lima-process')
PY

run_expect_pass() {
  local bundle="$1"
  local profile="${2:-staging}"
  if python3 "${ROOT}/agentplane/scripts/check_deployment_invariants.py" "${bundle}" "${profile}" >/tmp/agentplane-check.json 2>/tmp/agentplane-check.err; then
    ok "PASS expected and received for ${bundle} (${profile})"
  else
    cat /tmp/agentplane-check.json >&2 || true
    cat /tmp/agentplane-check.err >&2 || true
    fail "expected PASS for ${bundle} (${profile})"
  fi
}

run_expect_fail() {
  local bundle="$1"
  local profile="${2:-staging}"
  if python3 "${ROOT}/agentplane/scripts/check_deployment_invariants.py" "${bundle}" "${profile}" >/tmp/agentplane-check.json 2>/tmp/agentplane-check.err; then
    cat /tmp/agentplane-check.json >&2 || true
    fail "expected FAIL for ${bundle} (${profile})"
  else
    ok "FAIL expected and received for ${bundle} (${profile})"
  fi
}

FIX="${GEN}"

run_expect_pass "${FIX}/ok-prod/bundle.json" prod
run_expect_pass "${FIX}/vm-normalizes-on-no-kvm/bundle.json" prod

run_expect_fail "${FIX}/governed-unpinned/bundle.json" staging
run_expect_fail "${FIX}/explicit-executor-mismatch/bundle.json" prod
run_expect_fail "${FIX}/backend-drift/bundle.json" prod
run_expect_fail "${FIX}/prod-pointer-to-staging-lane/bundle.json" prod
run_expect_fail "${FIX}/promote-without-closure/bundle.json" prod

mkdir -p "${ROOT}/state/pointers"
printf '%s\n' "${FIX}/ok-prod" > "${ROOT}/state/pointers/current-staging"
printf '%s\n' "${FIX}/ok-prod" > "${ROOT}/state/pointers/current-prod"
printf '%s\n' "${FIX}/ok-prod" > "${ROOT}/state/pointers/previous-good"
run_expect_pass "${FIX}/ok-prod/bundle.json" prod

printf '%s\n' "${FIX}/prod-pointer-to-staging-lane" > "${ROOT}/state/pointers/current-prod"
run_expect_fail "${FIX}/ok-prod/bundle.json" prod

python3 "${ROOT}/formal/check_deploy_model.py"
ok "formal Python state exploration passed"
