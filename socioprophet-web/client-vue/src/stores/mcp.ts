import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// MCP — connect to Model Context Protocol servers (SSE transport) and discover their
// tools, mirroring Noetica's browser-side McpClientManager. Increment 1: configure
// servers + connect + list tools. Tool selection + the chat tool-use loop is 7b-2.
export interface McpServerConfig { id: string; name: string; url: string }
export interface McpToolInfo {
  serverId: string; serverName: string; name: string;
  description?: string; inputSchema?: unknown;
}
export type McpStatus = 'idle' | 'connecting' | 'connected' | 'error';

const LS_KEY = 'noetica-mcp-servers-v1';
function load(): McpServerConfig[] {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch { /* */ }
  return [];
}

export function toolKey(t: { serverId: string; name: string }): string { return `${t.serverId}:${t.name}`; }

export const useMcp = defineStore('mcp', () => {
  const servers = ref<McpServerConfig[]>(load());
  const status = ref<Record<string, McpStatus>>({});
  const errors = ref<Record<string, string>>({});
  const tools = ref<McpToolInfo[]>([]);
  const enabled = ref<Set<string>>(new Set());   // tool keys the model may call this session
  const clients = new Map<string, Client>();   // non-reactive live connections

  function toggleTool(key: string) {
    const s = new Set(enabled.value);
    if (s.has(key)) s.delete(key); else s.add(key);
    enabled.value = s;
  }
  // the selected tools as definitions passed into /api/chat. When the agent-machine is
  // driving the loop it executes them server-side and emits tool_calls for display.
  function selectedDefs(): Array<{ name: string; description?: string; inputSchema?: unknown; serverId: string }> {
    return tools.value.filter((t) => enabled.value.has(toolKey(t)))
      .map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema, serverId: t.serverId }));
  }

  function persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(servers.value)); } catch { /* */ }
  }

  async function connect(cfg: McpServerConfig): Promise<void> {
    await disconnect(cfg.id);
    status.value = { ...status.value, [cfg.id]: 'connecting' };
    errors.value = { ...errors.value, [cfg.id]: '' };
    try {
      const client = new Client({ name: 'noetica-cockpit', version: '1.0.0' }, { capabilities: {} });
      const transport = new SSEClientTransport(new URL(cfg.url));
      await client.connect(transport);
      clients.set(cfg.id, client);
      const listed = await client.listTools();
      // drop any prior tools for this server, add the fresh set
      tools.value = tools.value.filter((t) => t.serverId !== cfg.id).concat(
        (listed.tools ?? []).map((t) => ({
          serverId: cfg.id, serverName: cfg.name, name: t.name,
          description: t.description, inputSchema: t.inputSchema,
        })),
      );
      status.value = { ...status.value, [cfg.id]: 'connected' };
    } catch (e) {
      status.value = { ...status.value, [cfg.id]: 'error' };
      errors.value = { ...errors.value, [cfg.id]: e instanceof Error ? e.message : 'connection failed' };
    }
  }

  async function disconnect(id: string): Promise<void> {
    const c = clients.get(id);
    if (c) { try { await c.close(); } catch { /* */ } clients.delete(id); }
    tools.value = tools.value.filter((t) => t.serverId !== id);
    status.value = { ...status.value, [id]: 'idle' };
  }

  function addServer(name: string, url: string): McpServerConfig {
    const cfg: McpServerConfig = {
      id: globalThis.crypto?.randomUUID?.() ?? `mcp-${Date.now()}`,
      name: name.trim() || url, url: url.trim(),
    };
    servers.value.push(cfg);
    persist();
    void connect(cfg);
    return cfg;
  }
  async function removeServer(id: string) {
    await disconnect(id);
    servers.value = servers.value.filter((s) => s.id !== id);
    persist();
  }
  function connectAll() { servers.value.forEach((s) => void connect(s)); }

  return { servers, status, errors, tools, enabled, toggleTool, selectedDefs,
    addServer, removeServer, connect, disconnect, connectAll };
});
