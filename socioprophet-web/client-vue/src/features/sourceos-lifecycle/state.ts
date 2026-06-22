export type Metric = { name: string; value: number; note: string };
export type KV = { label: string; value: string };
export type Row = { field: string; value: string };
export type LifecycleStatus = 'complete' | 'active' | 'blocked' | 'pending';
export type Check = { name: string; detail: string; status: LifecycleStatus };
export type LifecycleState = { index: string; name: string; status: LifecycleStatus; detail: string; evidence: string };
export type Gate = { gate: string; evidence: string; status: LifecycleStatus; owner: string };

export type SourceOSLifecycleState = {
  sourceMode: 'fixture';
  generatedAt: string;
  readiness: number;
  title: string;
  lede: string;
  boundaryLabel: string;
  boundaryNotice: string;
  metrics: Metric[];
  selectedProfile: KV[];
  assignmentChecks: Check[];
  lifecycle: LifecycleState[];
  releaseSetRows: Row[];
  bootReleaseSetRows: Row[];
  evidenceGates: Gate[];
  blocked: string[];
  nextMoves: string[];
};

export const sourceOSLifecycleState: SourceOSLifecycleState = {
  sourceMode: 'fixture',
  generatedAt: '2026-05-29T00:00:00Z',
  readiness: 47,
  title: 'ReleaseSet and BootReleaseSet assignment',
  lede:
    'Read-only control-plane view for SourceOS boot and recovery lifecycle posture: profile selection, ReleaseSet and BootReleaseSet visibility, lifecycle state, evidence gates, compliance posture, and rollback readiness.',
  boundaryLabel: 'read-only evidence surface',
  boundaryNotice:
    'This page renders lifecycle contracts and fixture-backed evidence only. It does not issue enrollment tokens, mutate boot entries, reboot devices, write disks, or contact hardware. Real host mutation remains blocked behind NLBoot platform adapters, policy approval, explicit acknowledgements, and evidence output.',
  metrics: [
    { name: 'ReleaseSet contract', value: 100, note: 'Schema, example, and validator merged in NLBoot.' },
    { name: 'BootReleaseSet contract', value: 100, note: 'M2 recovery example and lifecycle proof requirements merged.' },
    { name: 'NLBoot dry-run proof', value: 100, note: 'Python and Rust usable-MVP fixture lanes are green.' },
    { name: 'M2 real mutation', value: 0, note: 'Still intentionally blocked until reviewed platform adapter.' },
    { name: 'Control-plane workflow', value: 35, note: 'Static product view exists; backend assignment API not wired.' },
    { name: 'End-to-end demo', value: 47, note: 'Architecture and proof lanes exist; live assignment loop remains.' },
  ],
  selectedProfile: [
    { label: 'Device class', value: 'Apple Silicon M2 laptop' },
    { label: 'Target mode', value: 'SourceOS Recovery / Installer' },
    { label: 'ReleaseSet', value: 'urn:srcos:release-set:m2-demo-2026-04-26' },
    { label: 'BootReleaseSet', value: 'urn:srcos:boot-release-set:m2-demo-recovery-2026-04-26' },
    { label: 'Policy bundle', value: 'urn:srcos:policy-bundle:m2-demo-standard' },
    { label: 'Adapter', value: 'apple-silicon-m2 · dry-run-only' },
  ],
  assignmentChecks: [
    { name: 'One-time enrollment token', detail: 'Required before BootPlan assignment.', status: 'active' },
    { name: 'Device claim', detail: 'Device must bind to assignment before recovery action.', status: 'active' },
    { name: 'Signed manifest', detail: 'RSA-PSS/SHA-256 verification is already proven by NLBoot.', status: 'complete' },
    { name: 'Last-known-good fallback', detail: 'Required; unsigned fallback is forbidden.', status: 'complete' },
    { name: 'Real Apple boot mutation', detail: 'Blocked until platform-specific implementation is reviewed.', status: 'blocked' },
  ],
  lifecycle: [
    { index: '01', name: 'DraftProfile', status: 'complete', detail: 'Target device, experience, agent profile, and boot mode selected.', evidence: 'profile selection record' },
    { index: '02', name: 'ResolvedBOM', status: 'complete', detail: 'BOM/SBOM and closure refs resolved for system/user/agent planes.', evidence: 'ReleaseSet.bom' },
    { index: '03', name: 'Built', status: 'complete', detail: 'ReleaseSet target and artifacts are build-addressable.', evidence: 'build receipt / artifact refs' },
    { index: '04', name: 'Signed', status: 'complete', detail: 'ReleaseSet and manifest signing refs present.', evidence: 'LifecycleStateRecord(sign)' },
    { index: '05', name: 'Assigned', status: 'active', detail: 'Control plane must bind BootReleaseSet to device/user/workspace.', evidence: 'assignment record + enrollment token' },
    { index: '06', name: 'Planned', status: 'complete', detail: 'NLBoot BootPlan emitted only after manifest and token validation.', evidence: 'BootPlan' },
    { index: '07', name: 'Fetched', status: 'complete', detail: 'Artifacts fetched/cache-written with SHA-256 verification.', evidence: 'ArtifactCacheRecord' },
    { index: '08', name: 'Loaded', status: 'complete', detail: 'Linux kexec load-only dry-run proof is green.', evidence: 'pre-exec-proof.json' },
    { index: '09', name: 'Executed', status: 'blocked', detail: 'Real execution/reboot requires explicit host-mutation and reboot acknowledgements.', evidence: 'exec-proof.json / refusal record' },
    { index: '10', name: 'Attested', status: 'pending', detail: 'Post-action fingerprint not yet wired to website control plane.', evidence: 'post-action fingerprint' },
    { index: '11', name: 'Compliant', status: 'pending', detail: 'Compliance decision view not yet backed by live evidence ingestion.', evidence: 'compliance state record' },
    { index: '12', name: 'RollbackAvailable', status: 'active', detail: 'Rollback posture is specified through last-known-good cache.', evidence: 'rollback record' },
  ],
  releaseSetRows: [
    { field: 'releaseSetId', value: 'urn:srcos:release-set:m2-demo-2026-04-26' },
    { field: 'systemPlane', value: 'ostree-silverblue' },
    { field: 'updateModel', value: 'ostree-rebase' },
    { field: 'userSpace', value: 'macos-like-gnome profile + Nix closure' },
    { field: 'agentSpace', value: 'default-devtools profile · container isolation' },
    { field: 'policy', value: 'approval required · guardrail refs present' },
    { field: 'rollback', value: 'last-known-good required · rollback allowed' },
  ],
  bootReleaseSetRows: [
    { field: 'bootReleaseSetId', value: 'urn:srcos:boot-release-set:m2-demo-recovery-2026-04-26' },
    { field: 'bootMode', value: 'recovery' },
    { field: 'channels', value: 'recovery · rollback · rescue' },
    { field: 'artifacts', value: 'kernel · initrd · rootfs · artifact map' },
    { field: 'authorization', value: 'one-time token + device claim required' },
    { field: 'platformAdapters', value: 'apple-silicon-m2 dry-run · linux-kexec load-only' },
    { field: 'offlineFallback', value: 'unsigned fallback denied · last-known-good required' },
  ],
  evidenceGates: [
    { gate: 'Release signing', evidence: 'LifecycleStateRecord(sign)', status: 'complete', owner: 'NLBoot / control plane' },
    { gate: 'Manifest verification', evidence: 'BootPlan', status: 'complete', owner: 'nlboot-client' },
    { gate: 'Artifact verification', evidence: 'ArtifactCacheRecord', status: 'complete', owner: 'nlboot-client' },
    { gate: 'Adapter dry-run', evidence: 'AdapterPlanRecord + BootEntryRecord', status: 'complete', owner: 'nlboot-client' },
    { gate: 'Device assignment', evidence: 'assignment record', status: 'active', owner: 'website control plane' },
    { gate: 'Real boot mutation', evidence: 'host mutation proof + reboot ack', status: 'blocked', owner: 'platform adapter' },
    { gate: 'Post-action compliance', evidence: 'fingerprint + compliance decision', status: 'pending', owner: 'control plane + policy fabric' },
  ],
  blocked: [
    'Real Apple Silicon boot-entry changes.',
    'Installer disk writes.',
    'Rollback execution.',
    'Persistent enrollment-secret storage.',
    'Host repair actions.',
    'Website-backed token issuance and device assignment.',
  ],
  nextMoves: [
    'Create control-plane fixture data package from NLBoot examples.',
    'Add device assignment and enrollment token mock APIs.',
    'Render lifecycle records from fixture JSON instead of static arrays.',
    'Add compliance/rollback dashboard backed by AgentPlane/NLBoot evidence refs.',
    'Wire website action buttons as disabled policy-gated affordances.',
  ],
};
