// robots.txt parsing + allow/deny — the first thing a polite fetcher checks (design doc §02, T1).
// A small, correct subset of the Robots Exclusion Protocol (RFC 9309): group by User-agent, most-
// specific match wins, longest matching Allow/Disallow path wins, with * and $ wildcards. Pure and
// synchronous so the policy layer can consult it without a network round-trip once the file is fetched.

export interface RobotsRules {
  groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[];
  crawlDelay: Record<string, number>; // per user-agent, seconds
  sitemaps: string[];
}

export function parseRobots(txt: string): RobotsRules {
  const groups: RobotsRules['groups'] = [];
  const crawlDelay: Record<string, number> = {};
  const sitemaps: string[] = [];
  let current: RobotsRules['groups'][number] | null = null;
  let sawRule = false; // a new User-agent after a rule starts a new group

  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      if (!current || sawRule) { current = { agents: [], rules: [] }; groups.push(current); sawRule = false; }
      current.agents.push(value.toLowerCase());
    } else if (field === 'disallow' || field === 'allow') {
      if (!current) { current = { agents: ['*'], rules: [] }; groups.push(current); }
      current.rules.push({ allow: field === 'allow', path: value });
      sawRule = true;
    } else if (field === 'crawl-delay') {
      const secs = Number(value);
      if (Number.isFinite(secs) && current) for (const a of current.agents) crawlDelay[a] = secs;
    } else if (field === 'sitemap') {
      sitemaps.push(value);
    }
  }
  return { groups, crawlDelay, sitemaps };
}

// Pick the group whose agent token best matches ours (exact substring beats '*'); default allow.
function groupFor(rules: RobotsRules, userAgent: string): RobotsRules['groups'][number] | null {
  const ua = userAgent.toLowerCase();
  let star: RobotsRules['groups'][number] | null = null;
  let best: { g: RobotsRules['groups'][number]; len: number } | null = null;
  for (const g of rules.groups) {
    for (const a of g.agents) {
      if (a === '*') { star = g; continue; }
      if (ua.includes(a) && (!best || a.length > best.len)) best = { g, len: a.length };
    }
  }
  return best?.g ?? star;
}

// Translate a robots path pattern (with * and $) into a RegExp anchored at the path start.
function patternToRe(pattern: string): RegExp {
  let re = '';
  for (const ch of pattern) {
    if (ch === '*') re += '.*';
    else if (ch === '$') re += '$';
    else re += ch.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re);
}

// Is `path` allowed for `userAgent`? Longest matching rule wins; Allow beats Disallow on a tie (RFC 9309).
export function isAllowed(rules: RobotsRules, userAgent: string, path: string): boolean {
  const group = groupFor(rules, userAgent);
  if (!group) return true; // no applicable group → allowed
  let decision: { allow: boolean; len: number } | null = null;
  for (const r of group.rules) {
    if (r.path === '') continue; // empty Disallow = allow all; contributes nothing
    if (patternToRe(r.path).test(path)) {
      const len = r.path.length;
      if (!decision || len > decision.len || (len === decision.len && r.allow)) {
        decision = { allow: r.allow, len };
      }
    }
  }
  return decision ? decision.allow : true;
}

export function crawlDelayFor(rules: RobotsRules, userAgent: string): number | undefined {
  const ua = userAgent.toLowerCase();
  for (const a of Object.keys(rules.crawlDelay)) if (a !== '*' && ua.includes(a)) return rules.crawlDelay[a];
  return rules.crawlDelay['*'];
}
