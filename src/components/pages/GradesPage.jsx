// ──────────────────────────────────────────────────────────────────────────────
// GradesPage.jsx — Live Firestore data + working Publish Results button
// ──────────────────────────────────────────────────────────────────────────────
// - Reads students from Firestore via onSnapshot (real-time)
// - PUBLISH RESULTS → sets published:true + publishedAt timestamp on ALL docs
// - PROCESS_BUFFER  → bulk-updates marks from "ID:MARK" textarea input
// - Grade distribution chart is computed from live Firestore data
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  writeBatch, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#3b82f6','#10b981','#f59e0b'];

function Avatar({ initial, color }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: color, border: '1px solid rgba(255,255,255,0.15)' }}
    >
      {initial}
    </div>
  );
}

// Compute letter grade from a 0–100 mark
function letterGrade(mark) {
  if (mark >= 80) return 'A';
  if (mark >= 65) return 'B';
  if (mark >= 50) return 'C';
  if (mark >= 35) return 'D';
  return 'E';
}

export default function GradesPage() {
  const [chartMode,    setChartMode]    = useState('BAR');
  const [bulkText,     setBulkText]     = useState('');
  const [localTime,    setLocalTime]    = useState('');
  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [published,    setPublished]    = useState(false);   // current publish state
  const [publishing,   setPublishing]   = useState(false);   // in-flight
  const [processing,   setProcessing]   = useState(false);
  const [toast,        setToast]        = useState('');      // success/error toast
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 8;

  // Local clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLocalTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
      setStudents(data);
      // If ALL records have published:true → show as published
      setPublished(data.length > 0 && data.every(s => s.published === true));
      setLoading(false);
    });
    return unsub;
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── PUBLISH RESULTS ────────────────────────────────────────────────────────
  // Sets published:true + publishedAt:now on every student document atomically
  const handlePublish = async () => {
    if (publishing || students.length === 0) return;
    setPublishing(true);
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        batch.update(doc(db, 'students', s._docId), {
          published:   !published,          // toggle: publish or un-publish
          publishedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      showToast(published ? 'RESULTS_UNPUBLISHED // ALL_RECORDS_STAGED' : 'RESULTS_PUBLISHED // ALL_RECORDS_LIVE');
    } catch (err) {
      showToast('PUBLISH_FAILED // ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  // ── PROCESS BUFFER (bulk update marks) ────────────────────────────────────
  // Parses "STUDENT_ID:MARK" lines and batch-updates matching Firestore docs
  const handleProcessBuffer = async () => {
    if (!bulkText.trim() || processing) return;
    setProcessing(true);
    try {
      const lines = bulkText.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const updates = [];
      const errors  = [];

      lines.forEach(line => {
        const [rawId, rawMark] = line.split(':');
        if (!rawId || rawMark === undefined) { errors.push(line); return; }
        const id   = rawId.trim().toUpperCase();
        const mark = parseInt(rawMark.trim(), 10);
        if (isNaN(mark) || mark < 0 || mark > 100) { errors.push(line); return; }
        const student = students.find(s => s.id === id);
        if (!student) { errors.push(`${id} NOT_FOUND`); return; }
        updates.push({ docId: student._docId, mark });
      });

      if (updates.length > 0) {
        const batch = writeBatch(db);
        updates.forEach(u => batch.update(doc(db, 'students', u.docId), { mark: u.mark }));
        await batch.commit();
      }

      if (errors.length > 0) {
        showToast(`PROCESSED ${updates.length} | ERRORS: ${errors.join(', ')}`);
      } else {
        showToast(`BUFFER_PROCESSED // ${updates.length}_RECORDS_UPDATED`);
        setBulkText('');
      }
    } catch (err) {
      showToast('BUFFER_FAILED // ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ── Computed stats ─────────────────────────────────────────────────────────
  const avgMark = students.length
    ? (students.reduce((a, s) => a + (s.mark || 0), 0) / students.length).toFixed(1)
    : '—';

  const gradeGroups = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  students.forEach(s => { gradeGroups[letterGrade(s.mark || 0)]++; });
  const GRADE_DIST = [
    { label: 'E', count: gradeGroups.E, color: '#ef4444' },
    { label: 'D', count: gradeGroups.D, color: '#f59e0b' },
    { label: 'C', count: gradeGroups.C, color: '#6366f1' },
    { label: 'B', count: gradeGroups.B, color: '#00ffff' },
    { label: 'A', count: gradeGroups.A, color: '#00e8e8' },
  ];
  const maxCount = Math.max(...GRADE_DIST.map(g => g.count), 1);

  // Paginated roster
  const totalPages = Math.ceil(students.length / PAGE_SIZE);
  const paged      = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Share Tech Mono', monospace", background: '#090c0f' }}>

      {/* ── Toast notification ── */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-5 py-3 text-xs tracking-widest border"
          style={{
            background: '#0d1117',
            borderColor: 'rgba(0,255,255,0.4)',
            color: '#00ffff',
            boxShadow: '0 0 20px rgba(0,255,255,0.2)',
            fontFamily: "'Share Tech Mono', monospace",
          }}
        >
          ✓ {toast}
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Section header */}
        <div className="flex items-center gap-3 mb-1">
          <span className="text-gray-600 text-xs tracking-widest">[ DATA_USAGE // GRADES_MODULE ]</span>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Class Average — computed live */}
          <div className="p-5 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-xs tracking-widest">CLASS AVERAGE</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-white text-2xl font-bold tracking-wide">
                {loading ? '...' : avgMark}
              </span>
              <span className="text-gray-400 text-sm tracking-wider">/ 100</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${loading ? 0 : avgMark}%`,
                  background: 'linear-gradient(90deg,#6366f1,#00ffff)',
                  boxShadow: '0 0 8px rgba(0,255,255,0.4)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          {/* Total Records */}
          <div className="p-5 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-xs tracking-widest">TOTAL RECORDS</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-white text-2xl font-bold tracking-wide">
                {loading ? '...' : students.length}
              </span>
              <span className="text-gray-400 text-sm tracking-wider">STUDENTS</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: Math.min(students.length, 10) }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-sm"
                  style={{ background: '#a855f7', boxShadow: '0 0 4px rgba(168,85,247,0.5)', minWidth: '4px' }}
                />
              ))}
            </div>
          </div>

          {/* Publish Status — WORKING BUTTON */}
          <div className="p-5 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-xs tracking-widest">PUBLISH STATUS</span>
              <div
                className="w-2.5 h-2.5 rounded-full status-dot"
                style={{
                  background: published ? '#00ffff' : '#f97316',
                  boxShadow: published ? '0 0 6px #00ffff' : '0 0 6px #f97316',
                }}
              />
            </div>
            <div
              className="text-white text-sm italic tracking-widest mb-4"
              style={{ color: published ? '#00ffff' : '#f97316' }}
            >
              {loading ? 'LOADING...' : published ? 'PUBLISHED' : 'STAGED'}
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing || loading || students.length === 0}
              className="w-full py-2 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              style={{
                background:  publishing ? '#007a7a' : published ? '#1a4a1a' : '#00ffff',
                color:       published ? '#00ffff' : '#000',
                border:      published ? '1px solid #00ffff' : 'none',
                boxShadow:   publishing ? 'none' : '0 0 10px rgba(0,255,255,0.4)',
                opacity:     (loading || students.length === 0) ? 0.5 : 1,
              }}
            >
              {publishing ? (
                <>
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  PUBLISHING...
                </>
              ) : published ? 'UNPUBLISH RESULTS' : 'PUBLISH RESULTS'}
            </button>
          </div>
        </div>

        {/* Chart + Bulk Entry */}
        <div className="grid grid-cols-3 gap-4">
          {/* Distribution Map — live from Firestore */}
          <div className="col-span-2 p-5 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-white text-sm tracking-widest font-bold">DISTRIBUTION_MAP</div>
                <div className="text-gray-600 text-xs tracking-widest">LIVE_GRADE_DENSITY_FROM_FIRESTORE</div>
              </div>
              <div className="flex gap-2">
                {['BAR','DOT'].map(m => (
                  <button key={m} onClick={() => setChartMode(m)}
                    className="px-3 py-1 text-xs tracking-widest transition-all"
                    style={{
                      color:        chartMode === m ? '#00ffff' : '#6b7280',
                      borderBottom: chartMode === m ? '1px solid #00ffff' : '1px solid transparent',
                    }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end justify-around h-44 mt-4 px-4 relative">
              {[0,25,50,75,100].map(p => (
                <div key={p} className="absolute w-full left-0" style={{ bottom: `${p}%`, borderTop: '1px solid rgba(255,255,255,0.05)' }}/>
              ))}
              {GRADE_DIST.map((g) => (
                <div key={g.label} className="flex flex-col items-center gap-2 flex-1">
                  {chartMode === 'BAR' ? (
                    <div
                      className="w-12 rounded-sm transition-all duration-500 relative overflow-hidden"
                      style={{
                        height:     `${(g.count / maxCount) * 100}%`,
                        background: `linear-gradient(180deg, ${g.color}cc, ${g.color}44)`,
                        boxShadow:  `0 0 12px ${g.color}60`,
                        minHeight:  '8px',
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: g.color, boxShadow: `0 0 6px ${g.color}` }}/>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 justify-center items-end" style={{ height: `${(g.count / maxCount) * 100}%` }}>
                      {Array.from({ length: g.count }).map((_, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: g.color }}/>
                      ))}
                    </div>
                  )}
                  <div className="text-center">
                    <span className="text-gray-500 text-xs tracking-widest">{g.label}</span>
                    <span className="text-gray-700 text-xs ml-1">({g.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bulk Entry — WORKING */}
          <div className="p-5 border flex flex-col" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="mb-3">
              <div className="text-white text-sm tracking-widest font-bold">BULK_ENTRY</div>
              <div className="text-gray-600 text-xs tracking-widest">RAW_BUFFER_STREAM</div>
            </div>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              className="flex-1 bg-black/60 border border-gray-700/50 text-gray-400 text-xs p-3 resize-none focus:outline-none focus:border-cyan-500/40 min-h-32"
              placeholder={'NML-1234:85\nNML-5678:72\n...'}
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            />
            <div className="mt-2 p-2 text-gray-600 text-xs tracking-wide leading-relaxed" style={{ background: '#0a0d10', border: '1px solid rgba(255,255,255,0.05)' }}>
              FORMAT: [STUDENT_ID]:[MARK_0-100]<br/>
              RECORDS_LOADED: {students.length}
            </div>
            <button
              onClick={handleProcessBuffer}
              disabled={processing || !bulkText.trim()}
              className="mt-3 py-2.5 text-xs tracking-widest border transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                color:        processing ? '#00ffff' : '#d1d5db',
                borderColor:  processing ? '#00ffff' : 'rgba(107,114,128,0.6)',
                opacity:      !bulkText.trim() ? 0.4 : 1,
                fontFamily:   "'Share Tech Mono', monospace",
              }}
            >
              {processing ? (
                <>
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  PROCESSING...
                </>
              ) : 'PROCESS_BUFFER'}
            </button>
          </div>
        </div>

        {/* Roster Matrix Table — live Firestore data */}
        <div className="border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,255,255,0.08)' }}>
            <div>
              <span className="text-white text-sm font-bold tracking-widest">ROSTER_MATRIX</span>
              {published && (
                <span className="ml-3 px-2 py-0.5 text-xs tracking-widest border border-cyan-400/40 text-cyan-400" style={{ background: 'rgba(0,255,255,0.06)' }}>
                  RESULTS PUBLISHED
                </span>
              )}
            </div>
            <span className="text-gray-600 text-xs tracking-widest">
              {students.length} RECORDS // FIRESTORE_LIVE
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['STUDENT_ENTITY','NODE_ID','MARK','GRADE','STATUS','PUBLISHED'].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-xs text-gray-600 tracking-widest font-normal">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-cyan-900/20 animate-pulse rounded-sm" style={{ width: j === 0 ? '140px' : '60px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-600 text-xs tracking-widest">
                    [ NO_RECORDS_IN_DATABASE ]<br />
                    <span className="text-gray-700">ADD RECORDS VIA OPERATIONS_GRID</span>
                  </td>
                </tr>
              ) : paged.map((s, i) => {
                const grade = letterGrade(s.mark || 0);
                const gradeColor = { A: '#00ffff', B: '#6366f1', C: '#f59e0b', D: '#fb923c', E: '#ef4444' }[grade];
                return (
                  <tr key={s._docId} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initial={(s.name || '?')[0].toUpperCase()}
                          color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                        />
                        <span className="text-gray-200 text-sm tracking-wide">{s.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-sm tracking-wider">{s.id || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="px-3 py-1 text-sm font-bold text-white" style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {s.mark ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold" style={{ color: gradeColor }}>{grade}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="px-2 py-0.5 text-xs tracking-widest border"
                        style={{
                          color:       s.status === 'CRITICAL_LOW' ? '#f59e0b' : '#00ffff',
                          borderColor: s.status === 'CRITICAL_LOW' ? 'rgba(245,158,11,0.4)' : 'rgba(0,255,255,0.3)',
                          background:  s.status === 'CRITICAL_LOW' ? 'rgba(245,158,11,0.08)' : 'rgba(0,255,255,0.06)',
                        }}
                      >
                        [ {s.status || 'NOMINAL'} ]
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs tracking-widest" style={{ color: s.published ? '#00ffff' : '#4b5563' }}>
                        {s.published ? '● LIVE' : '○ STAGED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-5 py-3 flex items-center justify-center gap-2 border-t" style={{ borderColor: 'rgba(0,255,255,0.06)' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 text-xs tracking-widest transition-all text-gray-600 hover:text-gray-400 disabled:opacity-30 cursor-pointer"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className="w-8 h-8 text-xs tracking-widest transition-all cursor-pointer"
                  style={{
                    color:       page === p ? '#00ffff' : '#6b7280',
                    border:      page === p ? '1px solid rgba(0,255,255,0.4)' : '1px solid transparent',
                    background:  page === p ? 'rgba(0,255,255,0.06)' : 'transparent',
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 text-xs tracking-widest transition-all text-gray-600 hover:text-gray-400 disabled:opacity-30 cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-2 border-t flex items-center justify-between" style={{ borderColor: 'rgba(0,255,255,0.06)', background: '#0a0d10' }}>
        <span className="text-gray-700 text-xs tracking-widest">SYSTEM_STABLE // NEURAL_LINK_V4.2</span>
        <span className="text-gray-700 text-xs tracking-widest">ENCRYPTION_MODE: AES-256-GCM</span>
        <span className="text-gray-700 text-xs tracking-widest">LOCAL_TIME: {localTime}</span>
      </div>
    </div>
  );
}
