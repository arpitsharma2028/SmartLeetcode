import { useEffect } from 'react';

const sourceNames = {
  smartleetcode: 'Smart Leetcode',
  leetcode: 'LeetCode',
  gfg: 'GeeksforGeeks',
  other: 'Other platform'
};

function NoteSection({ title, value, emptyText }) {
  return <section className="theme-subpanel p-4">
    <h3 className="theme-eyebrow mb-2 !text-[#f5ad38]">{title}</h3>
    <p className="whitespace-pre-wrap break-words leading-7 text-gray-200">{value?.trim() || <span className="italic text-gray-500">{emptyText}</span>}</p>
  </section>;
}

export default function LibraryNotesDialog({ item, folderName, onClose }) {
  useEffect(() => {
    const closeOnEscape = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="library-notes-title" className="theme-panel flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden shadow-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-gray-700 p-5 sm:p-6">
        <div>
          <p className="theme-eyebrow mb-1 !text-[#f5ad38]">Saved notes</p>
          <h2 id="library-notes-title" className="text-2xl font-bold text-white">{item.title}</h2>
          <p className="mt-2 text-sm text-gray-400">{sourceNames[item.source]} · {item.difficulty} · {folderName}</p>
        </div>
        <button type="button" autoFocus onClick={onClose} aria-label="Close notes" className="rounded-lg px-2 py-1 text-xl text-gray-300 hover:bg-gray-700 hover:text-white">×</button>
      </header>

      <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
        <NoteSection title="Approach / what I learned" value={item.approach} emptyText="No approach saved yet." />
        <NoteSection title="Edge cases" value={item.edge_cases} emptyText="No edge cases saved yet." />
        <section className="grid gap-3 sm:grid-cols-2" aria-label="Complexity notes">
          <div className="theme-subpanel p-4"><h3 className="theme-eyebrow mb-2 !text-[#f5ad38]">Time complexity</h3><p className="font-mono text-gray-200">{item.time_complexity || 'Not added'}</p></div>
          <div className="theme-subpanel p-4"><h3 className="theme-eyebrow mb-2 !text-[#f5ad38]">Space complexity</h3><p className="font-mono text-gray-200">{item.space_complexity || 'Not added'}</p></div>
        </section>
        <section className="theme-subpanel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="theme-eyebrow !text-[#f5ad38]">Saved solution</h3>{item.language && <span className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">{item.language}</span>}</div>
          {item.solution_code?.trim() ? <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[#0e0f11] p-4 font-mono text-sm leading-6 text-gray-200"><code>{item.solution_code}</code></pre> : <p className="italic text-gray-500">No solution code saved yet.</p>}
        </section>
      </div>

      <footer className="flex justify-end gap-3 border-t border-gray-700 p-4 sm:px-6">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-600 px-4 py-2 font-semibold text-gray-200 hover:bg-gray-700">Close</button>
      </footer>
    </div>
  </div>;
}
