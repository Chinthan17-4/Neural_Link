// ──────────────────────────────────────────────────────────────────────────────
// AttendancePage.jsx — Full Firestore-backed Attendance Module
// ──────────────────────────────────────────────────────────────────────────────
// - Reads students from Firestore (students collection)
// - Reads/writes attendance from Firestore (attendance collection)
// - Faculty marks each student PRESENT / ABSENT / LATE for any date
// - Shows per-day stats and per-student overall attendance summary
// Firestore doc ID format: attendance/{YYYY-MM-DD}_{studentDocId}
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  setDoc, doc, getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';

// ── Helpers ───────────────────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD

const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

const formatDisplay = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

// Status config
const STATUS_CFG = {
  PRESENT: { color: '#00ffff', bg: 'rgba(0,255,255,0.10)', border: 'rgba(0,255,255,0.5)', label: 'PRESENT' },
  ABSENT: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.5)', label: 'ABSENT' },
  LATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.5)', label: 'LATE' },
};

// ── Sub-component: Status toggle button ───────────────────────────────────────
function StatusBtn({ value, active, onClick, disabled }) {
  const cfg = STATUS_CFG[value];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-[10px] font-bold tracking-widest transition-all duration-150 cursor-pointer border"
      style={{
        background: active ? cfg.bg : 'transparent',
        color: active ? cfg.color : '#4b5563',
        borderColor: active ? cfg.border : 'rgba(255,255,255,0.08)',
        boxShadow: active ? `0 0 8px ${cfg.color}40` : 'none',
      }}
    >
      {cfg.label}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AttendancePage({ user }) {
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});   // { studentDocId: 'PRESENT'|'ABSENT'|'LATE' }
  const [allAttendance, setAllAttendance] = useState([]); // all attendance docs for summary
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAtt, setLoadingAtt] = useState(true);
  const [marking, setMarking] = useState(null); // docId being marked
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // ── READ: students collection ────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ _docId: d.id, ...d.data() })));
      setLoadingStudents(false);
    });
    return unsub;
  }, []);

  // ── READ: attendance for selected date (real-time) ───────────────────────────
  useEffect(() => {
    setLoadingAtt(true);
    const q = query(collection(db, 'attendance'));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
      setAllAttendance(all);

      // Filter for selected date
      const todayRec = {};
      all
        .filter(r => r.date === selectedDate)
        .forEach(r => { todayRec[r.studentDocId] = r.status; });
      setAttendance(todayRec);
      setLoadingAtt(false);
    });
    return unsub;
  }, [selectedDate]);

  // ── WRITE: mark attendance ────────────────────────────────────────────────────
  const markAttendance = async (student, status) => {
    if (marking) return;
    setMarking(student._docId);
    try {
      const docId = `${selectedDate}_${student._docId}`;
      await setDoc(doc(db, 'attendance', docId), {
        studentDocId: student._docId,
        studentId: student.id || '',
        studentName: student.name || '',
        date: selectedDate,
        status,
        markedAt: new Date().toISOString(),
        markedBy: user?.email || 'faculty',
      });
      showToast(`${student.name || student.id} → ${status}`);
    } catch (err) {
      showToast('MARK_FAILED // ' + err.message);
    } finally {
      setMarking(null);
    }
  };

  // ── Computed stats for selected date ─────────────────────────────────────────
  const todayValues = Object.values(attendance);
  const presentCount = todayValues.filter(s => s === 'PRESENT').length;
  const absentCount = todayValues.filter(s => s === 'ABSENT').length;
  const lateCount = todayValues.filter(s => s === 'LATE').length;
  const markedCount = todayValues.length;
  const avgPct = students.length > 0
    ? Math.round(((presentCount + lateCount * 0.5) / students.length) * 100)
    : 0;

  // ── Per-student summary (all-time) ────────────────────────────────────────────
  const summary = students.map(s => {
    const recs = allAttendance.filter(r => r.studentDocId === s._docId);
    const total = recs.length;
    const present = recs.filter(r => r.status === 'PRESENT').length;
    const absent = recs.filter(r => r.status === 'ABSENT').length;
    const late = recs.filter(r => r.status === 'LATE').length;
    const pct = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : null;
    return { ...s, total, present, absent, late, pct };
  });

  const isToday = selectedDate === toISO(new Date());

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Share Tech Mono', monospace", background: '#090c0f' }}>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-5 py-3 text-xs tracking-widest border"
          style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.4)', color: '#00ffff', boxShadow: '0 0 20px rgba(0,255,255,0.2)', fontFamily: "'Share Tech Mono', monospace" }}
        >
          ✓ {toast}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-cyan-400" />
              <span className="text-gray-500 text-xs tracking-widest">[ ATTENDANCE_MANAGEMENT // FIRESTORE_LIVE ]</span>
            </div>
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'Orbitron', monospace" }}>
              Attendance
            </h2>
          </div>
          <div className="text-right">
            <div className="text-gray-600 text-xs tracking-widest">MARKED_TODAY</div>
            <div className="text-cyan-400 text-2xl font-bold tracking-wide">
              {loadingStudents ? '—' : `${markedCount}/${students.length}`}
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'PRESENT_TODAY', value: loadingAtt ? '—' : presentCount, color: '#00ffff' },
            { label: 'ABSENT_TODAY', value: loadingAtt ? '—' : absentCount, color: '#ef4444' },
            { label: 'LATE_TODAY', value: loadingAtt ? '—' : lateCount, color: '#f59e0b' },
            { label: 'ATTENDANCE_%', value: loadingAtt ? '—' : `${avgPct}%`, color: avgPct >= 75 ? '#00ffff' : avgPct >= 50 ? '#f59e0b' : '#ef4444' },
          ].map(card => (
            <div key={card.label} className="p-5 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
              <div className="text-gray-500 text-[10px] tracking-widest mb-2">{card.label}</div>
              <div className="text-2xl font-bold tracking-wide" style={{ color: card.color, fontFamily: "'Orbitron', monospace" }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Date navigation ── */}
        <div className="flex items-center gap-4 p-4 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          <button
            onClick={() => setSelectedDate(d => addDays(d, -1))}
            className="w-9 h-9 flex items-center justify-center border border-cyan-500/20 text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition-all cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          <div className="flex-1 text-center">
            <div className="text-white text-sm tracking-widest font-bold">{formatDisplay(selectedDate)}</div>
            {isToday && <div className="text-cyan-400 text-[10px] tracking-widest mt-0.5">[ TODAY ]</div>}
          </div>

          <button
            onClick={() => setSelectedDate(d => addDays(d, 1))}
            disabled={isToday}
            className="w-9 h-9 flex items-center justify-center border border-cyan-500/20 text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          <div className="ml-4">
            <input
              type="date"
              value={selectedDate}
              max={toISO(new Date())}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-black/40 border border-gray-700/50 text-gray-300 text-xs px-3 py-2 tracking-wider focus:outline-none focus:border-cyan-500/40 cursor-pointer"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            />
          </div>
        </div>

        {/* ── Mark Attendance table ── */}
        <div className="border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,255,255,0.08)' }}>
            <div>
              <span className="text-white text-sm font-bold tracking-widest">MARK_ATTENDANCE</span>
              <span className="ml-3 text-gray-600 text-xs tracking-widest">{formatDisplay(selectedDate)}</span>
            </div>
            <span className="text-gray-600 text-xs tracking-widest">{students.length} ENTITIES // FIRESTORE_LIVE</span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['STUDENT_ENTITY', 'NODE_ID', 'CURRENT_MARK', 'STATUS', 'MARK_ATTENDANCE'].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-xs text-gray-600 tracking-widest font-normal">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingStudents ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-cyan-900/20 animate-pulse rounded-sm" style={{ width: j === 0 ? '140px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-600 text-xs tracking-widest">
                    [ NO_STUDENTS_FOUND ]<br />
                    <span className="text-gray-700 text-[10px]">ADD STUDENTS VIA OPERATIONS_GRID FIRST</span>
                  </td>
                </tr>
              ) : students.map((s, i) => {
                const status = attendance[s._docId] || null;
                const isMarking = marking === s._docId;
                const markColors = ['#1a3a4a', '#2d1b4a', '#1a4a3a', '#1a2a4a', '#4a1a3a', '#4a3a1a'];
                return (
                  <tr key={s._docId} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {/* Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: markColors[i % markColors.length], border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb' }}
                        >
                          {(s.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-200 text-sm tracking-wide">{s.name || '—'}</div>
                          {status && (
                            <div className="text-[10px] tracking-widest mt-0.5" style={{ color: STATUS_CFG[status]?.color }}>
                              ● {status}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Node ID */}
                    <td className="px-5 py-3 text-gray-500 text-sm tracking-wider">{s.id || '—'}</td>
                    {/* Mark */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-sm overflow-hidden">
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
                    {/* Status badge */}
                    <td className="px-5 py-3">
                      {status ? (
                        <span
                          className="px-2 py-0.5 text-xs tracking-widest border"
                          style={{
                            color: STATUS_CFG[status].color,
                            borderColor: STATUS_CFG[status].border,
                            background: STATUS_CFG[status].bg,
                          }}
                        >
                          [ {status} ]
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs tracking-widest">[ NOT_MARKED ]</span>
                      )}
                    </td>
                    {/* Mark buttons */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {['PRESENT', 'ABSENT', 'LATE'].map(val => (
                          <StatusBtn
                            key={val}
                            value={val}
                            active={status === val}
                            disabled={isMarking}
                            onClick={() => markAttendance(s, val)}
                          />
                        ))}
                        {isMarking && (
                          <svg className="animate-spin text-cyan-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Per-student Attendance Summary ── */}
        <div className="border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,255,255,0.08)' }}>
            <span className="text-white text-sm font-bold tracking-widest">ATTENDANCE_SUMMARY</span>
            <span className="text-gray-600 text-xs tracking-widest">ALL_TIME // AGGREGATED</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {['STUDENT_ENTITY', 'NODE_ID', 'TOTAL_SESSIONS', 'PRESENT', 'ABSENT', 'LATE', 'ATTENDANCE_%'].map(col => (
                  <th key={col} className="px-5 py-3 text-left text-xs text-gray-600 tracking-widest font-normal">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-600 text-xs tracking-widest">
                    [ NO_ATTENDANCE_DATA_YET ]
                  </td>
                </tr>
              ) : summary.map((s, i) => {
                const pctColor = s.pct === null ? '#4b5563' : s.pct >= 75 ? '#00ffff' : s.pct >= 50 ? '#f59e0b' : '#ef4444';
                const markColors = ['#1a3a4a', '#2d1b4a', '#1a4a3a', '#1a2a4a', '#4a1a3a', '#4a3a1a'];
                return (
                  <tr key={s._docId} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: markColors[i % markColors.length], border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb' }}
                        >
                          {(s.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-gray-200 text-sm tracking-wide">{s.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs tracking-wider">{s.id || '—'}</td>
                    <td className="px-5 py-3 text-gray-300 text-sm tracking-wider">{s.total}</td>
                    <td className="px-5 py-3 font-bold text-sm" style={{ color: '#00ffff' }}>{s.present}</td>
                    <td className="px-5 py-3 font-bold text-sm" style={{ color: '#ef4444' }}>{s.absent}</td>
                    <td className="px-5 py-3 font-bold text-sm" style={{ color: '#f59e0b' }}>{s.late}</td>
                    <td className="px-5 py-3">
                      {s.pct === null ? (
                        <span className="text-gray-600 text-xs tracking-widest">NO_DATA</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-gray-800 rounded-sm overflow-hidden">
                            <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${s.pct}%`, background: pctColor }} />
                          </div>
                          <span className="text-xs font-bold tracking-widest" style={{ color: pctColor }}>{s.pct}%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-2 border-t flex items-center justify-between" style={{ borderColor: 'rgba(0,255,255,0.06)', background: '#0a0d10' }}>
        <span className="text-gray-700 text-xs tracking-widest">ATTENDANCE_ENGINE // FIRESTORE_REALTIME</span>
        <span className="text-gray-700 text-xs tracking-widest">MARKED_BY: {user?.email || 'FACULTY'}</span>
      </div>
    </div>
  );
}
