export {};
// Validator-quorum verification (TS twin of prophet-platform tools/quorum.py, PP #1370).
// Both CONFORM to the one authoritative QuorumProof shape (vendored contracts/schemas/
// QuorumProof.json) — we verify that shape + the M-of-N threshold; we do not invent a second.
// Fail-closed: sub-threshold, non-validator signer, duplicate signer, payload-hash mismatch,
// kind mismatch, or a malformed rule → NOT a valid quorum.

const _RULE = /^(\d+)of(\d+)-([a-z]+)$/;                 // e.g. "2of3-human"
const _PAYLOAD_HASH = /^sha256:[0-9a-f]{64}$/;

const parseRule = (rule: string): { threshold: number; total: number; kind: string } | null => {
  const m = _RULE.exec(rule || "");
  if (!m) return null;
  const threshold = Number(m[1]), total = Number(m[2]);
  if (threshold < 1 || total < 1 || threshold > total) return null;
  return { threshold, total, kind: m[3] };
};

// verifyQuorum(proof, { payloadHash?, validate? }) -> { ok, reasons }
const verifyQuorum = (
  proof: any,
  opts?: { payloadHash?: string; validate?: (p: any) => string[] },
): { ok: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  if (opts?.validate) {
    const errs = opts.validate(proof);
    if (errs.length) return { ok: false, reasons: ["QuorumProof not conformant: " + errs.join("; ")] };
  }
  const rule = parseRule(proof?.rule);
  if (!rule) return { ok: false, reasons: [`rule '${proof?.rule}' does not parse as MofN-kind`] };

  const validators: string[] = Array.isArray(proof?.validators) ? proof.validators : [];
  const vset = new Set(validators);
  if (vset.size !== validators.length) reasons.push("validators list has duplicates");
  if (vset.size < rule.total) reasons.push(`rule needs ${rule.total} validators; only ${vset.size} listed`);

  const phash = proof?.signed_payload_hash;
  if (typeof phash !== "string" || !_PAYLOAD_HASH.test(phash)) reasons.push("signed_payload_hash must be sha256:<64hex>");
  else if (opts?.payloadHash !== undefined && phash !== opts.payloadHash) {
    reasons.push("signed_payload_hash does not match the payload being admitted (quorum unbound)");
  }

  const sigs: any[] = Array.isArray(proof?.signatures) ? proof.signatures : [];
  const seen = new Set<string>();
  let valid = 0;
  sigs.forEach((s, i) => {
    if (!s || s.kind == null || s.spiffe_id == null || s.sig == null) { reasons.push(`signature[${i}] missing fields`); return; }
    if (s.kind !== rule.kind) { reasons.push(`signature[${i}] kind '${s.kind}' != rule kind '${rule.kind}'`); return; }
    if (!vset.has(s.spiffe_id)) { reasons.push(`signature[${i}] signer '${s.spiffe_id}' not a listed validator`); return; }
    if (seen.has(s.spiffe_id)) { reasons.push(`signature[${i}] duplicate signer '${s.spiffe_id}'`); return; }
    if (typeof s.sig !== "string" || s.sig.length < 16) { reasons.push(`signature[${i}] sig too short`); return; }
    seen.add(s.spiffe_id); valid += 1;
  });
  if (valid < rule.threshold) reasons.push(`${valid} valid distinct signature(s) < threshold ${rule.threshold} (rule ${proof?.rule})`);

  return { ok: reasons.length === 0, reasons };
};

module.exports = { verifyQuorum, parseRule };
