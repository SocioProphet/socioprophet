import { defineStore } from "pinia";
import { ref } from "vue";
import { socbase } from "../socbase";

// Auth store: tracks the Socbase (Supabase) session + the caller's tier (read
// from the API). Google sign-in is a full-page redirect (Supabase's default
// OAuth flow) — the router's auth guard picks up the session on return, so
// Login.vue's post-await navigation is a harmless no-op in that path.
export const useAuth = defineStore("auth", () => {
  const user = ref<any>(null);
  const ready = ref(false);
  const tier = ref<string>("free");
  const policy = ref<any>(null);

  // Load the caller's tier + policy from the backend (server is source of truth).
  const loadProfile = async () => {
    const { whoami } = await import("../services/buildsApi");
    const me = await whoami();
    tier.value = me.tier || "free";
    policy.value = me.policy || null;
  };

  const applySession = (session: any) => {
    user.value = session?.user ?? null;
    ready.value = true;
    if (user.value) { loadProfile().catch(() => {}); } else { tier.value = "free"; policy.value = null; }
  };

  socbase.auth.getSession().then(({ data }: any) => applySession(data.session));
  socbase.auth.onAuthStateChange((_event: string, session: any) => applySession(session));

  const signInGoogle = () => socbase.auth.signInWithOAuth({ provider: "google" });
  const signInEmail = async (email: string, pw: string) => {
    const { error } = await socbase.auth.signInWithPassword({ email, password: pw });
    if (error) throw error;
  };
  const registerEmail = async (email: string, pw: string) => {
    const { error } = await socbase.auth.signUp({ email, password: pw });
    if (error) throw error;
  };
  const signOut = () => socbase.auth.signOut();

  const idToken = async (): Promise<string> => {
    const { data } = await socbase.auth.getSession();
    if (!data.session) throw new Error("not signed in");
    return data.session.access_token;
  };

  return { user, ready, tier, policy, loadProfile, signInGoogle, signInEmail, registerEmail, signOut, idToken };
});
