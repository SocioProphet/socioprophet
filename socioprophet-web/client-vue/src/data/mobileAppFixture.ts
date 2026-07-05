// Fixture-backed app build/release board for the
// /capability/mobile-app-development surface — the platform's shippable apps
// (BearBrowser, TurtleTerm, Noetica, SourceOS) with build pipelines, platform
// targets, and release channels. Deterministic; a live CI/build adapter (Forge /
// cross-platform packaging) swaps in behind the same shape.

export type AppKind = 'mobile' | 'desktop' | 'pwa' | 'os-image';
export type BuildStatus = 'published' | 'building' | 'review' | 'failed';
export type StepStatus = 'done' | 'active' | 'blocked' | 'pending';

export interface PlatformTarget { os: string; channel: string; version: string; status: 'live' | 'staged' | 'pending' | 'failed' }
export interface PipelineStep { step: string; status: StepStatus }
export interface Release { version: string; date: string; notes: string }

export interface App {
  id: string;
  name: string;
  kind: AppKind;
  version: string;
  status: BuildStatus;
  progress: number; // 0..100 for the active build
  platforms: PlatformTarget[];
  pipeline: PipelineStep[];
  artifact: { format: string; size: string; hash: string };
  releases: Release[];
  note: string;
}

export const apps: App[] = [
  {
    id: 'bearbrowser',
    name: 'BearBrowser',
    kind: 'desktop',
    version: '0.9.2',
    status: 'building',
    progress: 62,
    platforms: [
      { os: 'macOS', channel: 'stable', version: '0.9.1', status: 'live' },
      { os: 'Linux', channel: 'stable', version: '0.9.1', status: 'live' },
      { os: 'Windows', channel: 'beta', version: '0.9.2', status: 'staged' },
    ],
    pipeline: [
      { step: 'Checkout', status: 'done' },
      { step: 'Compile engine', status: 'done' },
      { step: 'Anti-fingerprint shield', status: 'active' },
      { step: 'Sign', status: 'pending' },
      { step: 'Package', status: 'pending' },
      { step: 'Publish', status: 'pending' },
    ],
    artifact: { format: 'dmg / AppImage / exe', size: '148 MB', hash: 'sha256:be47…20fa' },
    releases: [
      { version: '0.9.1', date: '2026-06-28', notes: 'Gecko profile hardened; JS shield 101/101.' },
      { version: '0.9.0', date: '2026-06-14', notes: 'First binary + agent-bridge injection containment.' },
    ],
    note: 'Anti-fingerprinting build in progress on the GCP compile runner. Windows on beta pending signing.',
  },
  {
    id: 'turtleterm',
    name: 'TurtleTerm',
    kind: 'desktop',
    version: '1.4.0',
    status: 'published',
    progress: 100,
    platforms: [
      { os: 'macOS', channel: 'stable', version: '1.4.0', status: 'live' },
      { os: 'Linux', channel: 'stable', version: '1.4.0', status: 'live' },
      { os: 'brew / nix', channel: 'stable', version: '1.4.0', status: 'live' },
    ],
    pipeline: [
      { step: 'Checkout', status: 'done' },
      { step: 'Build', status: 'done' },
      { step: 'Sign', status: 'done' },
      { step: 'Package', status: 'done' },
      { step: 'Publish', status: 'done' },
    ],
    artifact: { format: 'pkg / deb / nix', size: '42 MB', hash: 'sha256:7c19…a4d2' },
    releases: [
      { version: '1.4.0', date: '2026-07-01', notes: 'Turtle-language bridge to SynapseIQ LSP.' },
    ],
    note: 'Shipped across brew/nix and deb. Reasoning-run emitter conforms to sourceos-spec v2.',
  },
  {
    id: 'noetica-app',
    name: 'Noetica',
    kind: 'pwa',
    version: '0.6.0',
    status: 'review',
    progress: 90,
    platforms: [
      { os: 'Web (PWA)', channel: 'stable', version: '0.6.0', status: 'live' },
      { os: 'iOS', channel: 'testflight', version: '0.6.0', status: 'staged' },
      { os: 'Android', channel: 'internal', version: '0.6.0', status: 'pending' },
    ],
    pipeline: [
      { step: 'Checkout', status: 'done' },
      { step: 'Build (Vite)', status: 'done' },
      { step: 'PWA manifest + SW', status: 'done' },
      { step: 'Store review', status: 'active' },
      { step: 'Publish', status: 'pending' },
    ],
    artifact: { format: 'PWA / ipa', size: '9 MB', hash: 'sha256:31ab…9c07' },
    releases: [
      { version: '0.6.0', date: '2026-07-02', notes: 'Chat social surface + operator cockpit.' },
    ],
    note: 'PWA live; iOS build in TestFlight review. Android internal track pending signing config.',
  },
  {
    id: 'sourceos',
    name: 'SourceOS Image',
    kind: 'os-image',
    version: '2026.07',
    status: 'failed',
    progress: 34,
    platforms: [
      { os: 'Apple Silicon (Asahi)', channel: 'stable', version: '2026.06', status: 'live' },
      { os: 'x86_64', channel: 'stable', version: '2026.07', status: 'failed' },
    ],
    pipeline: [
      { step: 'Compose (COSA)', status: 'done' },
      { step: 'Bake packages', status: 'done' },
      { step: 'Bless bootloader', status: 'blocked' },
      { step: 'Sign', status: 'pending' },
      { step: 'Publish', status: 'pending' },
    ],
    artifact: { format: 'raw / iso', size: '3.1 GB', hash: 'sha256:0af2…placeholder' },
    releases: [
      { version: '2026.06', date: '2026-06-20', notes: 'elementary.io-style downloads; Asahi package.' },
    ],
    note: 'x86_64 build blocked at bootloader bless (wrong chainloader blessed). Fix pending from 1TR.',
  },
];

export const asOf = '2026-07-03T14:00:00-04:00';
