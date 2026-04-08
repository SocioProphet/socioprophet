from pathlib import Path
import re

repo = Path(".")
org = repo / "marketing/public/organizations/index.html"
home = repo / "marketing/public/index.html"

org_text = org.read_text()

# Add Apply to nav if missing.
org_text = org_text.replace(
    '<a class="hover:underline" href="/organizations/">Organizations</a>\n          <a class="hover:underline" href="https://vue.socioprophet.com">Portal</a>',
    '<a class="hover:underline" href="/organizations/">Organizations</a>\n          <a class="hover:underline" href="/organizations/apply/">Apply</a>\n          <a class="hover:underline" href="https://vue.socioprophet.com">Portal</a>'
)

new_main = """
    <main class="mx-auto max-w-6xl px-6 py-14">
      <div class="space-y-10">
        <section class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div class="space-y-6">
            <div class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              Organizations • Governed AI • Agent Plane • Entity Analytics • Authorized Cyberdefense
            </div>

            <h1 class="text-4xl font-semibold tracking-tight text-slate-950 lg:text-6xl">
              Institutional deployment for governed AI, agent operations, and bounded cybernetic systems.
            </h1>

            <p class="max-w-3xl text-lg text-slate-700">
              SocioProphet gives institutions a governed operational intelligence stack: deterministic and bounded AI, role-bounded workflows,
              governed identity analytics, public-safe defensive validation, and explicit review and reversibility boundaries.
            </p>

            <div class="flex flex-wrap gap-3">
              <a class="inline-flex items-center rounded-md bg-slate-900 px-5 py-3 text-white shadow-sm hover:bg-slate-800" href="/organizations/apply/">
                Open intake
              </a>
              <a class="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-3 text-slate-900 hover:bg-slate-50" href="/documentation/organizations-governance-and-institutional-safety/">
                Review governance docs
              </a>
              <a class="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-3 text-slate-900 hover:bg-slate-50" href="#governed-stack">
                Explore the governed stack
              </a>
            </div>

            <div class="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div class="rounded-lg border border-slate-200 bg-white px-4 py-3">Deterministic and bounded AI</div>
              <div class="rounded-lg border border-slate-200 bg-white px-4 py-3">Role-bounded agent plane</div>
              <div class="rounded-lg border border-slate-200 bg-white px-4 py-3">Entity Analytics and proof artifacts</div>
              <div class="rounded-lg border border-slate-200 bg-white px-4 py-3">Authorized cyberdefense under governance</div>
            </div>
          </div>

          <aside class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-xl font-semibold tracking-tight text-slate-950">Institutional adoption path</h2>
            <p class="mt-2 text-sm text-slate-600">
              The institutional path starts with public architecture and governance, then moves into governed subsystem review, then into intake and deployment discussion.
            </p>

            <div class="mt-5 space-y-3">
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Step 1</div>
                <div class="mt-1 font-semibold text-slate-950">Read the institutional manual</div>
                <div class="mt-1 text-sm text-slate-600">Start with governance, deterministic AI, public-safe boundaries, and the institutional operating model.</div>
              </div>

              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Step 2</div>
                <div class="mt-1 font-semibold text-slate-950">Review the governed stack</div>
                <div class="mt-1 text-sm text-slate-600">Understand how governed AI, the agent plane, Entity Analytics, and authorized cyberdefense connect.</div>
              </div>

              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Step 3</div>
                <div class="mt-1 font-semibold text-slate-950">Open the deployment intake</div>
                <div class="mt-1 text-sm text-slate-600">Use the intake surface to start a scoped, reviewable deployment conversation.</div>
              </div>
            </div>

            <div class="mt-6 border-t border-slate-200 pt-4">
              <div class="text-sm font-medium text-slate-700">Read now</div>
              <div class="mt-3 flex flex-wrap gap-2 text-sm">
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/organizations-governance-and-institutional-safety/">Institutional governance</a>
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/deterministic-ai-and-mathematical-safety/">Deterministic AI</a>
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/public-vs-restricted-security-boundary/">Public vs restricted</a>
              </div>
            </div>
          </aside>
        </section>

        <section id="governed-stack" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-semibold tracking-tight text-slate-950">Governed operations stack</h2>
          <p class="mt-2 text-sm text-slate-600">
            Organizations adopt SocioProphet through a governed stack: institutional oversight, bounded agent execution, governed identity analytics, and authorized cyberdefense with evidence-producing review loops.
          </p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <a class="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white" href="/documentation/governed-ai-and-cybernetics/">
              <div class="text-xs font-medium uppercase tracking-wide text-slate-500">operations</div>
              <div class="mt-2 font-semibold text-slate-950">Governed AI &amp; Cybernetics</div>
              <p class="mt-2 text-sm text-slate-600">Policy-bounded execution, human oversight, control loops, and evidence-bearing system behavior.</p>
            </a>

            <a class="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white" href="/documentation/agent-plane-and-operator-workflows/">
              <div class="text-xs font-medium uppercase tracking-wide text-slate-500">agent plane</div>
              <div class="mt-2 font-semibold text-slate-950">Agent Plane and Operator Workflows</div>
              <p class="mt-2 text-sm text-slate-600">Role-bounded execution, reviewable workflows, capability routing, and audit-friendly operator state.</p>
            </a>

            <a class="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white" href="/entity-analytics/">
              <div class="text-xs font-medium uppercase tracking-wide text-slate-500">governed analytics</div>
              <div class="mt-2 font-semibold text-slate-950">Entity Analytics</div>
              <p class="mt-2 text-sm text-slate-600">Typed Event-IR, governed identity graphs, policy-constrained merges, and proof artifacts.</p>
            </a>

            <a class="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white" href="/documentation/authorized-cyberdefense-and-simulation/">
              <div class="text-xs font-medium uppercase tracking-wide text-slate-500">defense</div>
              <div class="mt-2 font-semibold text-slate-950">Authorized Cyberdefense and Simulation</div>
              <p class="mt-2 text-sm text-slate-600">Defense-first validation, purple-team learning loops, blue-team hardening, and governed simulation under authorization.</p>
            </a>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-semibold tracking-tight text-slate-950">Deterministic and bounded by design</h2>
          <p class="mt-2 text-sm text-slate-600">
            SocioProphet is not an ambient-autonomy system. It is a governed operational intelligence stack with mathematically bounded safety,
            proof-bearing workflows, explicit reversibility, and a clear public-versus-restricted security boundary.
          </p>
          <div class="mt-4 flex flex-wrap gap-3 text-sm">
            <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50" href="/documentation/deterministic-ai-and-mathematical-safety/">Deterministic AI</a>
            <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50" href="/documentation/boundary-centric-cyber-hypergraph/">Boundary model</a>
            <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50" href="/documentation/public-vs-restricted-security-boundary/">Public vs restricted</a>
            <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50" href="/documentation/provenance-promotion-and-reversibility/">Provenance and reversibility</a>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold tracking-tight text-slate-950">Schools & Learning Communities</h2>
            <p class="mt-2 text-sm text-slate-600">Deploy serious learning systems, mentorship structures, and governed educational operations.</p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold tracking-tight text-slate-950">Nonprofits & Public Interest</h2>
            <p class="mt-2 text-sm text-slate-600">Run mission-aligned knowledge, coordination, and support systems with explicit safeguards and governance.</p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold tracking-tight text-slate-950">Public Sector & Sovereign Systems</h2>
            <p class="mt-2 text-sm text-slate-600">Support readiness, resilience, secure learning, and public-service operations inside a governed defensive perimeter.</p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold tracking-tight text-slate-950">Teams & Employers</h2>
            <p class="mt-2 text-sm text-slate-600">Develop workforce capability and institutional memory through governed AI assistance and bounded operational workflows.</p>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-semibold tracking-tight text-slate-950">Reading paths</h2>
          <div class="mt-5 grid gap-6 md:grid-cols-3">
            <div>
              <div class="text-sm font-semibold text-slate-800">Institutional governance</div>
              <div class="mt-3 flex flex-wrap gap-2 text-sm">
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/organizations-governance-and-institutional-safety/">Governance</a>
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/platform-human-protection-and-safeguarding/">Safeguarding</a>
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/public-vs-restricted-security-boundary/">Public vs restricted</a>
              </div>
            </div>

            <div>
              <div class="text-sm font-semibold text-slate-800">Operations and analytics</div>
              <div class="mt-3 flex flex-wrap gap-2 text-sm">
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/governed-ai-and-cybernetics/">Governed AI</a>
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/agent-plane-and-operator-workflows/">Agent Plane</a>
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/entity-analytics/">Entity Analytics</a>
              </div>
            </div>

            <div>
              <div class="text-sm font-semibold text-slate-800">Validation and boundary logic</div>
              <div class="mt-3 flex flex-wrap gap-2 text-sm">
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/authorized-cyberdefense-and-simulation/">Authorized cyberdefense</a>
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/boundary-centric-cyber-hypergraph/">Boundary model</a>
                <a class="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50" href="/documentation/deterministic-ai-and-mathematical-safety/">Deterministic AI</a>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <h2 class="text-xl font-semibold tracking-tight">Public-safe institutional boundary</h2>
          <p class="mt-2 max-w-3xl text-sm text-slate-300">
            Public docs explain architecture, governance, bounded execution, evidence, and deployment posture.
            They do not publish sensitive operator kits, exact tactical playbooks, restricted thresholds, exploit mechanics, or misuse-enabling tradecraft.
          </p>
          <div class="mt-4 flex flex-wrap gap-3">
            <a class="inline-flex items-center rounded-md bg-white px-5 py-3 text-slate-950 hover:bg-slate-200" href="/organizations/apply/">
              Open institutional intake
            </a>
            <a class="inline-flex items-center rounded-md border border-slate-600 px-5 py-3 text-white hover:bg-slate-900" href="/documentation/">
              Open documentation
            </a>
          </div>
        </section>
      </div>
    </main>
""".strip()

