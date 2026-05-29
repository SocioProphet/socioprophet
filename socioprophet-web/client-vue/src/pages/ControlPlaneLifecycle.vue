<template>
  <section class="evidence-page" aria-labelledby="sourceos-title">
    <header class="evidence-hero">
      <div>
        <p class="evidence-kicker">SourceOS Control Plane · Lifecycle evidence</p>
        <h1 id="sourceos-title">ReleaseSet and BootReleaseSet assignment</h1>
        <p class="evidence-lede">
          Read-only control-plane view for SourceOS boot and recovery lifecycle posture:
          profile selection, ReleaseSet and BootReleaseSet visibility, lifecycle state,
          evidence gates, compliance posture, and rollback readiness.
        </p>
      </div>
      <div class="evidence-scorecard" aria-label="Control plane demo readiness">
        <span class="evidence-score">47%</span>
        <span class="evidence-score-label">demo readiness</span>
      </div>
    </header>

    <section class="evidence-card evidence-boundary">
      <span class="evidence-pill evidence-pill--warn">read-only evidence surface</span>
      <p>
        This page renders lifecycle contracts and fixture-backed evidence only. It does not issue
        enrollment tokens, mutate boot entries, reboot devices, write disks, or contact hardware.
        Real host mutation remains blocked behind NLBoot platform adapters, policy approval,
        explicit acknowledgements, and evidence output.
      </p>
    </section>

    <section class="evidence-grid evidence-grid--metrics" aria-label="Lifecycle lane completion">
      <article v-for="metric in metrics" :key="metric.name" class="evidence-card evidence-metric">
        <div class="evidence-row">
          <span>{{ metric.name }}</span>
          <strong>{{ metric.value }}%</strong>
        </div>
        <div class="evidence-bar" aria-hidden="true"><span :style="{ width: `${metric.value}%` }" /></div>
        <p>{{ metric.note }}</p>
      </article>
    </section>

    <section class="evidence-grid evidence-grid--two">
      <article class="evidence-card">
        <div class="evidence-section-head">
          <div>
            <h2>Selected profile</h2>
            <p>Control-plane input bundle for a recovery proof target.</p>
          </div>
          <span class="evidence-pill">fixture</span>
        </div>
        <dl class="evidence-kv">
          <div v-for="item in selectedProfile" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </article>

      <article class="evidence-card">
        <div class="evidence-section-head">
          <div>
            <h2>Assignment posture</h2>
            <p>Device and token bindings required before a boot plan may be issued.</p>
          </div>
          <span class="evidence-pill evidence-pill--warn">gated</span>
        </div>
        <ul class="evidence-list evidence-check-list">
          <li v-for="check in assignmentChecks" :key="check.name" :class="`evidence-check evidence-check--${check.status}`">
            <span class="evidence-dot" aria-hidden="true" />
            <div>
              <strong>{{ check.name }}</strong>
              <p>{{ check.detail }}</p>
            </div>
          </li>
        </ul>
      </article>
    </section>

    <section class="evidence-card">
      <div class="evidence-section-head">
        <div>
          <h2>Lifecycle state machine</h2>
          <p>Each transition should emit a lifecycle state record or refusal record.</p>
        </div>
        <span class="evidence-pill">{{ lifecycle.length }} states</span>
      </div>
      <ol class="evidence-timeline">
        <li v-for="state in lifecycle" :key="state.name" class="evidence-state">
          <div class="evidence-state-index">{{ state.index }}</div>
          <div class="evidence-state-body">
            <div class="evidence-row">
              <strong>{{ state.name }}</strong>
              <span :class="`evidence-status evidence-status--${state.status}`">{{ state.status }}</span>
            </div>
            <p>{{ state.detail }}</p>
            <code>{{ state.evidence }}</code>
          </div>
        </li>
      </ol>
    </section>

    <section class="evidence-grid evidence-grid--two">
      <article class="evidence-card">
        <h2>ReleaseSet</h2>
        <p class="evidence-desc">
          Signed lifecycle release binding system target, user-space closure, agent-space closure,
          policy, BOM, rollback, and evidence requirements.
        </p>
        <table class="evidence-table"><tbody><tr v-for="row in releaseSetRows" :key="row.field"><th>{{ row.field }}</th><td>{{ row.value }}</td></tr></tbody></table>
      </article>

      <article class="evidence-card">
        <h2>BootReleaseSet</h2>
        <p class="evidence-desc">
          Bootable recovery object binding ReleaseSet to signed manifest, artifacts,
          platform adapters, authorization, offline fallback, signing, and proof requirements.
        </p>
        <table class="evidence-table"><tbody><tr v-for="row in bootReleaseSetRows" :key="row.field"><th>{{ row.field }}</th><td>{{ row.value }}</td></tr></tbody></table>
      </article>
    </section>

    <section class="evidence-card">
      <div class="evidence-section-head">
        <div>
          <h2>Evidence gates</h2>
          <p>Control-plane acceptance requires every proof lane to be present or refused.</p>
        </div>
        <span class="evidence-pill evidence-pill--active">evidence-forward</span>
      </div>
      <table class="evidence-table evidence-table--wide">
        <thead><tr><th>Gate</th><th>Required evidence</th><th>State</th><th>Owner</th></tr></thead>
        <tbody>
          <tr v-for="gate in evidenceGates" :key="gate.gate">
            <td>{{ gate.gate }}</td>
            <td>{{ gate.evidence }}</td>
            <td><span :class="`evidence-status evidence-status--${gate.status}`">{{ gate.status }}</span></td>
            <td>{{ gate.owner }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="evidence-grid evidence-grid--two">
      <article class="evidence-card">
        <h2>Blocked until reviewed implementation</h2>
        <ul class="evidence-list"><li v-for="item in blocked" :key="item">{{ item }}</li></ul>
      </article>
      <article class="evidence-card">
        <h2>Next implementation moves</h2>
        <ul class="evidence-list"><li v-for="item in nextMoves" :key="item">{{ item }}</li></ul>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
type Metric = { name: string; value: number; note: string };
type KV = { label: string; value: string };
type Row = { field: string; value: string };
type Status = 'complete' | 'active' | 'blocked' | 'pending';
type Check = { name: string; detail: string; status: Status };
type State = { index: string; name: string; status: Status; detail: string; evidence: string };
type Gate = { gate: string; evidence: string; status: Status; owner: string };

const metrics: Metric[] = [
  { name: 'ReleaseSet contract', value: 100, note: 'Schema, example, and validator merged in NLBoot.' },
  { name: 'BootReleaseSet contract', value: 100, note: 'M2 recovery example and lifecycle proof requirements merged.' },
  { name: 'NLBoot dry-run proof', value: 100, note: 'Python and Rust usable-MVP fixture lanes are green.' },
  { name: 'M2 real mutation', value: 0, note: 'Still intentionally blocked until reviewed platform adapter.' },
  { name: 'Control-plane workflow', value: 35, note: 'Static product view exists; backend assignment API not wired.' },
  { name: 'End-to-end demo', value: 47, note: 'Architecture and proof lanes exist; live assignment loop remains.' },
];

const selectedProfile: KV[] = [
  { label: 'Device class', value: 'Apple Silicon M2 laptop' },
  { label: 'Target mode', value: 'SourceOS Recovery / Installer' },
  { label: 'ReleaseSet', value: 'urn:srcos:release-set:m2-demo-2026-04-26' },
  { label: 'BootReleaseSet', value: 'urn:srcos:boot-release-set:m2-demo-recovery-2026-04-26' },
  { label: 'Policy bundle', value: 'urn:srcos:policy-bundle:m2-demo-standard' },
  { label: 'Adapter', value: 'apple-silicon-m2 · dry-run-only' },
];

const assignmentChecks: Check[] = [
  { name: 'One-time enrollment token', detail: 'Required before BootPlan assignment.', status: 'active' },
  { name: 'Device claim', detail: 'Device must bind to assignment before recovery action.', status: 'active' },
  { name: 'Signed manifest', detail: 'RSA-PSS/SHA-256 verification is already proven by NLBoot.', status: 'complete' },
  { name: 'Last-known-good fallback', detail: 'Required; unsigned fallback is forbidden.', status: 'complete' },
  { name: 'Real Apple boot mutation', detail: 'Blocked until platform-specific implementation is reviewed.', status: 'blocked' },
];

const lifecycle: State[] = [
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
];

const releaseSetRows: Row[] = [
  { field: 'releaseSetId', value: 'urn:srcos:release-set:m2-demo-2026-04-26' },
  { field: 'systemPlane', value: 'ostree-silverblue' },
  { field: 'updateModel', value: 'ostree-rebase' },
  { field: 'userSpace', value: 'macos-like-gnome profile + Nix closure' },
  { field: 'agentSpace', value: 'default-devtools profile · container isolation' },
  { field: 'policy', value: 'approval required · guardrail refs present' },
  { field: 'rollback', value: 'last-known-good required · rollback allowed' },
];

const bootReleaseSetRows: Row[] = [
  { field: 'bootReleaseSetId', value: 'urn:srcos:boot-release-set:m2-demo-recovery-2026-04-26' },
  { field: 'bootMode', value: 'recovery' },
  { field: 'channels', value: 'recovery · rollback · rescue' },
  { field: 'artifacts', value: 'kernel · initrd · rootfs · artifact map' },
  { field: 'authorization', value: 'one-time token + device claim required' },
  { field: 'platformAdapters', value: 'apple-silicon-m2 dry-run · linux-kexec load-only' },
  { field: 'offlineFallback', value: 'unsigned fallback denied · last-known-good required' },
];

const evidenceGates: Gate[] = [
  { gate: 'Release signing', evidence: 'LifecycleStateRecord(sign)', status: 'complete', owner: 'NLBoot / control plane' },
  { gate: 'Manifest verification', evidence: 'BootPlan', status: 'complete', owner: 'nlboot-client' },
  { gate: 'Artifact verification', evidence: 'ArtifactCacheRecord', status: 'complete', owner: 'nlboot-client' },
  { gate: 'Adapter dry-run', evidence: 'AdapterPlanRecord + BootEntryRecord', status: 'complete', owner: 'nlboot-client' },
  { gate: 'Device assignment', evidence: 'assignment record', status: 'active', owner: 'website control plane' },
  { gate: 'Real boot mutation', evidence: 'host mutation proof + reboot ack', status: 'blocked', owner: 'platform adapter' },
  { gate: 'Post-action compliance', evidence: 'fingerprint + compliance decision', status: 'pending', owner: 'control plane + policy fabric' },
];

const blocked = [
  'Real Apple Silicon boot-entry changes.',
  'Installer disk writes.',
  'Rollback execution.',
  'Persistent enrollment-secret storage.',
  'Host repair actions.',
  'Website-backed token issuance and device assignment.',
];

const nextMoves = [
  'Create control-plane fixture data package from NLBoot examples.',
  'Add device assignment and enrollment token mock APIs.',
  'Render lifecycle records from fixture JSON instead of static arrays.',
  'Add compliance/rollback dashboard backed by AgentPlane/NLBoot evidence refs.',
  'Wire website action buttons as disabled policy-gated affordances.',
];
</script>

<style scoped>
.evidence-page { display: flex; flex-direction: column; gap: 1rem; color: var(--text, #f4f4f4); }
.evidence-hero, .evidence-card { border: 1px solid rgba(255,255,255,.14); border-radius: 18px; background: rgba(20,24,31,.82); box-shadow: 0 18px 48px rgba(0,0,0,.22); }
.evidence-hero { display: flex; justify-content: space-between; gap: 2rem; padding: 1.5rem; }
.evidence-kicker { margin: 0 0 .4rem; color: var(--accent, #78a9ff); font-size: .78rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
h1, h2, p { margin-top: 0; }
h1 { margin-bottom: .7rem; font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1; }
h2 { margin-bottom: .65rem; font-size: 1.15rem; }
.evidence-lede, .evidence-desc, .evidence-card p, .evidence-check p, .evidence-state p { color: rgba(255,255,255,.70); line-height: 1.55; }
.evidence-lede { max-width: 780px; margin-bottom: 0; }
.evidence-scorecard { min-width: 180px; align-self: stretch; display: grid; place-content: center; border-radius: 16px; background: linear-gradient(145deg, rgba(120,169,255,.22), rgba(36,161,72,.18)); text-align: center; }
.evidence-score { display: block; font-size: 3.2rem; font-weight: 800; }
.evidence-score-label { color: rgba(255,255,255,.72); font-size: .82rem; text-transform: uppercase; letter-spacing: .08em; }
.evidence-grid { display: grid; gap: 1rem; }
.evidence-grid--metrics { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.evidence-grid--two { grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); }
.evidence-card { padding: 1rem; }
.evidence-boundary { border-color: rgba(241,194,27,.45); background: rgba(241,194,27,.08); }
.evidence-row, .evidence-section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.evidence-metric strong { font-size: 1.35rem; }
.evidence-bar { height: .55rem; margin: .75rem 0; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.12); }
.evidence-bar span { display: block; height: 100%; border-radius: inherit; background: var(--accent, #78a9ff); }
.evidence-pill, .evidence-status { display: inline-flex; align-items: center; border-radius: 999px; padding: .18rem .55rem; font-size: .72rem; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
.evidence-pill { background: rgba(120,169,255,.15); color: var(--accent, #78a9ff); }
.evidence-pill--active, .evidence-status--complete { background: rgba(36,161,72,.18); color: #42be65; }
.evidence-pill--warn, .evidence-status--active { background: rgba(241,194,27,.18); color: #f1c21b; }
.evidence-status--blocked { background: rgba(250,77,86,.18); color: #fa4d56; }
.evidence-status--pending { background: rgba(255,255,255,.12); color: rgba(255,255,255,.72); }
.evidence-kv { display: grid; gap: .65rem; margin: 0; }
.evidence-kv div { display: grid; gap: .2rem; padding-bottom: .55rem; border-bottom: 1px solid rgba(255,255,255,.09); }
.evidence-kv dt { color: rgba(255,255,255,.58); font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
.evidence-kv dd { margin: 0; font-weight: 650; }
.evidence-list { padding-left: 0; list-style: none; }
.evidence-list li { margin-bottom: .55rem; color: rgba(255,255,255,.72); }
.evidence-check { display: flex; gap: .75rem; margin-bottom: .8rem; }
.evidence-dot { flex: 0 0 .75rem; width: .75rem; height: .75rem; margin-top: .35rem; border-radius: 50%; background: rgba(255,255,255,.4); }
.evidence-check--complete .evidence-dot { background: #42be65; }
.evidence-check--active .evidence-dot { background: #f1c21b; }
.evidence-check--blocked .evidence-dot { background: #fa4d56; }
.evidence-timeline { display: grid; gap: .75rem; padding-left: 0; list-style: none; }
.evidence-state { display: grid; grid-template-columns: 3.2rem 1fr; gap: .8rem; }
.evidence-state-index { display: grid; place-content: center; width: 2.5rem; height: 2.5rem; border-radius: 50%; border: 1px solid rgba(255,255,255,.18); color: rgba(255,255,255,.74); font-weight: 800; }
.evidence-state-body { padding: .85rem; border: 1px solid rgba(255,255,255,.1); border-radius: 14px; background: rgba(255,255,255,.04); }
.evidence-state code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .78rem; color: rgba(255,255,255,.72); }
.evidence-table { width: 100%; border-collapse: collapse; }
.evidence-table th, .evidence-table td { padding: .65rem .5rem; border-bottom: 1px solid rgba(255,255,255,.1); text-align: left; vertical-align: top; }
.evidence-table th { color: rgba(255,255,255,.6); font-size: .76rem; text-transform: uppercase; letter-spacing: .05em; }
@media (max-width: 760px) { .evidence-hero { flex-direction: column; } .evidence-scorecard { min-height: 140px; } .evidence-state { grid-template-columns: 1fr; } }
</style>
