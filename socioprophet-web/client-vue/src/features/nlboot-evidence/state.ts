export type KV = { field: string; value: string };
export type ArtifactEntry = { name: string; digest: string; source: string; status: 'hit' | 'miss' | 'pending' };
export type CheckEntry = { check: string; detail: string; result: 'pass' | 'fail' | 'warn' };
export type CapabilityEntry = { capability: string; detected: boolean; note: string };

export type NLBootEvidenceState = {
  sourceMode: 'fixture';
  generatedAt: string;
  title: string;
  lede: string;
  boundaryLabel: string;
  boundaryNotice: string;
  recordTypeCount: number;
  planRecord: KV[];
  artifactCache: ArtifactEntry[];
  preExecProof: CheckEntry[];
  execProof: KV[];
  appleAdapter: CapabilityEntry[];
  bootEntry: KV[];
};

export const nlbootEvidenceState: NLBootEvidenceState = {
  sourceMode: 'fixture',
  generatedAt: '2026-05-29T00:00:00Z',
  title: 'Boot evidence artifacts',
  lede:
    'Read-only evidence records produced by an NLBoot run: plan, artifact cache, pre-exec proof, exec proof, adapter record, and boot-entry record. All data is mock-fixture only.',
  boundaryLabel: 'evidence only',
  boundaryNotice:
    'This dashboard displays evidence records only. It does not issue boot commands, modify EFI state, reboot devices, write disks, or interact with host hardware.',
  recordTypeCount: 6,
  planRecord: [
    { field: 'plan_id', value: 'nlboot-plan-20260430-001' },
    { field: 'schema_version', value: '0.4.0' },
    { field: 'target_platform', value: 'apple-silicon-m3' },
    { field: 'os_image', value: 'sociosd-asahi-0.4.0-arm64.img' },
    { field: 'kernel_cmdline', value: 'quiet loglevel=3 sociosd.boot=nlboot' },
    { field: 'created_at', value: '2026-04-30T08:00:00Z' },
    { field: 'author', value: 'nlboot-agent@socioprophet' },
    { field: 'status', value: 'approved' },
  ],
  artifactCache: [
    { name: 'sociosd-asahi-0.4.0-arm64.img', digest: 'sha256:4a3b2c1d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d8e7f6a5b4c3d2e1f0a9b', source: 'oci://registry.socioprophet.io/nlboot/sociosd-asahi', status: 'hit' },
    { name: 'asahi-kernel-6.9.0-arm64.efi', digest: 'sha256:1f2e3d4c5b6a7980abcdef1234567890fedcba0987654321abcdef1234567890ab', source: 'oci://registry.socioprophet.io/nlboot/asahi-kernel', status: 'hit' },
    { name: 'nlboot-stub-0.4.0.efi', digest: 'sha256:dead000011223344556677889900aabbccddeeff00112233445566778899aabbcc', source: 'oci://registry.socioprophet.io/nlboot/stub', status: 'hit' },
    { name: 'firmware-patch-rev12.bin', digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000', source: 'oci://registry.socioprophet.io/nlboot/firmware-patches', status: 'miss' },
  ],
  preExecProof: [
    { check: 'Artifact digests verified', detail: 'All cached digests match policy allowlist.', result: 'pass' },
    { check: 'Plan schema validates', detail: 'nlboot-plan-schema v0.4.0 — no violations.', result: 'pass' },
    { check: 'Policy decision: allow', detail: 'policy-fabric decision ID pfd-20260430-009 returned allow.', result: 'pass' },
    { check: 'Disk space ≥ 8 GiB', detail: '42 GiB free on /dev/nvme0n1p3.', result: 'pass' },
    { check: 'Firmware patch available', detail: 'firmware-patch-rev12.bin cache miss — using rev11 fallback.', result: 'warn' },
    { check: 'Secure Boot state', detail: 'Secure Boot is disabled on this platform; acceptable for dev target.', result: 'warn' },
  ],
  execProof: [
    { field: 'exec_id', value: 'nlboot-exec-20260430-001' },
    { field: 'started_at', value: '2026-04-30T08:04:11Z' },
    { field: 'finished_at', value: '2026-04-30T08:07:43Z' },
    { field: 'duration_s', value: '212' },
    { field: 'exit_code', value: '0' },
    { field: 'output_digest', value: 'sha256:cafebabe12345678aabbccddeeff00112233445566778899aabbccddeeff001122' },
    { field: 'agent', value: 'nlboot-agent@socioprophet' },
    { field: 'attested_by', value: 'socioprophet-evidence-svc v0.3.1' },
  ],
  appleAdapter: [
    { capability: 'ANE (Apple Neural Engine)', detected: true, note: 'Reported by sysfs; driver loaded.' },
    { capability: 'Unified Memory Architecture', detected: true, note: '24 GiB shared pool detected.' },
    { capability: 'GPU Metal compute', detected: true, note: 'Metal 3 available via Asahi DRM driver.' },
    { capability: 'Thunderbolt 4', detected: true, note: '2× TB4 ports enumerated.' },
    { capability: 'TouchID sensor', detected: false, note: 'Not enumerated under this boot mode.' },
    { capability: 'T2-equivalent SEP', detected: true, note: 'Secure Enclave Processor accessible.' },
  ],
  bootEntry: [
    { field: 'entry_id', value: 'Boot0003' },
    { field: 'label', value: 'SocioProphet NLBoot (Asahi)' },
    { field: 'loader_path', value: '\\EFI\\NLBOOT\\nlboot-stub-0.4.0.efi' },
    { field: 'partition_guid', value: '01234567-89ab-cdef-0123-456789abcdef' },
    { field: 'attributes', value: 'active, boot-next-once' },
    { field: 'written_at', value: '2026-04-30T08:07:41Z' },
    { field: 'verified', value: 'true' },
  ],
};
