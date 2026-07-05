// Socbase — SocioProphet's Supabase-backed identity client for this shell.
// Reads runtime config from window.__SOCBASE_CONFIG__ (same runtime-injection
// pattern the old firebase.ts used via /firebase-config.js), so builds stay
// environment-agnostic.
declare global {
  interface Window {
    __SOCBASE_CONFIG__?: { url?: string; anonKey?: string };
  }
}

import { createClient } from "@supabase/supabase-js";

const cfg = window.__SOCBASE_CONFIG__ || {};
export const socbase = createClient(cfg.url || "", cfg.anonKey || "");
export const auth = socbase.auth;
export default socbase;
