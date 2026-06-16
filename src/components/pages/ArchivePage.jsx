import { useState } from 'react';

const DIR_TREE = [
  {
    name: 'SEMESTERS_HISTORY', expanded: true, children: [
      { name: 'FALL_2022', selected: false },
      { name: 'SPRING_2023', selected: true },
      { name: 'FALL_2023', selected: false },
    ]
  },
  { name: 'THESIS_DUMPS', expanded: false, children: [] },
  { name: 'SYS_LOGS_LEGACY', expanded: false, children: [] },
];

const FILES = [
  { icon: 'restore', name: 'STUDENT_LINK_X0922.ner', sub: 'NEURAL PATTERN ARCHIVE', date: '22.04.2023', size: '842 GB', highlight: false },
  { icon: 'cloud', name: 'GRADE_MATRIX_SP23.xlsb', sub: 'COLD STORAGE WORKBOOK', date: '15.05.2023', size: '12.4 MB', highlight: false },
  { icon: 'refresh', name: 'CORE_PROTOCOLS_V2.dump', sub: 'KERNEL MEMORY SNAPSHOT', date: '11.01.2023', size: '2.1 TB', highlight: true },
  { icon: 'lock', name: 'ETHICS_BOARD_MINUTES_22.pdf', sub: 'ENCRYPTED DOCUMENT', date: '04.12.2022', size: '45 MB', highlight: false },
  { icon: 'file', name: 'LEGACY_ASSET_MANIFEST.json', sub: 'INVENTORY LISTING', date: '30.08.2022', size: '1.2 MB', highlight: false },
];

function FileIcon({ type }) {
  const iconProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#9ca3af', strokeWidth: 1.5 };
  if (type === 'restore') return <svg {...iconProps}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.98" /></svg>;
  if (type === 'cloud') return <svg {...iconProps}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>;
  if (type === 'refresh') return <svg {...iconProps}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>;
  if (type === 'lock') return <svg {...iconProps}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
  return <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
}

function DirNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  return (
    <div>
      <button
        onClick={() => node.children?.length && setExpanded(e => !e)}
        className="flex items-center gap-1.5 w-full hover:text-gray-300 transition-colors py-1 text-xs tracking-wider"
        style={{ paddingLeft: `${depth * 14}px`, color: node.selected ? '#00ffff' : '#6b7280' }}
      >
        {node.children?.length > 0 && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          {node.children?.length > 0
            ? <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            : <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></>}
        </svg>
        <span>{node.name}</span>
      </button>
      {expanded && node.children?.map((child, i) => (
        <DirNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ArchivePage() {
  const [filePage, setFilePage] = useState(1);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'Share Tech Mono', monospace", background: '#090c0f' }}>
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Header */}
        <div className="grid grid-cols-3 gap-5">
          {/* Left: vault info */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-cyan-400" />
              <span className="text-gray-500 text-xs tracking-widest">{'{ ACTIVE_DIRECTORY: /ROOT/COLD_STORAGE }'}</span>
              <div className="flex items-center gap-3 ml-4">
                <span className="px-2 py-0.5 text-xs tracking-widest border border-cyan-400/40 text-cyan-400 bg-cyan-400/08">3.4 PB_TOTAL</span>
                <span className="px-2 py-0.5 text-xs tracking-widest border border-green-500/40 text-green-400 bg-green-500/08">ENCRYPTED</span>
              </div>
            </div>
            <h2 className="text-4xl font-black text-cyan-400 tracking-wider" style={{ fontFamily: "'Orbitron', monospace", textShadow: '0 0 20px rgba(0,255,255,0.3)' }}>
              THE VAULT
            </h2>
            <p className="text-gray-500 text-sm tracking-wide mt-2 leading-relaxed max-w-xl">
              Centralized historical matrix for neural student profiles and legacy epoch
              data. Accessing ghost records requires L3 clearance.
            </p>
          </div>

          {/* Right: Quick Actions */}
          <div className="border p-4" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm tracking-widest font-bold">QUICK_ACTIONS</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="2">
                <path d="M13 2L4.09 12.26a1 1 0 0 0 .78 1.63L12 14l-3.5 8L21 9.74a1 1 0 0 0-.78-1.63L13 8l.5-6z" />
              </svg>
            </div>
            {[
              { label: 'DEEP SCAN VAULT', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg> },
              { label: 'RECOVER_EPOCH_12', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
            ].map(action => (
              <button key={action.label}
                className="w-full flex items-center justify-between px-3 py-2.5 mb-2 text-xs tracking-widest text-gray-300 border hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
                {action.label}
                <span className="text-gray-600">{action.icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content: directory tree + file table */}
        <div className="grid grid-cols-4 gap-4">
          {/* Directory tree */}
          <div className="border p-4" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-gray-500 text-xs tracking-widest">DIRECTORIES</span>
            </div>
            <div className="space-y-0.5">
              {DIR_TREE.map((node, i) => <DirNode key={i} node={node} />)}
            </div>

            {/* Storage quota */}
            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 status-dot" />
                <span className="text-gray-500 text-xs tracking-widest">STORAGE_QUOTA</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-sm overflow-hidden mb-2">
                <div className="h-full rounded-sm" style={{ width: '80%', background: 'linear-gradient(90deg, #00ffff, #a855f7)' }} />
              </div>
              <div className="flex justify-between text-xs text-gray-600 tracking-wider">
                <span>80%_UTILIZED</span>
                <span>1.2 PB FREE</span>
              </div>
            </div>
          </div>

          {/* File table */}
          <div className="col-span-3 border" style={{ background: '#0d1117', borderColor: 'rgba(0,255,255,0.1)' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['STATUS', 'RESOURCE_NAME', 'TIMESTAMP', 'FILE_SIZE', 'ACTIONS'].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs text-gray-600 tracking-widest font-normal">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FILES.map((f, i) => (
                  <tr key={i} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3.5">
                      <FileIcon type={f.icon} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-gray-200 text-sm tracking-wide">{f.name}</div>
                      <div className="text-gray-600 text-xs tracking-wider">{f.sub}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-sm tracking-wider">{f.date}</td>
                    <td className="px-4 py-3.5 text-gray-400 text-sm tracking-wider">{f.size}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1 text-xs tracking-widest transition-all"
                          style={{
                            border: f.highlight ? '1px solid #00ffff' : '1px solid rgba(255,255,255,0.1)',
                            color: f.highlight ? '#00ffff' : '#6b7280',
                            background: f.highlight ? 'rgba(0,255,255,0.08)' : 'transparent',
                          }}>
                          {f.highlight ? 'RESTORE_NOW' : 'RESTORE'}
                        </button>
                        <button className="px-3 py-1 text-xs tracking-widest border border-red-900/40 text-red-700 hover:border-red-500/50 hover:text-red-400 transition-all">
                          PURGE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: 'rgba(0,255,255,0.06)' }}>
              <span className="text-gray-600 text-xs tracking-widest">SHOWING 5 OF 12,482 RECORDS</span>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                {[1, 2, 3].map(p => (
                  <button key={p} onClick={() => setFilePage(p)}
                    className="w-8 h-8 text-xs tracking-widest transition-all"
                    style={{
                      border: '1px solid',
                      borderColor: filePage === p ? '#00ffff' : 'rgba(255,255,255,0.1)',
                      color: filePage === p ? '#00ffff' : '#6b7280',
                      background: filePage === p ? 'rgba(0,255,255,0.08)' : 'transparent',
                    }}>
                    {p}
                  </button>
                ))}
                <button className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-2 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(0,255,255,0.06)', background: '#0a0d10' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400" />
          <span className="text-gray-700 text-xs tracking-widest">SECURITY PROTOCOL: OMEGA-9 ACTIVE</span>
        </div>
        <span className="text-gray-700 text-xs tracking-widest">© 2024 NEURAL_LINK_FACULTY // DEEP_STORAGE_UNIT</span>
      </div>
    </div>
  );
}
