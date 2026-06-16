import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const INITIAL_LOGS = [
  { type: 'INFO',    text: 'INITIALIZING NEURAL_LINK_FACULTY SYSTEM OPERATIONS...' },
  { type: 'INFO',    text: 'MOUNTING SECTOR_7G DATA VOLUMES...' },
  { type: 'SUCCESS', text: 'HANDSHAKE COMPLETE WITH CORE_HUB_PRIMARY' },
  { type: 'INFO',    text: 'LOADING FACULTY_AUTH_PROTOCOLS...' },
  { type: 'WARN',    text: 'LATENCY DETECTED ON SUBNODE_DELTA_9 (42ms)' },
  { type: 'INFO',    text: 'STARTING BACKGROUND ENCRYPTION ROTATION...' },
  { type: 'INFO',    text: 'MONITORING PORT 8080 FOR INCOMING TELEMETRY' },
  { type: 'ERROR',   text: 'UNRECOGNIZED SYNAPTIC PATTERN IN BLOCK_429' },
  { type: 'INFO',    text: 'RUNNING DIAGNOSTIC: /usr/local/bin/neural_check --deep' },
  { type: 'SUCCESS', text: 'INTEGRITY VERIFIED. 0 ERRORS FOUND.' },
  { type: 'INFO',    text: 'AWAITING COMMAND_INPUT...' },
];

const TELEMETRY = [12, 28, 45, 70, 38, 90, 55, 80, 62, 95];

const LOG_COLORS = {
  INFO:    '#9ca3af',
  SUCCESS: '#00ffff',
  WARN:    '#f59e0b',
  ERROR:   '#ef4444',
};

