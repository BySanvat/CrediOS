import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFirebaseBrowserConfig, isFirebaseBrowserConfigured, type FirebaseBrowserConfig } from "./env";

function toFirebaseOptions(config: FirebaseBrowserConfig) {
  return {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  };
}

export function getFirebaseApp(config = getFirebaseBrowserConfig()): FirebaseApp | null {
  if (!isFirebaseBrowserConfigured(config)) return null;
  return getApps().length ? getApp() : initializeApp(toFirebaseOptions(config));
}

export function getFirebaseAuth(config = getFirebaseBrowserConfig()) {
  const app = getFirebaseApp(config);
  return app ? getAuth(app) : null;
}

export function getFirebaseDb(config = getFirebaseBrowserConfig()) {
  const app = getFirebaseApp(config);
  return app ? getFirestore(app) : null;
}
