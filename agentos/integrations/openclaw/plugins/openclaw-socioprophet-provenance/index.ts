import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "socioprophet-provenance",
  name: "Socioprophet Provenance",
  description: "Provenance plugin skeleton for OpenClaw integration staging.",
  register(api) {
    const cfg = api.pluginConfig ?? {};

    api.registerHttpRoute({
      path: cfg.routePath ?? "/sp/provenance/health",
      auth: "plugin",
      match: "exact",
      handler: async (_req, res) => {
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ok: true, plugin: api.id, surface: "socioprophet-provenance" }));
        return true;
      },
    });

    api.on("message_sent", async (event: any) => {
      api.logger?.debug?.(`message_sent observed for session ${String(event?.sessionKey ?? "unknown")}`);
    });

    api.on("before_tool_call", async (event: any) => {
      api.logger?.debug?.(`before_tool_call observed for ${String(event?.toolName ?? "unknown-tool")}`);
      return { block: false };
    });

    api.on("after_tool_call", async (event: any) => {
      api.logger?.debug?.(`after_tool_call observed for ${String(event?.toolName ?? "unknown-tool")}`);
    });
  },
});
