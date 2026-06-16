// ──────────────────────────────────────────────────────────────────────────────
// App.jsx  —  Root component with Firebase auth gate
// ──────────────────────────────────────────────────────────────────────────────
// onAuthStateChanged watches Firebase's auth state in real-time.
// While resolving (first render), we show a themed loading splash so there's
// no flash of the login page for already-authenticated users.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import LoginPage  from './components/LoginPage';
import Dashboard  from './components/Dashboard';

export default function App() {
  // user  = Firebase User object when signed in, null when signed out
  // ready = false until Firebase has resolved the initial auth state
  const [user,  setUser]  = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Subscribe to auth state. The unsubscribe function is returned so React
    // cleans it up when the component unmounts.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setReady(true); // we now know whether someone is logged in or not
    });
    return unsubscribe;
  }, []);

  // ── Loading splash (shown only on first paint while Firebase resolves) ──────
  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, #0f1419 0%, #080b0e 60%, #040608 100%)',
          fontFamily: "'Share Tech Mono', monospace",
        }}
      >
        {/* Animated brain icon */}
        <svg
          width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="#00ffff" strokeWidth="1.5"
          style={{ marginBottom: '20px', filter: 'drop-shadow(0 0 12px rgba(0,255,255,0.7))' }}
        >
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.16Z" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.16Z" />
        </svg>

        {/* Spinner */}
        <svg
          className="animate-spin"
          width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="#00ffff" strokeWidth="2"
          style={{ marginBottom: '16px' }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>

        <p style={{ color: '#00ffff', fontSize: '11px', letterSpacing: '0.3em', opacity: 0.7 }}>
          AUTHENTICATING_SESSION...
        </p>
      </div>
    );
  }

  // ── Route to Dashboard or LoginPage based on Firebase auth state ────────────
  return user
    ? <Dashboard user={user} onLogout={() => {}} />  // onLogout handled inside Dashboard via signOut()
    : <LoginPage />;                                  // onLogin handled inside LoginPage via signInWithEmailAndPassword
}
