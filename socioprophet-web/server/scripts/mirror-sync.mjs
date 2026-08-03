// CI runner: reconcile the sovereign delivery store with the GitHub mirror repo.
// The token is MINTED IN CI (a GitHub App installation token) and passed via env —
// never stored. Dry-run by default; APPLY=true (manual dispatch only) writes.
//   GH_TOKEN=<ci-minted>  MIRROR_REPO=SocioProphet/delivery-excellence  APPLY=false  node scripts/mirror-sync.mjs
import { syncMirror } from '../src/services/githubMirror.ts';
import { sovereignTasks } from '../src/services/deliveryStore.ts';

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const repo = process.env.MIRROR_REPO || 'SocioProphet/delivery-excellence';
const apply = process.env.APPLY === 'true';
if (!token) { console.error('no token — expected a CI-minted GitHub App token in GH_TOKEN'); process.exit(1); }

const api = async (method, path, body) => {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'sovereign-delivery-mirror' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};

const gh = {
  async listIssues(r) {
    const items = await api('GET', `/repos/${r}/issues?state=all&per_page=100`);
    return (items || []).filter((i) => !i.pull_request); // issues endpoint also returns PRs
  },
  async createIssue(r, title, body, labels) { return api('POST', `/repos/${r}/issues`, { title, body, labels }); },
  async updateIssue(r, num, fields) {
    const patch = {};
    if (fields.title) patch.title = fields.title;
    if (fields.state) patch.state = fields.state;
    if (Object.keys(patch).length) await api('PATCH', `/repos/${r}/issues/${num}`, patch);
    if (fields.addLabels?.length) await api('POST', `/repos/${r}/issues/${num}/labels`, { labels: fields.addLabels });
  },
};

const report = await syncMirror(gh, repo, sovereignTasks, { apply });
console.log(JSON.stringify({
  repo, applied: report.applied,
  created: report.created, updated: report.updated, flaggedOrphans: report.flaggedOrphans,
  drifted: report.result.drifted, sovereignOnly: report.result.sovereignOnly, orphans: report.result.orphans,
}, null, 2));
