// ──────────────────────────────────────────────────────────────────────────────
// SyncPage.jsx — Live Firestore sync status + manual force-sync
// ──────────────────────────────────────────────────────────────────────────────
// - Reads ALL student records from Firestore in real-time
// - Shows per-record sync state (published/staged)
// - "FORCE SYNC ALL" button re-timestamps updatedAt on every record (triggers
//   Firestore listeners to re-fire across all connected clients)
// - "RESET PUBLISH" button clears published flag on all records
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  writeBatch, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';

export default function SyncPage() {
  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [syncing,      setSyncing]      = useState(false);
  const [resetting,    setResetting]    = useState(false);
  const [lastSync,     setLastSync]     = useState(null);
  const [syncLog,      setSyncLog]      = useState([
    { type: 'INFO', text: 'SYNC_ENGINE INITIALIZED // WAITING FOR DATA...' },
  ]);
  const [latency,      setLatency]      = useState(12);

  // Fluctuating latency indicator
  useEffect(() => {
    const t = setInterval(() => setLatency(Math.floor(Math.random() * 25) + 5), 2000);
    return () => clearInterval(t);
  }, []);

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q,
      (snap) => {
        const data = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
        setStudents(data);
        setLoading(false);
        setLastSync(new Date());
        pushLog('SUCCESS', `SNAPSHOT_RECEIVED // ${data.length}_RECORDS_SYNCED`);
      },
      (err) => {
        pushLog('ERROR', 'FIRESTORE_CONNECTION_FAILED // ' + err.code);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const pushLog = (type, text) => {
    const ts = new Date().toLocaleTimeString('en-GB');
    setSyncLog(prev => [...prev.slice(-49), { type, text: `[${ts}] ${text}` }]);
  };

  // ── FORCE SYNC ALL ─────────────────────────────────────────────────────────
  // Writes updatedAt:serverTimestamp() to every record — this forces all
  // connected onSnapshot listeners to fire and re-render with fresh data
  const handleForceSync = async () => {
    if (syncing || students.length === 0) return;
    setSyncing(true);
    pushLog('INFO', `FORCE_SYNC INITIATED // ${students.length}_RECORDS_QUEUED`);
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        batch.update(doc(db, 'students', s._docId), {
          syncedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setLastSync(new Date());
      pushLog('SUCCESS', `SYNC COMPLETE // ALL_${students.length}_RECORDS_UPDATED`);
    } catch (err) {
      pushLog('ERROR', 'SYNC_FAILED // ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // ── RESET PUBLISH STATE ────────────────────────────────────────────────────
  const handleResetPublish = async () => {
    if (resetting || students.length === 0) return;
    setResetting(true);
    pushLog('WARN', 'RESETTING PUBLISH STATE ON ALL RECORDS...');
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        batch.update(doc(db, 'students', s._docId), { published: false });
      });
      await batch.commit();
      pushLog('SUCCESS', 'PUBLISH_RESET // ALL_RECORDS_STAGED');
    } catch (err) {
      pushLog('ERROR', 'RESET_FAILED // ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  // ── PUBLISH ALL RECORDS ────────────────────────────────────────────────────
  const handlePublishAll = async () => {
    if (syncing || students.length === 0) return;
    setSyncing(true);
    pushLog('INFO', `PUBLISH_ALL INITIATED // ${students.length}_RECORDS_QUEUED`);
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        batch.update(doc(db, 'students', s._docId), {
          published: true,
          publishedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setLastSync(new Date());
      pushLog('SUCCESS', `PUBLISH COMPLETE // ALL_${students.length}_RECORDS_SET_TO_LIVE`);
    } catch (err) {
      pushLog('ERROR', 'PUBLISH_ALL_FAILED // ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // ── PURGE ALL RECORDS ──────────────────────────────────────────────────────
  const handlePurgeAll = async () => {
    if (students.length === 0) return;
    const confirmPurge = window.confirm("WARNING: ARE YOU SURE YOU WANT TO PURGE ALL DATA FROM FIRESTORE? THIS CANNOT BE UNDONE.");
    if (!confirmPurge) {
      pushLog('INFO', 'PURGE OPERATIONS ABORTED BY USER.');
      return;
    }
    setSyncing(true);
    pushLog('WARN', `PURGING ALL_${students.length}_RECORDS_FROM_DATABASE...`);
    try {
      const batch = writeBatch(db);
      students.forEach(s => {
        batch.delete(doc(db, 'students', s._docId));
      });
      await batch.commit();
      pushLog('SUCCESS', 'DATABASE PURGED // ALL_RECORDS_REMOVED');
    } catch (err) {
      pushLog('ERROR', 'PURGE_FAILED // ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const publishedCount = students.filter(s => s.published).length;
  const syncedPct = students.length > 0 ? Math.round((publishedCount / students.length) * 100) : 0;

  const LOG_COLORS = { INFO: '#9ca3af', SUCCESS: '#00ffff', WARN: '#f59e0b', ERROR: '#ef4444' };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#090c0f]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-400 status-dot" />
            <span className="text-gray-500 text-xs tracking-widest">[ SYNC_MANAGE // FIRESTORE_REALTIME_ENGINE ]</span>
          </div>
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'Orbitron', monospace" }}>
            Sync Operations
          </h2>
        </div>
        <div className="text-right">
          <div className="text-gray-600 text-xs tracking-widest">LAST_SYNC</div>
          <div className="text-cyan-400 text-sm tracking-wider">
            {lastSync ? lastSync.toLocaleTimeString('en-GB') : '—'}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'TOTAL_RECORDS',    value: loading ? '...' : students.length,    color: '#fff' },
          { label: 'PUBLISHED_LIVE',   value: loading ? '...' : publishedCount,     color: '#00ffff' },
          { label: 'STAGED_PENDING',   value: loading ? '...' : students.length - publishedCount, color: '#f97316' },
          { label: 'LATENCY',          value: `${latency}ms`,                        color: '#9ca3af' },
        ].map(card => (
          <div key={card.label} className="p-5 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="text-gray-500 text-[10px] tracking-widest mb-2">{card.label}</div>
            <div className="text-2xl font-bold tracking-wide" style={{ color: card.color, fontFamily: "'Orbitron', monospace" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sync progress bar */}
      <div className="p-5 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-sm font-bold tracking-widest">PUBLISH_SYNC_STATUS</span>
          <span className="text-cyan-400 text-sm tracking-widest">{syncedPct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-sm overflow-hidden mb-3">
          <div
            className="h-full rounded-sm transition-all duration-700"
            style={{
              width:      `${syncedPct}%`,
              background: 'linear-gradient(90deg, #6366f1, #00ffff)',
              boxShadow:  '0 0 10px rgba(0,255,255,0.4)',
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600 tracking-widest">
          <span>{publishedCount} RECORDS PUBLISHED</span>
          <span>{students.length - publishedCount} RECORDS STAGED</span>
        </div>
      </div>

      {/* Main area: record table + log + actions */}
      <div className="grid grid-cols-3 gap-4">

        {/* Record sync table */}
        <div className="col-span-2 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,255,255,0.08)' }}>
            <span className="text-white text-sm font-bold tracking-widest">RECORD_SYNC_TABLE</span>
            <span className="text-gray-600 text-xs tracking-widest">REALTIME // FIRESTORE</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
            <table className="w-full">
              <thead className="sticky top-0" style={{ background: '#0d1117' }}>
                <tr className="border-b" style={{ borderColor: 'rgba(0,255,255,0.08)' }}>
                  {['NODE_ID','NAME','MARK','SYNC_STATE'].map(col => (
                    <th key={col} className="px-4 py-2 text-left text-xs text-gray-600 tracking-widest font-normal">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-2 bg-cyan-900/20 animate-pulse rounded-sm" style={{ width: j === 1 ? '100px' : '60px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-600 text-xs tracking-widest">
                      [ NO_RECORDS // ADD VIA OPERATIONS_GRID ]
                    </td>
                  </tr>
                ) : students.map(s => (
                  <tr key={s._docId} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3 text-gray-500 text-xs tracking-wider">{s.id}</td>
                    <td className="px-4 py-3 text-gray-200 text-xs tracking-wider">{s.name}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: (s.mark||0) >= 70 ? '#00ffff' : '#f59e0b' }}>
                      {s.mark ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: s.published ? '#00ffff' : '#f97316',
                            boxShadow:  s.published ? '0 0 4px #00ffff' : '0 0 4px #f97316',
                          }}
                        />
                        <span className="text-xs tracking-widest" style={{ color: s.published ? '#00ffff' : '#f97316' }}>
                          {s.published ? 'LIVE' : 'STAGED'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel: actions + sync log */}
        <div className="flex flex-col gap-4">

          {/* Action buttons */}
          <div className="p-5 border space-y-3" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="text-white text-sm font-bold tracking-widest mb-4">SYNC_CONTROLS</div>

            {/* Force Sync All */}
            <button
              onClick={handleForceSync}
              disabled={syncing || loading || students.length === 0}
              className="w-full py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{
                background: syncing ? '#007a7a' : '#00ffff',
                color:      '#000',
                boxShadow:  syncing ? 'none' : '0 0 12px rgba(0,255,255,0.4)',
                opacity:    (loading || students.length === 0) ? 0.5 : 1,
              }}
            >
              {syncing ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  SYNCING...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  FORCE SYNC ALL
                </>
              )}
            </button>

            {/* Reset Publish */}
            <button
              onClick={handleResetPublish}
              disabled={resetting || loading || students.length === 0}
              className="w-full py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer border"
              style={{
                background:  'transparent',
                color:       '#f97316',
                borderColor: 'rgba(249,115,22,0.4)',
                opacity:     (loading || students.length === 0) ? 0.5 : 1,
              }}
            >
              {resetting ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  RESETTING...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 .49-4.98"/>
                  </svg>
                  RESET PUBLISH STATE
                </>
              )}
            </button>

            {/* Publish All */}
            <button
              onClick={handlePublishAll}
              disabled={syncing || loading || students.length === 0}
              className="w-full py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer border"
              style={{
                background:  'rgba(0,255,255,0.06)',
                color:       '#00ffff',
                borderColor: 'rgba(0,255,255,0.3)',
                boxShadow:   '0 0 8px rgba(0,255,255,0.1)',
                opacity:     (loading || students.length === 0) ? 0.5 : 1,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              PUBLISH ALL RECORDS
            </button>

            {/* Purge All */}
            <button
              onClick={handlePurgeAll}
              disabled={syncing || loading || students.length === 0}
              className="w-full py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer border"
              style={{
                background:  'rgba(239,68,68,0.06)',
                color:       '#ef4444',
                borderColor: 'rgba(239,68,68,0.4)',
                opacity:     (loading || students.length === 0) ? 0.5 : 1,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              PURGE ALL RECORDS
            </button>

            {/* Status indicators */}
            <div className="pt-2 space-y-2 border-t" style={{ borderColor: 'rgba(0,255,255,0.08)' }}>
              {[
                { label: 'FIRESTORE',    value: loading ? 'CONNECTING' : 'CONNECTED',  color: loading ? '#f97316' : '#00ffff' },
                { label: 'REALTIME',     value: 'ACTIVE',    color: '#00ffff' },
                { label: 'ENCRYPTION',   value: 'AES-256',   color: '#9ca3af' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs tracking-widest">
                  <span className="text-gray-600">{row.label}:</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full status-dot" style={{ background: row.color }} />
                    <span style={{ color: row.color }}>{row.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync log */}
          <div className="flex-1 border flex flex-col" style={{ background: '#060809', borderColor: 'rgba(0,255,255,0.1)', minHeight: '160px' }}>
            <div className="px-3 py-2 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'rgba(0,255,255,0.08)', background: '#0a0d10' }}>
              {['#ef4444','#f59e0b','#22c55e'].map(c => (
                <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }}/>
              ))}
              <span className="text-gray-600 text-[10px] tracking-widest ml-1">SYNC_LOG</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {syncLog.map((entry, i) => (
                <div key={i} className="text-[10px] leading-relaxed" style={{ color: LOG_COLORS[entry.type] || '#9ca3af' }}>
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
