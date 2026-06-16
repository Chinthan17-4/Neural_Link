// ──────────────────────────────────────────────────────────────────────────────
// RosterPage.jsx — Live Firestore data (no hardcoded students)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const AVATAR_BG = ['#1a3a4a','#2d1b4a','#1a4a3a','#1a2a4a','#4a1a3a','#4a3a1a'];

function statusProps(status) {
  if (status === 'CRITICAL_LOW') return { color: '#ef4444', label: 'CRITICAL' };
  return { color: '#00ffff', label: 'NOMINAL' };
}

export default function RosterPage() {
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('ALL');
  const [page,      setPage]      = useState(1);
  const PAGE_SIZE = 8;

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Filter + search
  const filtered = students.filter(s => {
    const matchSearch =
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.id   || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'ALL'          ? true :
      filter === 'NOMINAL'      ? s.status === 'NOMINAL' :
      filter === 'CRITICAL_LOW' ? s.status === 'CRITICAL_LOW' : true;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const nominalCount  = students.filter(s => s.status !== 'CRITICAL_LOW').length;
  const criticalCount = students.filter(s => s.status === 'CRITICAL_LOW').length;
  const publishedCount = students.filter(s => s.published).length;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Share Tech Mono', monospace", background: '#090c0f' }}>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-cyan-400"/>
              <span className="text-gray-500 text-xs tracking-widest">ROSTER_MANAGEMENT_INTERFACE // FIRESTORE_LIVE</span>
            </div>
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'Orbitron', monospace" }}>
              Student Roster
            </h2>
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <div className="text-gray-600 text-xs tracking-widest">TOTAL_ENROLLMENT</div>
              <div className="text-white text-3xl font-bold tracking-wide">
                {loading ? '—' : students.length}
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-xs tracking-widest">NOMINAL_LINKS</div>
              <div className="text-cyan-400 text-3xl font-bold tracking-wide">
                {loading ? '—' : students.length > 0
                  ? `${Math.round((nominalCount / students.length) * 100)}%`
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-4 p-4 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          {/* Search input */}
          <div className="flex-1 relative">
            <div className="text-gray-600 text-xs tracking-widest mb-1">SEARCH_ENTITY</div>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="NAME_OR_NODE_ID..."
              className="w-full bg-black/40 border border-gray-700/50 text-gray-300 text-xs px-3 py-2 tracking-widest focus:outline-none focus:border-cyan-500/40"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            />
          </div>

          {/* Status filter */}
          <div>
            <div className="text-gray-600 text-xs tracking-widest mb-1">SYNC_STATUS</div>
            <div className="flex">
              {['ALL','NOMINAL','CRITICAL_LOW'].map(s => (
                <button key={s}
                  onClick={() => { setFilter(s); setPage(1); }}
                  className="px-3 py-2 text-xs tracking-widest transition-all"
                  style={{
                    border:      '1px solid',
                    borderColor: filter === s ? '#00ffff' : 'rgba(255,255,255,0.1)',
                    color:       filter === s ? '#00ffff' : '#6b7280',
                    background:  filter === s ? 'rgba(0,255,255,0.08)' : 'transparent',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stats chips */}
          <div className="ml-auto flex gap-3 items-center">
            <div className="text-center">
              <div className="text-gray-600 text-[10px] tracking-widest">CRITICAL</div>
              <div className="text-red-400 text-lg font-bold">{loading ? '—' : criticalCount}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 text-[10px] tracking-widest">PUBLISHED</div>
              <div className="text-cyan-400 text-lg font-bold">{loading ? '—' : publishedCount}</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(0,255,255,0.08)' }}>
                {['STUDENT_ENTITY','NODE_ID','CURRENT_MARK','SYNC_STATUS','PUBLISHED','COMMAND_ACTIONS'].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-xs text-gray-600 tracking-widest font-normal">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-cyan-900/20 animate-pulse rounded-sm" style={{ width: j === 0 ? '140px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-600 text-xs tracking-widest">
                    [ NO_RECORDS_FOUND ]<br/>
                    <span className="text-gray-700 text-[10px]">
                      {students.length === 0
                        ? 'ADD RECORDS VIA OPERATIONS_GRID'
                        : 'TRY ADJUSTING YOUR SEARCH OR FILTER'}
                    </span>
                  </td>
                </tr>
              ) : paged.map((s, i) => {
                const sp = statusProps(s.status);
                return (
                  <tr key={s._docId} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: AVATAR_BG[i % AVATAR_BG.length], border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb' }}
                        >
                          {(s.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-200 text-sm tracking-wide">{s.name || '—'}</div>
                          <div className="text-gray-600 text-xs tracking-wider">NEURAL_LINK_DB</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm tracking-wider">{s.id || '—'}</td>
                    <td className="px-5 py-4">
                      {/* Mini mark bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-800 rounded-sm overflow-hidden">
                          <div
                            className="h-full rounded-sm"
                            style={{
                              width: `${s.mark || 0}%`,
                              background: (s.mark || 0) >= 70 ? '#00ffff' : (s.mark || 0) >= 50 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: (s.mark || 0) >= 70 ? '#00ffff' : (s.mark || 0) >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {s.mark ?? '—'}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full status-dot" style={{ background: sp.color, boxShadow: `0 0 4px ${sp.color}` }}/>
                        <span className="text-sm tracking-wider" style={{ color: sp.color }}>{s.status || 'NOMINAL'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs tracking-widest" style={{ color: s.published ? '#00ffff' : '#4b5563' }}>
                        {s.published ? '● LIVE' : '○ STAGED'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button className="text-xs tracking-widest text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer">
                          VIEW_PROFILE
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: 'rgba(0,255,255,0.06)' }}>
            <span className="text-gray-600 text-xs tracking-widest">
              SHOWING {filtered.length === 0 ? 0 : (page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} OF {filtered.length} ENTITIES
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-30 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-8 h-8 text-xs tracking-widest transition-all cursor-pointer"
                    style={{
                      border:      '1px solid',
                      borderColor: page === p ? '#00ffff' : 'rgba(255,255,255,0.1)',
                      color:       page === p ? '#00ffff' : '#6b7280',
                      background:  page === p ? 'rgba(0,255,255,0.08)' : 'transparent',
                    }}>
                    {String(p).padStart(2,'0')}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page >= totalPages}
                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-30 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'NOMINAL_RECORDS',
              value: loading ? '—' : nominalCount,
              unit: '', sub: 'STABLE_SYNC', subColor: '#00ffff',
              icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,255,255,0.12)" strokeWidth="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
            },
            {
              label: 'CRITICAL_LOW_RECORDS',
              value: loading ? '—' : criticalCount,
              unit: '', sub: 'REQUIRES_ATTENTION', subColor: '#ef4444',
              icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.12)" strokeWidth="1"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
            },
            {
              label: 'RESULTS_PUBLISHED',
              value: loading ? '—' : publishedCount,
              unit: '', sub: publishedCount > 0 ? 'LIVE_IN_SYSTEM' : 'PENDING', subColor: publishedCount > 0 ? '#00ffff' : '#6b7280',
              icon: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,255,255,0.12)" strokeWidth="1"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
            },
          ].map(card => (
            <div key={card.label} className="px-5 py-4 border relative overflow-hidden" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
              <div className="text-gray-600 text-xs tracking-widest mb-2">{card.label}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-white text-4xl font-bold tracking-wide">{card.value}</span>
                {card.unit && <span className="text-gray-500 text-lg">{card.unit}</span>}
                <span className="text-sm tracking-wider" style={{ color: card.subColor }}>{card.sub}</span>
              </div>
              <div className="absolute right-4 bottom-3 opacity-60">{card.icon}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
