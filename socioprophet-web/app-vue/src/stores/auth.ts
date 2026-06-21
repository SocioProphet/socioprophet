import { defineStore } from "pinia";
import { ref } from "vue";
import { auth, googleProvider } from "../firebase";

// Auth store: tracks the Firebase user + the caller's tier (read from the API).
export const useAuth = defineStore("auth", () => {
  const user = ref<any>(null);
  const ready = ref(false);
  const tier = ref<string>("free");

  auth.onAuthStateChanged((u: any) => {
    user.value = u;
    ready.value = true;
  });

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

  return { user, ready, tier, signInGoogle, signInEmail, registerEmail, signOut, idToken };
});
