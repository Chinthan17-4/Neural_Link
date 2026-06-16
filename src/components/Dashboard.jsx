// ──────────────────────────────────────────────────────────────────────────────
// Dashboard.jsx  —  Full Firestore CRUD + Firebase Auth logout
// ──────────────────────────────────────────────────────────────────────────────
// CRUD operations:
//   CREATE  → addDoc()      adds a new student document to Firestore
//   READ    → onSnapshot()  real-time listener; re-renders on any DB change
//   UPDATE  → updateDoc()   patches an existing student document
//   DELETE  → deleteDoc()   removes a student document permanently
//
// Collection: "students"
// Fields per document: { id, name, mark (number), status, createdAt }
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';

import GradesPage      from './pages/GradesPage';
import TerminalPage   from './pages/TerminalPage';
import RosterPage     from './pages/RosterPage';
import ArchivePage    from './pages/ArchivePage';
import SyncPage       from './pages/SyncPage';
import AttendancePage from './pages/AttendancePage';

// ── Navigation items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'OVERVIEW', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )},
  { id: 'operations_grid', label: 'OPERATIONS_GRID', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="3" width="6" height="6" rx="1"/>
      <rect x="3" y="15" width="6" height="6" rx="1"/>
      <rect x="15" y="15" width="6" height="6" rx="1"/>
      <path d="M12 9v3M12 12H6v3M12 12h6v3"/>
    </svg>
  )},
  { id: 'data_usage', label: 'DATA_USAGE', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )},
  { id: 'attendance', label: 'ATTENDANCE', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M9 16l2 2 4-4"/>
    </svg>
  )},
  { id: 'health_monitor', label: 'HEALTH_MONITOR', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )},
  { id: 'sync_manage', label: 'SYNC_MANAGE', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )},
  { id: 'archive', label: 'ARCHIVE', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  )},
  { id: 'settings', label: 'SETTINGS', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )},
];

