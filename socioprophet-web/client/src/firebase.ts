declare global {
  interface Window {
    __FIREBASE_CONFIG__?: {
      apiKey?: string;
      authDomain?: string;
      databaseURL?: string;
      projectId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      appId?: string;
      measurementId?: string;
    };
  }
}

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const app = firebase.initializeApp({
    apiKey: (window.__FIREBASE_CONFIG__?.apiKey || ''),
    authDomain: (window.__FIREBASE_CONFIG__?.authDomain || ''),
    databaseURL: (window.__FIREBASE_CONFIG__?.databaseURL || ''),
    projectId: (window.__FIREBASE_CONFIG__?.projectId || ''),
    storageBucket: (window.__FIREBASE_CONFIG__?.storageBucket || ''),
    messagingSenderId: (window.__FIREBASE_CONFIG__?.messagingSenderId || ''),
    appId: (window.__FIREBASE_CONFIG__?.appId || ''),
    measurementId: (window.__FIREBASE_CONFIG__?.measurementId || ''),
});

// Least-privilege auth providers (NO Workspace Directory scopes)
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const emailProvider = new firebase.auth.EmailAuthProvider();

export const auth = app.auth();
export const db = app.firestore();
export default app;