org_text, n = re.subn(
    r'<main class="mx-auto max-w-6xl px-6 py-14">.*?</main>',
    new_main,
    org_text,
    flags=re.S,
    count=1,
)
if n != 1:
    raise SystemExit("FAILED: could not rewrite organizations main block")
org.write_text(org_text)
print(f"updated: {org}")

home_text = home.read_text()

institutional_section = """
      <section class="section">
        <div class="home-shell">
          <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:end;">
            <div>
              <h2>Institutional path</h2>
              <p>Organizations is the institutional landing for governed AI, the agent plane, Entity Analytics, and authorized cyberdefense under human oversight.</p>
            </div>
            <a href="/organizations/" onclick='spTrack("cta_organizations_surface_click",{href:this.getAttribute("href")})'>Open organizations →</a>
          </div>

          <div class="surface-row">
            <a class="surface-pill" href="/organizations/" onclick='spTrack("cta_org_surface_click",{href:this.getAttribute("href")})'>Organizations</a>
            <a class="surface-pill" href="/documentation/organizations-governance-and-institutional-safety/" onclick='spTrack("cta_org_governance_click",{href:this.getAttribute("href")})'>Governance docs</a>
            <a class="surface-pill" href="/documentation/governed-ai-and-cybernetics/" onclick='spTrack("cta_org_governed_click",{href:this.getAttribute("href")})'>Governed AI</a>
            <a class="surface-pill" href="/organizations/apply/" onclick='spTrack("cta_org_apply_click",{href:this.getAttribute("href")})'>Open deployment intake</a>
          </div>
        </div>
      </section>
""".strip()

home_text, n1 = re.subn(
    r'<section class="section">\s*<div class="home-shell">\s*<div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:end;">\s*<div>\s*<h2>Institutional deployment</h2>.*?</section>',
    institutional_section,
    home_text,
    flags=re.S,
    count=1,
)
if n1 != 1:
    raise SystemExit("FAILED: could not rewrite homepage institutional section")

home.write_text(home_text)
print(f"updated: {home}")
