// Firebase init — mirrors socioprophet-web/client/src/firebase.ts (compat),
// reading runtime config from window.__FIREBASE_CONFIG__.
declare global {
  interface Window {
    __FIREBASE_CONFIG__?: Record<string, string>;
  }
}

import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const cfg = (typeof window !== "undefined" && window.__FIREBASE_CONFIG__) || {};
const hasConfig = !!cfg.apiKey;

let app: firebase.app.App | null = null;
let authInstance: any;
let googleProviderInstance: any;

if (hasConfig) {
  app = firebase.initializeApp({
    apiKey: cfg.apiKey || "",
    authDomain: cfg.authDomain || "",
    projectId: cfg.projectId || "",
    storageBucket: cfg.storageBucket || "",
    messagingSenderId: cfg.messagingSenderId || "",
    appId: cfg.appId || "",
  });
  authInstance = app.auth();
  googleProviderInstance = new firebase.auth.GoogleAuthProvider();
} else {
  // No Firebase project configured (local dev without firebase-config.js).
  // Export a no-op auth so importing this module never throws
  // "auth/invalid-api-key" and white-screens the app. The auth store's
  // DEV_AUTH_BYPASS supplies a stub signed-in user in this mode.
  console.warn("[firebase] No apiKey in window.__FIREBASE_CONFIG__ — using no-op auth (local dev).");
  authInstance = {
    onAuthStateChanged: (_cb: (u: any) => void) => () => {},
    signInWithPopup: async () => { throw new Error("Firebase not configured (local dev)"); },
    signInWithEmailAndPassword: async () => { throw new Error("Firebase not configured (local dev)"); },
    createUserWithEmailAndPassword: async () => { throw new Error("Firebase not configured (local dev)"); },
    signOut: async () => {},
  };
  googleProviderInstance = {};
}

export const googleProvider = googleProviderInstance;
export const auth = authInstance;
export default app;
