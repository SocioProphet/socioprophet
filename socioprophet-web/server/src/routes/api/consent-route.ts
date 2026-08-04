export {};
// /svc/consent — the consent plane's read + write surface, backing client-vue's ConsentBoard.
//   GET  /svc/consent/snapshot     every surface + capability with its live consent state
//   POST /svc/consent/grant/:id    grant consent for one surface/capability
//   POST /svc/consent/revoke/:id   revoke it
//
// Grant and revoke are POST, deliberately. They change what may be observed about a person, and
// a state-changing GET is reachable by a link, a prefetch, or a cross-site <img> — a browser
// could grant or revoke consent without the person acting. The board's first client shipped
// these as GET; that is fixed on the client side rather than accommodated here.
//
// AUTHENTICATED. The subject is taken from the session, never from the request body or a query
// param: a caller must not be able to name whose consent they are reading or changing. This is
// what makes the self-sovereign invariant (subject == grantee) hold at the HTTP edge, and it is
// why there is no /snapshot/:subject route.
const express = require("express");
const ledger = require("../../services/consentLedger");

const router = express.Router();

// Per-subject stores. Swap for durable storage without touching the ledger logic — the ledger
// takes the store as an argument precisely so this line is the only thing that changes.
const _stores = new Map<string, any>();
const storeFor = (subject: string) => {
  let s = _stores.get(subject);
  if (!s) {
    s = ledger.createStore();
    _stores.set(subject, s);
  }
  return s;
};

// The authenticated subject, as a URN. Fails closed: no session, no consent surface.
const subjectOf = (req: any): string | null => {
  const raw = req.uid || req.userEmail || null;
  return raw ? "urn:srcos:principal:" + String(raw) : null;
};

const requireSubject = (req: any, res: any): string | null => {
  const subject = subjectOf(req);
  if (!subject) {
    res.status(401).json({ error: "authentication required to read or change consent" });
    return null;
  }
  return subject;
};

router.get("/snapshot", (req: any, res: any) => {
  const subject = requireSubject(req, res);
  if (!subject) return;
  res.json(ledger.snapshot(storeFor(subject), subject));
});

router.post("/grant/:id", (req: any, res: any) => {
  const subject = requireSubject(req, res);
  if (!subject) return;
  const id = String(req.params.id || "");
  const r = ledger.grant(storeFor(subject), subject, id);
  if (!r.ok) {
    // unknown-id is a 404; a subject mismatch is a 403 and is never silently repaired.
    const code = r.reason === "unknown-id" ? 404 : 403;
    return res.status(code).json({ error: r.reason, id });
  }
  res.json({ id: r.id, state: r.state, grantRef: r.grantRef });
});

router.post("/revoke/:id", (req: any, res: any) => {
  const subject = requireSubject(req, res);
  if (!subject) return;
  const id = String(req.params.id || "");
  const r = ledger.revoke(storeFor(subject), subject, id);
  if (!r.ok) return res.status(403).json({ error: r.reason, id });
  res.json({ id: r.id, state: r.state, grantRef: r.grantRef ?? null });
});

module.exports = router;
