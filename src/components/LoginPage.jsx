// ──────────────────────────────────────────────────────────────────────────────
// LoginPage.jsx  —  Firebase Email/Password + Google Sign-In
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

// Map Firebase error codes → themed cyberpunk error messages
const FIREBASE_ERRORS = {
  'auth/invalid-email':          'INVALID_CREDENTIAL_FORMAT // EMAIL_MALFORMED',
  'auth/user-not-found':         'NODE_NOT_FOUND // FACULTY_ID_UNREGISTERED',
  'auth/wrong-password':         'AUTHENTICATION_FAILED // BIO_PASSCODE_MISMATCH',
  'auth/invalid-credential':     'AUTHENTICATION_FAILED // INVALID_CREDENTIALS',
  'auth/too-many-requests':      'ACCESS_THROTTLED // TOO_MANY_FAILED_ATTEMPTS',
  'auth/network-request-failed': 'NETWORK_ERROR // UNABLE_TO_REACH_AUTH_SERVER',
  'auth/user-disabled':          'ACCOUNT_SUSPENDED // CONTACT_HIVE_ADMIN',
  'auth/popup-closed-by-user':   'AUTH_CANCELLED // POPUP_CLOSED_BY_OPERATOR',
  'auth/popup-blocked':          'POPUP_BLOCKED // ALLOW_POPUPS_AND_RETRY',
};

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const [email,        setEmail]        = useState('');
  const [passcode,     setPasscode]     = useState('');
  const [biometric,    setBiometric]    = useState(false);
  const [latency,      setLatency]      = useState(13);
  const [loading,      setLoading]      = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [error,        setError]        = useState('');

  // Simulate fluctuating latency
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 20) + 8);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── Email / Password sign-in ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, passcode);
      // App.jsx onAuthStateChanged handles the redirect automatically
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || `AUTH_ERROR // ${err.code}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth sign-in ───────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // App.jsx onAuthStateChanged handles the redirect automatically
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || `GOOGLE_AUTH_ERROR // ${err.code}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-12"
      style={{
        background: 'radial-gradient(ellipse at center, #0f1419 0%, #080b0e 60%, #040608 100%)',
      }}
    >
      {/* Ambient grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* ── HEADER ── */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="1.5" className="text-glow-cyan">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.16Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.16Z" />
          </svg>
          <h1
            className="text-4xl font-black tracking-widest text-white title-glitch cursor-default select-none"
            style={{ fontFamily: "'Orbitron', monospace", textShadow: '0 0 20px rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}
          >
            NEURAL_LINK
          </h1>
        </div>
        <div
          className="px-4 py-1 border border-cyan-500/20 text-cyan-400 text-xs tracking-widest uppercase"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
        >
          [ FACULTY_LOGIN_PORTAL // SECTOR_7G ]
        </div>
      </div>

      {/* ── CARD ── */}
      <div className="relative z-10 w-full max-w-2xl px-6">
        <div
          className="relative card-bg rounded-sm px-10 py-10 border border-cyan-500/20"
          style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.4)' }}
        >
          {/* Corner brackets */}
          <div className="absolute -top-[1px] -left-[1px] w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute -top-[1px] -right-[1px] w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute -bottom-[1px] -left-[1px] w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute -bottom-[1px] -right-[1px] w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

          {/* Heading */}
          <div className="flex items-center gap-3 mb-8">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2
              className="text-2xl font-bold text-white tracking-wide"
              style={{ fontFamily: "'Orbitron', monospace", letterSpacing: '0.05em' }}
            >
              Authorized Access
            </h2>
          </div>

          {/* ── Google OAuth Button ── */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 mb-6 border transition-all duration-200 cursor-pointer group"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '2px',
              opacity: (googleLoading || loading) ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.22)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(255,255,255,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {googleLoading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              /* Official Google "G" SVG logo */
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.2l-6.3-5.3C29.5 35.2 26.9 36 24 36c-5.3 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l6.3 5.3C40.9 36.8 44 30.8 44 24c0-1.2-.1-2.4-.4-3.5z"/>
              </svg>
            )}
            <span
              className="text-gray-300 text-xs tracking-widest"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              {googleLoading ? 'CONNECTING...' : 'CONTINUE_WITH // GOOGLE_OAUTH'}
            </span>
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(0,255,255,0.1)' }} />
            <span
              className="text-gray-600 text-[10px] tracking-widest px-2 flex-shrink-0"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              OR_AUTHENTICATE_MANUALLY
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(0,255,255,0.1)' }} />
          </div>

          {/* ── Firebase Error Banner ── */}
          {error && (
            <div
              className="mb-5 flex items-start gap-3 px-4 py-3 border border-red-500/40 bg-red-950/30"
              style={{ borderRadius: '2px' }}
            >
              <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="text-red-400 text-xs tracking-widest" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                {error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Faculty Email field */}
            <div>
              <label className="block text-cyan-400 text-xs tracking-widest mb-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                FACULTY EMAIL
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/60">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="faculty-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="faculty@nueral-link.edu"
                  required
                  className="cyber-input w-full bg-black/40 border border-gray-700/60 text-gray-300 pl-12 pr-4 py-3.5 text-base tracking-widest transition-all duration-200 hover:border-cyan-600/40"
                  style={{ fontFamily: "'Share Tech Mono', monospace", borderRadius: '2px' }}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Bio Passcode field */}
            <div>
              <label className="block text-cyan-400 text-xs tracking-widest mb-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                BIO PASSCODE
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/60">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="4" height="4" /><rect x="10" y="3" width="4" height="4" /><rect x="17" y="3" width="4" height="4" />
                    <rect x="3" y="10" width="4" height="4" /><rect x="10" y="10" width="4" height="4" /><rect x="17" y="10" width="4" height="4" />
                    <rect x="3" y="17" width="4" height="4" /><rect x="10" y="17" width="4" height="4" /><rect x="17" y="17" width="4" height="4" />
                  </svg>
                </span>
                <input
                  id="bio-passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                  placeholder="Enter bio passcode"
                  required
                  className="cyber-input w-full bg-black/40 border border-gray-700/60 text-gray-300 pl-12 pr-12 py-3.5 text-base tracking-widest transition-all duration-200 hover:border-cyan-600/40"
                  style={{ fontFamily: "'Share Tech Mono', monospace", borderRadius: '2px' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500/60 hover:text-cyan-400 transition-colors"
                >
                  {showPasscode ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Security Protocol */}
            <div>
              <label className="block text-cyan-400 text-xs tracking-widest mb-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                SECURITY PROTOCOL
              </label>
              <div
                className="flex items-center gap-3 bg-black/40 border border-gray-700/60 px-4 py-3.5 hover:border-cyan-600/40 transition-all duration-200"
                style={{ borderRadius: '2px' }}
              >
                <input
                  id="biometric-bypass"
                  type="checkbox"
                  checked={biometric}
                  onChange={(e) => setBiometric(e.target.checked)}
                  className="cyber-checkbox cursor-pointer"
                />
                <label
                  htmlFor="biometric-bypass"
                  className="text-gray-300 text-xs tracking-widest cursor-pointer hover:text-gray-200 transition-colors select-none"
                  style={{ fontFamily: "'Share Tech Mono', monospace" }}
                >
                  ENABLE SECURE BIOMETRIC BYPASS
                </label>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                id="initiate-session-btn"
                type="submit"
                disabled={loading || googleLoading}
                className="btn-initiate w-full py-4 text-black font-black tracking-widest text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer"
                style={{
                  fontFamily: "'Orbitron', monospace",
                  background: loading
                    ? 'linear-gradient(135deg, #00b8b8, #007a7a)'
                    : 'linear-gradient(135deg, #00ffff 0%, #00d4d4 50%, #00aaaa 100%)',
                  borderRadius: '2px',
                  letterSpacing: '0.2em',
                  opacity: googleLoading ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    INITIATE SESSION
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="black" stroke="black" strokeWidth="0">
                      <path d="M13 2L4.09 12.26a1 1 0 0 0 .78 1.63L12 14l-3.5 8L21 9.74a1 1 0 0 0-.78-1.63L13 8l.5-6z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Emergency uplink */}
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-xs tracking-wider" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              EMERGENCY UPLINK REQUIRED?{' '}
              <button
                id="contact-admin-btn"
                className="text-cyan-600 hover:text-cyan-400 transition-colors tracking-wider cursor-pointer"
                onClick={() => window.open('mailto:admin@nueral-link.edu')}
              >
                [ CONTACT_HIVE_ADMIN ]
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* ── FOOTER STATUS BAR ── */}
      <div
        className="relative z-10 mt-8 flex items-center justify-center gap-4 text-gray-500 text-xs tracking-wider"
        style={{ fontFamily: "'Share Tech Mono', monospace" }}
      >
        <span>LATENCY: {latency}ms</span>
        <span className="text-gray-700">|</span>
        <span>ENC: AES-2048</span>
        <span className="text-gray-700">|</span>
        <div className="flex items-center gap-2">
          <span className="status-dot w-2 h-2 rounded-full bg-cyan-400 inline-block" />
          <span>SERVER: NODE_042_STABLE</span>
        </div>
      </div>
    </div>
  );
}
