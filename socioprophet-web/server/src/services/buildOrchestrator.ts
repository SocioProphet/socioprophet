export {};
// Build orchestration for the self-serve image builder.
//
// Phase 1 (free tier): dispatch the parameterized `build-custom.yml` workflow in
// SourceOS-Linux/source-os via the GitHub REST API. The workflow builds the ISO
// on GitHub runners and writes status.json + the artifact to a per-user GCS
// prefix. readBuildStatus() reflects that GCS status back to the API/UI.
//
// Phase 2 will add a GCP build-VM lane here, selected by tier.
const { GoogleAuth } = require("google-auth-library");
const { Storage } = require("@google-cloud/storage");

const storage = new Storage();
const gcpAuth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });

const GH_OWNER = process.env.SOURCEOS_GH_OWNER || "SourceOS-Linux";
const GH_REPO = process.env.SOURCEOS_GH_REPO || "source-os";
const GH_WORKFLOW = process.env.SOURCEOS_GH_WORKFLOW || "build-custom.yml";
const GH_REF = process.env.SOURCEOS_GH_REF || "main";
const GH_TOKEN = process.env.SOURCEOS_GH_TOKEN || ""; // PAT with workflow scope
const GCS_BUCKET = process.env.SOURCEOS_GCS_BUCKET || "sourceos-artifacts-socioprophet";

// GCP build-VM lane (paid/premium): create an ephemeral VM whose startup-script
// runs the SourceOS custom build, uploads to GCS, and self-deletes.
const GCP_PROJECT = process.env.SOURCEOS_GCP_PROJECT || "socioprophet-platform";
const GCP_ZONE = process.env.SOURCEOS_GCP_ZONE || "us-central1-a";
const GCP_MACHINE = process.env.SOURCEOS_GCP_MACHINE || "c2d-standard-8";
const GCP_SA = process.env.SOURCEOS_GCP_BUILD_SA ||
  "synapseiq-build@socioprophet-platform.iam.gserviceaccount.com";
const STARTUP_URL = process.env.SOURCEOS_GCP_STARTUP_URL ||
  "https://raw.githubusercontent.com/SourceOS-Linux/source-os/main/scripts/gcp-build-custom-startup.sh";

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

// Mint a GCP access token from the ambient application-default credential (the
// SA must have compute.instanceAdmin on the project).
const gcpToken = async (): Promise<string> => {
  const client = await gcpAuth.getClient();
  const t = await client.getAccessToken();
  return t.token as string;
};

// Paid/premium lane: create an ephemeral build VM via the Compute API. The
// startup-script curls + execs the SourceOS build script; the spec/ids ride in
// instance metadata. The VM uploads the artifact + status.json then self-deletes.
const dispatchGcpBuild = async (uid: string, buildId: string, spec: any) => {
  const token = await gcpToken();
  const prefix = `gs://${GCS_BUCKET}/user-builds/${uid}/${buildId}`;
  const name = `srcos-build-${buildId}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 62);
  const url = `https://compute.googleapis.com/compute/v1/projects/${GCP_PROJECT}/zones/${GCP_ZONE}/instances`;
  const body = {
    name,
    machineType: `zones/${GCP_ZONE}/machineTypes/${GCP_MACHINE}`,
    disks: [{
      boot: true, autoDelete: true,
      initializeParams: { sourceImage: "projects/ubuntu-os-cloud/global/images/family/ubuntu-2404-lts-amd64", diskSizeGb: "60" },
    }],
    networkInterfaces: [{ accessConfigs: [{ type: "ONE_TO_ONE_NAT", name: "External NAT" }] }],
    serviceAccounts: [{ email: GCP_SA, scopes: ["https://www.googleapis.com/auth/cloud-platform"] }],
    scheduling: { automaticRestart: false },   // ephemeral; self-deletes on completion
    metadata: {
      items: [
        { key: "startup-script", value: `#!/bin/bash\ncurl -fsSL ${STARTUP_URL} | bash` },
        { key: "sourceos-spec", value: JSON.stringify(spec) },
        { key: "sourceos-uid", value: uid },
        { key: "sourceos-build-id", value: buildId },
        { key: "sourceos-gcs-prefix", value: prefix },
      ],
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GCP instance create failed: ${res.status} ${text}`);
  }
  return { lane: "gcp", instance: name };
};

// Route a build to the right lane by tier: free → GitHub Actions (cheap),
// paid/premium → private GCP build VM.
const dispatchBuild = async (uid: string, buildId: string, spec: any, tier: string) => {
  if (tier === "paid" || tier === "premium") return dispatchGcpBuild(uid, buildId, spec);
  return dispatchGithubBuild(uid, buildId, spec);
};

// Read the GCS status.json the workflow writes (building/complete/error).
const readBuildStatus = async (uid: string, buildId: string) => {
  const path = `user-builds/${uid}/${buildId}/status.json`;
  try {
    const file = storage.bucket(GCS_BUCKET).file(path);
    const [buf] = await file.download();
    return JSON.parse(buf.toString());
  } catch (err) {
    return null; // not written yet → still pending/queued
  }
};

module.exports = { dispatchGithubBuild, dispatchGcpBuild, dispatchBuild, readBuildStatus, GCS_BUCKET };
