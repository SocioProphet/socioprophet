// choirApi — talks to the sovereign choir (mesh LLM). VITE_CHOIR_API unset → STUB: a deterministic grounded answer
// (cites the focus) so the AI panel runs standalone until the choir endpoint is wired. The real call sends the
// assembled grounded prompt and returns the model's answer (then checkGrounding validates the citations).
import type { GroundedContext, ChoirAction } from "./choirGrounding";

const BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_CHOIR_API;

export async function complete(prompt: string, grounded: GroundedContext, action: ChoirAction): Promise<string> {
  if (!BASE) {
    const focus = grounded.citations[0];
    const others = grounded.citations.slice(1, 4).map((c) => c.label).join(", ");
    return `(stub · sovereign choir not wired) ${action} of [${focus?.id ?? "?"}]: “${focus?.label}” connects to ${others || "no neighbours yet"}.`;
  }
  const res = await fetch(`${BASE}/complete`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, action }) });
  if (!res.ok) throw new Error(`choir failed: ${res.status}`);
  return ((await res.json()) as { text: string }).text;
}
