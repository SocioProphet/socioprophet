// Firebase init — mirrors socioprophet-web/client/src/firebase.ts (compat),
// reading runtime config from window.__FIREBASE_CONFIG__.
declare global {
  interface Window {
    __FIREBASE_CONFIG__?: Record<string, string>;
  }
}

import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const cfg = window.__FIREBASE_CONFIG__ || {};
const app = firebase.initializeApp({
  apiKey: cfg.apiKey || "",
  authDomain: cfg.authDomain || "",
  projectId: cfg.projectId || "",
  storageBucket: cfg.storageBucket || "",
  messagingSenderId: cfg.messagingSenderId || "",
  appId: cfg.appId || "",
});

export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const auth = app.auth();
export default app;
