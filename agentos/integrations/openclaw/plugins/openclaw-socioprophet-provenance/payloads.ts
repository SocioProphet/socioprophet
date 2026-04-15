export type PlainRecord = Record<string, unknown>;

export function nowIso(): string {
  return new Date().toISOString();
}

export function buildMessageSentTurnEvent(event: any, pluginId: string): PlainRecord {
  return {
    event_id: `evt-${Date.now()}`,
    event_type: "message.sent",
    occurred_at: nowIso(),
    session_id: String(event?.sessionKey ?? "unknown-session"),
    agent_id: String(event?.agentId ?? "unknown-agent"),
    plugin_id: pluginId,
  };
}

export function buildToolObservedEvent(stage: "before_tool_call" | "after_tool_call", event: any, pluginId: string): PlainRecord {
  return {
    event_id: `evt-${Date.now()}`,
    event_type: stage,
    occurred_at: nowIso(),
    session_id: String(event?.sessionKey ?? "unknown-session"),
    tool_name: String(event?.toolName ?? "unknown-tool"),
    plugin_id: pluginId,
  };
}
