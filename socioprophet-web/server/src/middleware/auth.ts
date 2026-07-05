export {};
// Socbase (Supabase) access-token verification middleware for authenticated
// API routes. Verifies the bearer token against the Supabase auth server
// (getUser) — no local JWT-secret handling needed — and attaches req.uid.
// socbaseAdmin (service-role client) is the single shared handle other
// services/routes use for table access (see db/socbase-schema.sql).
const { createClient } = require("@supabase/supabase-js");

const socbaseAdmin = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const requireAuth = async (req: any, res: any, next: any) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "missing-token" });
  }
  try {
    const { data, error } = await socbaseAdmin.auth.getUser(token);
    if (error || !data.user) throw error || new Error("no-user");
    req.uid = data.user.id;
    req.userEmail = data.user.email || null;
    next();
  } catch (err) {
    return res.status(403).json({ error: "invalid-token" });
  }
};

module.exports = { requireAuth, socbaseAdmin };
