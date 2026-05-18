// =============================================================================
// Firebase Admin SDK — server-only. Bypasses Firestore Security Rules.
// =============================================================================
//
// Required env vars (set in .env.local for dev, and in Vercel for prod):
//   FIREBASE_SERVICE_ACCOUNT  – the entire service-account JSON, stringified
//   ADMIN_PIN                 – password required to create groups
//
// Get the service account JSON from:
//   Firebase Console → Project settings → Service accounts → Generate new private key
// Copy the entire file contents (one big JSON blob) into FIREBASE_SERVICE_ACCOUNT.

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;

export function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0]!;
    return _app;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
  }

  const serviceAccount = JSON.parse(raw);
  _app = initializeApp({ credential: cert(serviceAccount) });
  return _app;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
