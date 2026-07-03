import { defineStore } from "pinia";
import { ref } from "vue";
import { auth, googleProvider } from "../firebase";

// Local-dev auth bypass: active ONLY under Vite dev AND when no real Firebase
// project is configured (empty apiKey). Lets the authenticated shell (/builder,
// etc.) render without a live Firebase project. Can never activate in a prod
// build (import.meta.env.DEV === false) or once a real apiKey is injected.
const _cfg = (typeof window !== "undefined" && window.__FIREBASE_CONFIG__) || {};
const DEV_AUTH_BYPASS = import.meta.env.DEV && !_cfg.apiKey;

// Auth store: tracks the Firebase user + the caller's tier (read from the API).
export const useAuth = defineStore("auth", () => {
  const user = ref<any>(null);
  const ready = ref(false);
  const tier = ref<string>("free");
  const policy = ref<any>(null);

  if (DEV_AUTH_BYPASS) {
    // Stub a signed-in user so the router guard passes through to /builder.
    user.value = {
      uid: "dev-local",
      email: "dev@localhost",
      displayName: "Local Dev",
      getIdToken: async () => "dev-local-token",
    };
    tier.value = "pro";
    ready.value = true;
    console.warn("[auth] DEV_AUTH_BYPASS active — stub user; no Firebase project configured.");
  } else {
    auth.onAuthStateChanged(async (u: any) => {
      user.value = u;
      ready.value = true;
      if (u) { loadProfile().catch(() => {}); } else { tier.value = "free"; policy.value = null; }
    });
  }

  // Load the caller's tier + policy from the backend (server is source of truth).
  const loadProfile = async () => {
    const { whoami } = await import("../services/buildsApi");
    const me = await whoami();
    tier.value = me.tier || "free";
    policy.value = me.policy || null;
  };

  const signInGoogle = () => auth.signInWithPopup(googleProvider);
  const signInEmail = (email: string, pw: string) =>
    auth.signInWithEmailAndPassword(email, pw);
  const registerEmail = (email: string, pw: string) =>
    auth.createUserWithEmailAndPassword(email, pw);
  const signOut = () => auth.signOut();

  const idToken = async (): Promise<string> => {
    if (!user.value) throw new Error("not signed in");
    return user.value.getIdToken();
  };

  return { user, ready, tier, policy, loadProfile, signInGoogle, signInEmail, registerEmail, signOut, idToken };
});
