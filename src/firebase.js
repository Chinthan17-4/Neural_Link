// ──────────────────────────────────────────────────────────────────────────────
// firebase.js  —  NEURAL_LINK Firebase initialization
// ──────────────────────────────────────────────────────────────────────────────
// This file initializes the Firebase app once and re-exports the services
// (auth, db) so any component can import them without re-initializing.
// ──────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth }       from 'firebase/auth';
import { getFirestore }  from 'firebase/firestore';

// ── Your Firebase project config ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyB5IZnSUx0Z_sd9w4SEL1EHoMbDMLN-mhk',
  authDomain:        'nueral-link.firebaseapp.com',
  projectId:         'nueral-link',
  storageBucket:     'nueral-link.firebasestorage.app',
  messagingSenderId: '385977072045',
  appId:             '1:385977072045:web:27709b370b4a4adba4c924',
  measurementId:     'G-RE81VB54CP',
};

// ── Initialize Firebase (safe to call multiple times — will reuse the app) ───
const app = initializeApp(firebaseConfig);

// ── Export the services you need ─────────────────────────────────────────────
export const auth = getAuth(app);    // Firebase Authentication
export const db   = getFirestore(app); // Cloud Firestore
