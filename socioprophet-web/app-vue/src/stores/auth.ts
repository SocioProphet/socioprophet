import { defineStore } from "pinia";
import { ref } from "vue";
import { auth, googleProvider } from "../firebase";

// Auth store: tracks the Firebase user + the caller's tier (read from the API).
export const useAuth = defineStore("auth", () => {
  const user = ref<any>(null);
  const ready = ref(false);
  const tier = ref<string>("free");
  const policy = ref<any>(null);

  auth.onAuthStateChanged(async (u: any) => {
    user.value = u;
    ready.value = true;
    if (u) { loadProfile().catch(() => {}); } else { tier.value = "free"; policy.value = null; }
  });

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