export default function TerminalPage({ user }) {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [command, setCommand] = useState('');
  const [uptime, setUptime] = useState({ h: 242, m: 15, s: 4 });
  const [latency, setLatency] = useState(12);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Uptime clock
  useEffect(() => {
    const t = setInterval(() => {
      setUptime(prev => {
        let { h, m, s } = prev;
        s++;
        if (s >= 60) { s = 0; m++; }
        if (m >= 60) { m = 0; h++; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Fluctuating latency
  useEffect(() => {
    const t = setInterval(() => setLatency(Math.floor(Math.random() * 30) + 5), 2500);
    return () => clearInterval(t);
  }, []);

  const pad = n => String(n).padStart(2, '0');

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    const cmd = command.trim().toUpperCase();
    
    // Log entered command
    setLogs(prev => [...prev, { type: 'INFO', text: `> ${command}` }]);
    setCommand('');

    if (cmd === 'CLEAR') {
      setLogs([{ type: 'INFO', text: 'TERMINAL CLEARED.' }]);
      return;
    }

    if (cmd === 'HELP') {
      setLogs(prev => [...prev, { type: 'SUCCESS', text: 'COMMANDS: CLEAR | STATUS | HELP | SYNC | PUBLISH | UNPUBLISH | PURGE_DB' }]);
      return;
    }

    if (cmd === 'STATUS') {
      setLogs(prev => [...prev, { type: 'SUCCESS', text: 'ALL SYSTEMS NOMINAL. NODE_LOAD: 74.2% | UPTIME: STABLE_SIGNAL' }]);
      return;
    }

    if (cmd === 'SYNC') {
      setLogs(prev => [...prev, { type: 'INFO', text: 'SYNC_ENGINE: FETCHING ALL RECORDS FROM FIRESTORE...' }]);
      try {
        const snapshot = await getDocs(collection(db, 'students'));
        if (snapshot.empty) {
          setLogs(prev => [...prev, { type: 'WARN', text: 'SYNC_ENGINE: NO RECORDS FOUND IN DATABASE // ABORTED.' }]);
          return;
        }
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
          batch.update(doc(db, 'students', d.id), { syncedAt: serverTimestamp() });
        });
        await batch.commit();
        setLogs(prev => [...prev, { type: 'SUCCESS', text: `SYNC COMPLETE // ${snapshot.size}_RECORDS_SYNCHRONIZED_AND_UPDATED.` }]);
      } catch (err) {
        setLogs(prev => [...prev, { type: 'ERROR', text: `SYNC_FAILED // ${err.message}` }]);
      }
      return;
    }

    if (cmd === 'PUBLISH') {
      setLogs(prev => [...prev, { type: 'INFO', text: 'PUBLISH_ENGINE: SETTING ALL RECORDS TO LIVE...' }]);
      try {
        const snapshot = await getDocs(collection(db, 'students'));
        if (snapshot.empty) {
          setLogs(prev => [...prev, { type: 'WARN', text: 'PUBLISH_ENGINE: NO RECORDS FOUND // ABORTED.' }]);
          return;
        }
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
          batch.update(doc(db, 'students', d.id), { published: true, publishedAt: serverTimestamp() });
        });
        await batch.commit();
        setLogs(prev => [...prev, { type: 'SUCCESS', text: `PUBLISH COMPLETE // ALL_${snapshot.size}_RECORDS_SET_TO_LIVE.` }]);
      } catch (err) {
        setLogs(prev => [...prev, { type: 'ERROR', text: `PUBLISH_FAILED // ${err.message}` }]);
      }
      return;
    }

    if (cmd === 'UNPUBLISH') {
      setLogs(prev => [...prev, { type: 'INFO', text: 'PUBLISH_ENGINE: REVERTING ALL RECORDS TO STAGED...' }]);
      try {
        const snapshot = await getDocs(collection(db, 'students'));
        if (snapshot.empty) {
          setLogs(prev => [...prev, { type: 'WARN', text: 'PUBLISH_ENGINE: NO RECORDS FOUND // ABORTED.' }]);
          return;
        }
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
          batch.update(doc(db, 'students', d.id), { published: false });
        });
        await batch.commit();
        setLogs(prev => [...prev, { type: 'SUCCESS', text: `UNPUBLISH COMPLETE // ALL_${snapshot.size}_RECORDS_STAGED.` }]);
      } catch (err) {
        setLogs(prev => [...prev, { type: 'ERROR', text: `UNPUBLISH_FAILED // ${err.message}` }]);
      }
      return;
    }

    if (cmd === 'PURGE_DB') {
      const confirmPurge = window.confirm("WARNING: PURGING THE ENTIRE FIRESTORE DATABASE THROUGH TERMINAL. PROCEED?");
      if (!confirmPurge) {
        setLogs(prev => [...prev, { type: 'INFO', text: 'PURGE OPERATION ABORTED BY OPERATOR.' }]);
        return;
      }
      setLogs(prev => [...prev, { type: 'WARN', text: 'PURGING ALL RECOVERY BLOCKS FROM COLD STORAGE...' }]);
      try {
        const snapshot = await getDocs(collection(db, 'students'));
        if (snapshot.empty) {
          setLogs(prev => [...prev, { type: 'SUCCESS', text: 'DATABASE ALREADY EMPTY // 0_RECORDS_REMOVED.' }]);
          return;
        }
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
          batch.delete(doc(db, 'students', d.id));
        });
        await batch.commit();
        setLogs(prev => [...prev, { type: 'SUCCESS', text: `DATABASE PURGED // ALL_${snapshot.size}_RECORDS_REMOVED.` }]);
      } catch (err) {
        setLogs(prev => [...prev, { type: 'ERROR', text: `PURGE_FAILED // ${err.message}` }]);
      }
      return;
    }

    setLogs(prev => [...prev, { type: 'WARN', text: `UNRECOGNIZED COMMAND: ${command}` }]);
  };

  const maxTel = Math.max(...TELEMETRY);

  return (
    <div className="flex h-full overflow-hidden" style={{ fontFamily: "'Share Tech Mono', monospace", background: '#090c0f' }}>

      {/* ── LEFT: Terminal main ── */}
      <div className="flex-1 flex flex-col overflow-hidden p-5 gap-4">

        {/* System stat cards */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: 'NODE_LOAD', value: '74.2%', sub: null, bar: true },
            { label: 'MEMORY_ALLOC', value: '16.8 TB', sub: '[ CACHE_STABLE ]', bar: false },
            { label: 'ENCRYPTION', value: 'AES_512', sub: '[ SECURE_LINK ]', bar: false },
            { label: 'UPTIME', value: `${pad(uptime.h)}:${pad(uptime.m)}:${pad(uptime.s)}`, sub: 'STABLE_SIGNAL', bar: false },
          ].map(card => (
            <div key={card.label} className="px-4 py-3 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
              <div className="text-gray-600 text-xs tracking-widest mb-1">{card.label}</div>
              <div className="text-white text-sm tracking-wide font-bold">{card.value}</div>
              {card.bar && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-5 h-2"
                      style={{ background: i < 4 ? '#00ffff' : '#374151', boxShadow: i < 4 ? '0 0 4px rgba(0,255,255,0.5)' : 'none' }}/>
                  ))}
                  <div className="w-5 h-2" style={{ background: '#1f2937' }}/>
                </div>
              )}
              {card.sub && <div className="text-cyan-500/60 text-xs tracking-wider mt-1">{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* Log terminal */}
        <div className="flex-1 border flex flex-col overflow-hidden" style={{ background: '#060809', borderColor: 'rgba(0,255,255,0.12)' }}>
          {/* Terminal title bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0" style={{ borderColor: 'rgba(0,255,255,0.08)', background: '#0a0d10' }}>
            <div className="flex items-center gap-2">
              {['#ef4444','#f59e0b','#22c55e'].map(c => (
                <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }}/>
              ))}
              <span className="text-gray-600 text-xs tracking-widest ml-2">SYSTEM_LOG_V4.0.2</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-500/60 text-xs tracking-wider">CONNECTED: SYNC_GATE_7</span>
              <button className="text-gray-600 hover:text-gray-400 transition-colors text-xs">✕</button>
            </div>
          </div>

          {/* Log output */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="text-gray-600 flex-shrink-0">#</span>
                <span style={{ color: LOG_COLORS[log.type] || '#9ca3af' }}>
                  {log.type !== 'INFO' && (
                    <span className="font-bold mr-1">[{log.type}]</span>
                  )}
                  {log.text}
                </span>
              </div>
            ))}
            <div ref={logEndRef}/>
          </div>

          {/* Command input */}
          <form onSubmit={handleCommand} className="flex items-center gap-2 px-4 py-3 border-t flex-shrink-0"
            style={{ borderColor: 'rgba(0,255,255,0.08)', background: '#0a0d10' }}>
            <span className="text-cyan-400 text-sm tracking-wider flex-shrink-0">FACULTY@NEURAL_LINK:~$</span>
            <input
              type="text"
              value={command}
              onChange={e => setCommand(e.target.value)}
              className="flex-1 bg-transparent text-gray-300 text-sm tracking-wider focus:outline-none"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
              autoFocus
            />
            <div className="w-2 h-4 bg-cyan-400" style={{ animation: 'blink 1s step-end infinite' }}/>
          </form>
        </div>
      </div>

      {/* ── RIGHT: Panels ── */}
      <div className="w-64 flex-shrink-0 border-l flex flex-col gap-4 p-4 overflow-y-auto"
        style={{ borderColor: 'rgba(0,255,255,0.1)', background: '#0a0d10' }}>

        {/* Telemetry Feed */}
        <div className="border p-4" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          <div className="text-cyan-400/80 text-xs tracking-widest mb-3">[ TELEMETRY_FEED ]</div>
          <div className="flex items-end gap-1 h-28">
            {TELEMETRY.map((val, i) => {
              const isHighest = val === maxTel;
              return (
                <div key={i} className="flex-1 rounded-sm"
                  style={{
                    height: `${(val / maxTel) * 100}%`,
                    background: isHighest ? '#00ffff' : '#1e3a4a',
                    boxShadow: isHighest ? '0 0 8px rgba(0,255,255,0.6)' : 'none',
                    minHeight: '4px',
                  }}/>
              );
            })}
          </div>
          <div className="flex justify-between mt-3">
            <div>
              <div className="text-gray-600 text-xs tracking-widest">MAX_LATENCY</div>
              <div className="text-white text-sm font-bold">{latency}ms</div>
            </div>
            <div className="text-right">
              <div className="text-gray-600 text-xs tracking-widest">PACKET_LOSS</div>
              <div className="text-red-400 text-sm font-bold">0.02%</div>
            </div>
          </div>
        </div>

        {/* Auth Level */}
        <div className="border p-4" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          <div className="text-cyan-400/80 text-xs tracking-widest mb-3">[ AUTH_LEVEL ]</div>
          <div className="space-y-2 text-xs">
            {[
              { label: 'USER_ID:', value: user?.email || 'F_772_OMNI', color: '#e5e7eb' },
              { label: 'CLEARANCE:', value: user ? 'LEVEL_4_ADMIN' : 'LEVEL_9', color: '#00ffff' },
              { label: 'PROTOCOL:', value: user ? 'FACULTY_AUTH' : 'OMNIPOTENT_BYPASS', color: '#e5e7eb' },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-gray-600 tracking-wider">{row.label}</span>
                <span className="tracking-wider" style={{ color: row.color, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }} title={row.value}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Module Status */}
        <div className="border p-4" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
          <div className="text-cyan-400/80 text-xs tracking-widest mb-3">[ MODULE_STATUS ]</div>
          <div className="space-y-2">
            {[
              { name: 'CORE_LINK',      color: '#00ffff' },
              { name: 'SYNC_ENGINE',    color: '#00ffff' },
              { name: 'LEGACY_IO_PANEL',color: '#ef4444' },
            ].map(mod => (
              <div key={mod.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0 status-dot" style={{ background: mod.color, boxShadow: `0 0 4px ${mod.color}` }}/>
                <span className="text-gray-400 text-xs tracking-wider">{mod.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
