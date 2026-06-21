export {};
// Build orchestration for the self-serve image builder.
//
// Phase 1 (free tier): dispatch the parameterized `build-custom.yml` workflow in
// SourceOS-Linux/source-os via the GitHub REST API. The workflow builds the ISO
// on GitHub runners and writes status.json + the artifact to a per-user GCS
// prefix. readBuildStatus() reflects that GCS status back to the API/UI.
//
// Phase 2 will add a GCP build-VM lane here, selected by tier.
const admin = require("firebase-admin");

const GH_OWNER = process.env.SOURCEOS_GH_OWNER || "SourceOS-Linux";
const GH_REPO = process.env.SOURCEOS_GH_REPO || "source-os";
const GH_WORKFLOW = process.env.SOURCEOS_GH_WORKFLOW || "build-custom.yml";
const GH_REF = process.env.SOURCEOS_GH_REF || "main";
const GH_TOKEN = process.env.SOURCEOS_GH_TOKEN || ""; // PAT with workflow scope
const GCS_BUCKET = process.env.SOURCEOS_GCS_BUCKET || "sourceos-artifacts-socioprophet";

// Trigger a free-tier build by dispatching the GitHub workflow.
const dispatchGithubBuild = async (uid: string, buildId: string, spec: any) => {
  if (!GH_TOKEN) throw new Error("SOURCEOS_GH_TOKEN not configured");
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref: GH_REF,
      inputs: { spec: JSON.stringify(spec), uid, build_id: buildId },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`workflow dispatch failed: ${res.status} ${body}`);
  }
  return { lane: "github-actions", ref: GH_REF };
};

// Read the GCS status.json the workflow writes (building/complete/error).
const readBuildStatus = async (uid: string, buildId: string) => {
  const path = `user-builds/${uid}/${buildId}/status.json`;
  try {
    const file = admin.storage().bucket(GCS_BUCKET).file(path);
    const [buf] = await file.download();
    return JSON.parse(buf.toString());
  } catch (err) {
    return null; // not written yet → still pending/queued
  }
};

module.exports = { dispatchGithubBuild, readBuildStatus, GCS_BUCKET };
