import { describe, expect, it } from 'vitest';
import { modelPlatformRanking, capabilityMatrix, investigations } from '../features/competitive-intelligence/modelPlatforms';

describe('model platform intelligence', () => {
  it('ranks SociOS #1 and it is the only non-vendor', () => {
    const top = [...modelPlatformRanking].sort((a, b) => b.score - a.score)[0];
    expect(top.id).toBe('sociOS');
    expect(modelPlatformRanking.filter((p) => !p.vendor)).toHaveLength(1);
  });

  it('the SociOS claim is investigable — grounded in real code AND docs', () => {
    const inv = investigations.sociOS;
    expect(inv).toBeTruthy();
    expect(inv.code.length).toBeGreaterThanOrEqual(3);
    expect(inv.docs.length).toBeGreaterThanOrEqual(3);
    // code refs point at real estate files (this session's merged work)
    expect(inv.code.some((c) => c.path.includes('inference_gateway'))).toBe(true);
    expect(inv.code.some((c) => c.path.includes('promote_model'))).toBe(true);
    // doc refs point at auto-generated docs-index entries
    expect(inv.docs.some((d) => d.path.includes('inference-gateway-intersection'))).toBe(true);
    expect(inv.agentQuery.length).toBeGreaterThan(20);
  });

  it('leads on the sovereignty + governance dimensions', () => {
    const lead = capabilityMatrix.filter((r) => r.verdict === 'lead').map((r) => r.dim);
    expect(lead.some((d) => /sovereignty/i.test(d))).toBe(true);
    expect(lead.some((d) => /receipt/i.test(d))).toBe(true);
  });
});