// ── Sub-components ────────────────────────────────────────────────────────────
function MarkBar({ mark }) {
  const color = mark >= 70 ? '#00ffff' : mark >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-4">
      <div className="w-36 h-2.5 bg-[#111418] border border-cyan-500/10 rounded-none overflow-hidden flex-shrink-0">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${mark}%`, background: color }}
        />
      </div>
      <span className="text-sm font-semibold" style={{ color, fontFamily: "'Share Tech Mono', monospace" }}>
        {mark}%
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const isLow = status === 'CRITICAL_LOW';
  const color = isLow ? '#ef4444' : '#00ffff';
  return (
    <span className="text-xs tracking-widest font-semibold" style={{ color, fontFamily: "'Share Tech Mono', monospace" }}>
      | {status} |
    </span>
  );
}

// ── Main Dashboard component ──────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const [activeNav,      setActiveNav]      = useState('operations_grid');
  const [students,       setStudents]       = useState([]);           // Firestore data
  const [dbLoading,      setDbLoading]      = useState(true);         // initial Firestore load
  const [dbError,        setDbError]        = useState('');           // Firestore error
  const [uptime,         setUptime]         = useState({ d: 12, h: 4, m: 22 });
  const [bufferUsage,    setBufferUsage]    = useState(14);
  const [search,         setSearch]         = useState('');
  const [showModal,      setShowModal]      = useState(false);
  const [modalMode,      setModalMode]      = useState('add');         // 'add' | 'edit'
  const [editingDocId,   setEditingDocId]   = useState(null);         // Firestore doc id for edits
  const [form,           setForm]           = useState({ id: '', name: '', mark: '', status: 'NOMINAL' });
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);         // { docId, label }
  const [page,           setPage]           = useState(0);
  const [saving,         setSaving]         = useState(false);        // add/edit in progress
  const [deleting,       setDeleting]       = useState(false);        // delete in progress
  const PAGE_SIZE = 4;

  // ── Live uptime clock ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setUptime(prev => {
        let { d, h, m } = prev;
        m++;
        if (m >= 60) { m = 0; h++; }
        if (h >= 24) { h = 0; d++; }
        return { d, h, m };
      });
    }, 60000);
    return () => clearInterval(t);
  }, []);

  // ── Fluctuating buffer usage ────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setBufferUsage(Math.floor(Math.random() * 30) + 8), 3000);
    return () => clearInterval(t);
  }, []);

  // ── READ: Firestore real-time listener ──────────────────────────────────────
  // onSnapshot fires immediately with cached data, then on every DB change.
  // The returned unsubscribe function is called on unmount to stop listening.
  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ _docId: d.id, ...d.data() }));
        setStudents(data);
        setDbLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setDbError('FIRESTORE_ERROR // ' + err.code);
        setDbLoading(false);
      }
    );
    return unsubscribe; // detach listener on unmount
  }, []);

  const pad = n => String(n).padStart(2, '0');

  // ── Filtered + paginated view ───────────────────────────────────────────────
  const filtered = students.filter(s =>
    (s.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  );
  const paged      = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ id: `NML-${Math.floor(Math.random() * 9000) + 1000}`, name: '', mark: '', status: 'NOMINAL' });
    setModalMode('add');
    setEditingDocId(null);
    setShowModal(true);
  };

  const openEdit = (student) => {
    setForm({ id: student.id, name: student.name, mark: student.mark, status: student.status });
    setEditingDocId(student._docId);
    setModalMode('edit');
    setShowModal(true);
  };

  // ── CREATE ──────────────────────────────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, mark: parseInt(form.mark, 10), createdAt: serverTimestamp() };

      if (modalMode === 'add') {
        // CREATE — add a new document to the "students" collection
        await addDoc(collection(db, 'students'), payload);
      } else {
        // UPDATE — patch the existing document by its Firestore doc ID
        const { createdAt, ...updatePayload } = payload; // don't overwrite createdAt
        await updateDoc(doc(db, 'students', editingDocId), updatePayload);
      }
      setShowModal(false);
      setPage(0);
    } catch (err) {
      console.error('Save error:', err);
      alert('SAVE_FAILED // ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'students', deleteConfirm.docId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('DELETE_FAILED // ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged in App.jsx detects sign-out and renders LoginPage
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#090c0f', fontFamily: "'Share Tech Mono', monospace" }}>
      {/* Top Pink Trim Line */}
      <div className="h-[3px] w-full bg-[#eb1c74] flex-shrink-0" />

      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside
          className="flex flex-col w-52 flex-shrink-0 border-r"
          style={{ borderColor: 'rgba(0,255,255,0.1)', background: '#080b0e' }}
        >
          {/* Brand */}
          <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 border border-cyan-400/60 flex items-center justify-center flex-shrink-0"
                style={{ boxShadow: '0 0 10px rgba(0,255,255,0.2)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div className="text-white text-xs font-bold tracking-widest">FACULTY_OPS</div>
                <div className="text-cyan-500/60 text-[10px] tracking-widest mt-0.5">SECURE // v1.2.4</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest transition-all duration-150 rounded-none cursor-pointer"
                style={{
                  color:       activeNav === item.id ? '#00ffff' : '#6b7280',
                  background:  activeNav === item.id ? 'rgba(0,255,255,0.08)' : 'transparent',
                  borderLeft:  activeNav === item.id ? '2px solid #00ffff' : '2px solid transparent',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logged-in user badge at bottom of sidebar */}
          <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="flex items-center gap-2">
              {/* Avatar circle */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00ffff, #00aaaa)' }}
              >
                {(user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-cyan-400 text-[9px] tracking-widest truncate">
                  {user?.displayName || 'FACULTY'}
                </div>
                <div className="text-gray-600 text-[8px] tracking-wider truncate">
                  {user?.email || ''}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <header
            className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'rgba(0,255,255,0.1)', background: '#080b0e' }}
          >
            <h1
              className="text-xl font-bold tracking-widest text-white"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              NEURAL_LINK_FACULTY
            </h1>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  placeholder="SEARCH: ID_OR_NAME.."
                  className="bg-[#05080b] border border-cyan-500/15 text-gray-400 text-xs px-3 py-1.5 w-60 tracking-wider focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,255,255,0.15)] transition-all rounded-none"
                  style={{ fontFamily: "'Share Tech Mono', monospace" }}
                />
              </div>

              {/* Notification Bell */}
              <button className="text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </header>

          {/* ── Sub-page views ── */}
          {activeNav === 'overview'       && <div className="flex-1 overflow-hidden"><RosterPage /></div>}
          {activeNav === 'data_usage'     && <div className="flex-1 overflow-hidden"><GradesPage /></div>}
          {activeNav === 'attendance'     && <div className="flex-1 overflow-hidden"><AttendancePage user={user} /></div>}
          {activeNav === 'health_monitor' && <div className="flex-1 overflow-hidden"><TerminalPage user={user} /></div>}
          {activeNav === 'sync_manage'    && <div className="flex-1 overflow-hidden"><SyncPage /></div>}
          {activeNav === 'archive'        && <div className="flex-1 overflow-hidden"><ArchivePage /></div>}
          {activeNav === 'settings'       && (
            <div className="flex-1 p-6 space-y-6 text-gray-400 overflow-y-auto" style={{ background: '#090c0f' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-600 text-xs tracking-widest">[ SYSTEM_CONFIGURATION_UTILITY ]</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                System Settings
              </h2>
              <div className="border border-cyan-500/10 p-6 space-y-4 bg-[#080b0e] max-w-xl">
                <h3 className="text-white text-sm font-semibold tracking-wider border-b border-cyan-500/10 pb-2 mb-4">NODE CONFIGURATION</h3>
                <div className="flex justify-between items-center text-xs tracking-wider">
                  <span>AUTHENTICATED_AS:</span>
                  <span className="text-cyan-400 truncate max-w-[180px]">{user?.email || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs tracking-wider">
                  <span>SECURITY CLEARANCE:</span>
                  <span className="text-cyan-400">LEVEL_4_ADMIN</span>
                </div>
                <div className="flex justify-between items-center text-xs tracking-wider">
                  <span>ENCRYPTION DECODER:</span>
                  <span className="text-cyan-400">AES-2048-GCM</span>
                </div>
                <div className="flex justify-between items-center text-xs tracking-wider">
                  <span>PRIMARY HUB DUMP:</span>
                  <span className="text-cyan-400">SYNC_ACTIVE</span>
                </div>
                <div className="flex justify-between items-center text-xs tracking-wider">
                  <span>HOST ADAPTER IP:</span>
                  <span className="text-cyan-400">127.0.0.1:5173</span>
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all rounded-none cursor-pointer"
                  >
                    DISCONNECT SESSION (LOGOUT)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── OPERATIONS GRID (main CRUD view) ── */}
          {activeNav === 'operations_grid' && (
            <div className="flex-1 overflow-y-auto flex flex-col bg-[#070a0e]">

              {/* Stat cards */}
              <div className="grid grid-cols-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                {[
                  {
                    label: 'SYSTEM_STATUS',
                    custom: <div className="text-cyan-400 text-sm tracking-widest mt-1">SYNC_ACTIVE</div>
                  },
                  {
                    label: 'TOTAL_RECORDS',
                    custom: <div className="text-white text-xl tracking-widest mt-1 font-bold" style={{ fontFamily: "'Orbitron', monospace" }}>
                      {dbLoading ? '...' : students.length}
                    </div>
                  },
                  {
                    label: 'DATA_UPTIME',
                    custom: <div className="text-white text-sm tracking-widest mt-1 font-semibold">
                      {pad(uptime.d)}d {pad(uptime.h)}h {pad(uptime.m)}m
                    </div>
                  },
                  {
                    label: 'USER_CLEARANCE',
                    custom: <div className="text-cyan-400 text-sm tracking-widest mt-1">LVL_4_ADMIN</div>
                  },
                ].map((card, i) => (
                  <div
                    key={i}
                    className={`px-6 py-4 bg-[#080b0e] ${i < 3 ? 'border-r' : ''}`}
                    style={{ borderColor: 'rgba(0,255,255,0.1)' }}
                  >
                    <div className="text-gray-500 text-[10px] tracking-widest font-semibold mb-1">{card.label}</div>
                    {card.custom}
                  </div>
                ))}
              </div>

              {/* Firestore error banner */}
              {dbError && (
                <div className="mx-6 mt-4 px-4 py-3 border border-red-500/40 bg-red-950/30 text-red-400 text-xs tracking-widest">
                  ⚠ {dbError}
                </div>
              )}

              {/* Operations Grid table */}
              <div className="mt-6 border-t border-b" style={{ borderColor: 'rgba(0,255,255,0.1)', background: '#080b0e' }}>

                {/* Grid Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                  <h2 className="text-xl font-bold tracking-widest text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    OPERATIONS_GRID
                  </h2>
                  <button
                    onClick={openAdd}
                    className="px-4 py-1.5 text-black text-xs font-bold tracking-widest bg-[#00ffff] hover:bg-cyan-300 transition-all rounded-none cursor-pointer"
                  >
                    + ADD RECORD
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                        {[
                          { label: 'NODE_ID',        sub: 'NEURAL_LINK_DATABASE_v3.2' },
                          { label: 'NODE_NAME',       sub: 'ENTITY' },
                          { label: 'CURRENT_MARK',    sub: 'USAGE' },
                          { label: 'SYNC_STATUS',     sub: 'HEALTH' },
                          { label: 'ACTION_MATRIX',   sub: 'CONTROL' },
                        ].map((col) => (
                          <th
                            key={col.label}
                            className="px-6 py-3 text-left font-normal border-r last:border-r-0"
                            style={{ borderColor: 'rgba(0,255,255,0.1)' }}
                          >
                            <div className="text-gray-500 text-[10px] tracking-widest">{col.label}</div>
                            <div className="text-cyan-500/40 text-[9px] tracking-widest mt-0.5">{col.sub}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Loading skeleton */}
                      {dbLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i} className="border-b" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                            {Array.from({ length: 5 }).map((__, j) => (
                              <td key={j} className="px-6 py-4 border-r last:border-r-0" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                                <div className="h-3 bg-cyan-900/30 animate-pulse rounded-sm" style={{ width: j === 2 ? '140px' : '80px' }} />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : paged.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-xs tracking-widest">
                            [ NO_RECORDS_FOUND ]
                          </td>
                        </tr>
                      ) : paged.map((student) => (
                        <tr
                          key={student._docId}
                          className="border-b transition-colors hover:bg-cyan-400/5 bg-[#080b0e]"
                          style={{ borderColor: 'rgba(0,255,255,0.1)' }}
                        >
                          <td className="px-6 py-4 border-r" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                            <span className="text-gray-400 text-sm tracking-wider">{student.id}</span>
                          </td>
                          <td className="px-6 py-4 border-r" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                            <span className="text-gray-200 text-sm tracking-wider">{student.name}</span>
                          </td>
                          <td className="px-6 py-4 border-r" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                            <MarkBar mark={student.mark} />
                          </td>
                          <td className="px-6 py-4 border-r" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                            <StatusBadge status={student.status} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {/* Edit button */}
                              <button
                                onClick={() => openEdit(student)}
                                className="w-8 h-8 border border-cyan-500/15 flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:border-cyan-400 transition-all rounded-none bg-transparent cursor-pointer"
                                title="Edit record"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              {/* Delete button */}
                              <button
                                onClick={() => setDeleteConfirm({ docId: student._docId, label: student.id })}
                                className="w-8 h-8 border border-cyan-500/15 flex items-center justify-center text-gray-500 hover:text-red-400 hover:border-red-400 transition-all rounded-none bg-transparent cursor-pointer"
                                title="Delete record"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer: status + pagination */}
                <div
                  className="border-t flex items-stretch justify-between text-gray-500 text-[10px] tracking-widest bg-[#080b0e] select-none flex-shrink-0"
                  style={{ borderColor: 'rgba(0,255,255,0.1)' }}
                >
                  <div className="flex items-stretch">
                    <div className="px-6 py-3 border-r flex items-center" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                      RECORDS: {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, filtered.length)} OF {filtered.length}
                    </div>
                    <div className="px-6 py-3 border-r flex items-center gap-2" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      ENCRYPTED_STREAM_ESTABLISHED
                    </div>
                    <div className="px-6 py-3 border-r flex items-center gap-2" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                      </svg>
                      FIRESTORE: NUERAL-LINK
                    </div>
                    <div className="px-6 py-3 border-r flex items-center gap-2" style={{ borderColor: 'rgba(0,255,255,0.1)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                      BUFFER_USAGE: {bufferUsage}%
                    </div>
                  </div>
                  <div className="flex items-stretch">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-6 py-3 border-l text-gray-500 hover:text-cyan-400 disabled:opacity-30 transition-colors uppercase cursor-pointer select-none font-semibold"
                      style={{ borderColor: 'rgba(0,255,255,0.1)' }}
                    >
                      PREV
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-6 py-3 border-l text-cyan-400 hover:text-cyan-300 disabled:opacity-30 transition-colors uppercase cursor-pointer select-none font-semibold flex items-center gap-1"
                      style={{ borderColor: 'rgba(0,255,255,0.1)' }}
                    >
                      NEXT <span className="font-sans">&gt;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div
            className="w-full max-w-md p-8 relative"
            style={{ background: '#0d1117', border: '1px solid rgba(0,255,255,0.2)', boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}
          >
            {/* Corner brackets */}
            {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
              <div key={i} className={`absolute w-5 h-5 border-cyan-400 ${cls}`} />
            ))}

            <h3 className="text-lg font-bold text-white tracking-widest mb-6" style={{ fontFamily: "'Orbitron', monospace" }}>
              {modalMode === 'add' ? '[ ADD_RECORD ]' : '[ EDIT_RECORD ]'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {[
                { label: '[ STUDENT_ID ]',       key: 'id',   type: 'text',   disabled: true },
                { label: '[ STUDENT_IDENTITY ]',  key: 'name', type: 'text'   },
                { label: '[ CURRENT_MARK ]',      key: 'mark', type: 'number', min: 0, max: 100 },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-cyan-400/70 text-xs tracking-widest mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    disabled={field.disabled}
                    required
                    min={field.min}
                    max={field.max}
                    className="w-full bg-black/40 border border-gray-700/60 text-gray-300 px-4 py-2.5 text-sm tracking-widest focus:outline-none focus:border-cyan-500/60 transition-colors disabled:opacity-50"
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-cyan-400/70 text-xs tracking-widest mb-1.5">[ SYNC_STATUS ]</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-black/40 border border-gray-700/60 text-gray-300 px-4 py-2.5 text-sm tracking-widest focus:outline-none focus:border-cyan-500/60 transition-colors"
                  style={{ fontFamily: "'Share Tech Mono', monospace" }}
                >
                  <option value="NOMINAL">NOMINAL</option>
                  <option value="CRITICAL_LOW">CRITICAL_LOW</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-black text-xs font-bold tracking-widest flex items-center justify-center gap-2"
                  style={{ background: '#00ffff', boxShadow: '0 0 10px rgba(0,255,255,0.4)', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      SAVING...
                    </>
                  ) : (
                    modalMode === 'add' ? 'COMMIT_RECORD' : 'UPDATE_RECORD'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 py-2.5 text-gray-400 text-xs tracking-widest border border-gray-700 hover:border-gray-500 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div
            className="w-80 p-8 text-center"
            style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 0 40px rgba(0,0,0,0.9)' }}
          >
            <svg className="mx-auto mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-white text-xs tracking-widest mb-1">CONFIRM DELETION</p>
            <p className="text-gray-500 text-xs tracking-wider mb-6">RECORD {deleteConfirm.label} WILL BE PURGED FROM FIRESTORE</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-xs tracking-widest font-bold flex items-center justify-center gap-2"
                style={{ background: '#ef4444', color: 'white', boxShadow: '0 0 10px rgba(239,68,68,0.4)', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    PURGING...
                  </>
                ) : 'PURGE'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2 text-xs tracking-widest border border-gray-700 text-gray-400 hover:border-gray-500 transition-colors"
              >
                ABORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
