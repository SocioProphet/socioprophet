export {};
// Firebase ID-token verification middleware for authenticated API routes.
// Initializes firebase-admin once (application default credentials in prod;
// FIREBASE_PROJECT_ID for local). Attaches req.uid on success.
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
  });
}

const requireAuth = async (req: any, res: any, next: any) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "missing-token" });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.userEmail = decoded.email || null;
    next();
  } catch (err) {
    return res.status(403).json({ error: "invalid-token" });
  }
};

module.exports = { requireAuth, admin };
