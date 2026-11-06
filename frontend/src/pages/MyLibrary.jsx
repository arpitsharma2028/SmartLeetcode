import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import LibraryNotesDialog from '../components/LibraryNotesDialog';

const empty = { source: 'leetcode', external_url: '', question_id: '', title: '', difficulty: 'Unknown', topic: '', folder_id: '', solved_external: false, approach: '', edge_cases: '', solution_code: '', language: '', time_complexity: '', space_complexity: '', schedule_review: true };
const input = 'w-full rounded-lg border border-[#383c42] bg-[#111316] px-3 py-2 text-[#e9e9e8] focus:border-[#f5ad38] focus:outline-none';
const label = 'block text-sm font-medium text-gray-300 mb-1';
const sourceName = { smartleetcode: 'Smart Leetcode', leetcode: 'LeetCode', gfg: 'GeeksforGeeks', other: 'Other platform' };
const defaultFolders = ['Graph', 'DP', 'Stacks', 'Array', 'Binary Search', 'Revision'];

function FolderIcon({ muted = false }) {
  return <svg aria-hidden="true" viewBox="0 0 48 40" className="h-10 w-12 drop-shadow-md">
    <path d="M3 7a4 4 0 0 1 4-4h11l4 5h18a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7Z" fill={muted ? '#555a61' : '#b9781e'} />
    <path d="M3 16a4 4 0 0 1 4-4h33a4 4 0 0 1 4 4v17a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V16Z" fill={muted ? '#777c84' : '#f5ad38'} />
  </svg>;
}

async function ensureDefaultFolders(existingFolders) {
  const existingNames = new Set(existingFolders.map(folder => folder.name.trim().toLowerCase()));
  const missing = defaultFolders.filter(name => !existingNames.has(name.toLowerCase()));
  if (missing.length === 0) return existingFolders;

  await Promise.all(missing.map(async name => {
    try {
      await api.post('/api/library/folders', { name });
    } catch (error) {
      if (error.response?.status !== 409) throw error;
    }
  }));
  const { data } = await api.get('/api/library/folders');
  return data;
}

export default function MyLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'platforms' ? 'platforms' : 'folders';
  const selectedKey = view === 'folders' ? searchParams.get('folder') : searchParams.get('source');
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [verifiedIds, setVerifiedIds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [notesItem, setNotesItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [itemsRes, foldersRes, questionsRes, summaryRes] = await Promise.all([
        api.get('/api/library/items'),
        api.get('/api/library/folders'),
        api.get('/api/library/questions'),
        api.get('/api/library/summary', { params: { tzOffset: new Date().getTimezoneOffset() } })
      ]);
      const readyFolders = await ensureDefaultFolders(foldersRes.data);
      setItems(itemsRes.data);
      setFolders(readyFolders);
      setQuestions(questionsRes.data);
      setVerifiedIds(summaryRes.data.verifiedQuestionIds);
      setSummary(summaryRes.data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load your library. Check the Supabase library migration.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const selectedFolder = folders.find(folder => folder.id === selectedKey);
  const selectedLabel = view === 'folders'
    ? selectedKey === 'unfiled' ? 'Unfiled' : selectedFolder?.name
    : sourceName[selectedKey];
  const visible = useMemo(() => {
    if (!selectedLabel) return [];
    return items.filter(item => {
      const inCategory = view === 'folders'
        ? selectedKey === 'unfiled' ? !item.folder_id : item.folder_id === selectedKey
        : item.source === selectedKey;
      return inCategory && `${item.title} ${item.topic || ''}`.toLowerCase().includes(search.trim().toLowerCase());
    });
  }, [items, view, selectedKey, selectedLabel, search]);
  const set = (key, value) => setForm(previous => ({ ...previous, [key]: value }));

  const chooseView = nextView => {
    setSearch('');
    setSearchParams({ view: nextView });
  };
  const openCategory = (key, categoryView = view) => {
    setSearch('');
    setSearchParams(categoryView === 'folders' ? { view: 'folders', folder: key } : { view: 'platforms', source: key });
  };
  const startAdd = () => {
    setEditing(null);
    setForm({ ...empty, folder_id: view === 'folders' && selectedFolder ? selectedFolder.id : '', source: view === 'platforms' && selectedLabel ? selectedKey : 'leetcode' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const detect = async () => {
    if (!form.external_url.trim()) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.get('/api/library/metadata', { params: { url: form.external_url } });
      setForm(previous => ({ ...previous, source: data.source, external_url: data.url, title: data.title, difficulty: data.difficulty }));
      setNotice('Please review the suggested title and difficulty before saving.');
    } catch (e) { setError(e.response?.data?.error || 'Could not inspect this URL'); }
    finally { setBusy(false); }
  };

  const save = async event => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (editing) {
        const payload = { ...form };
        if (payload.schedule_review && items.find(item => item.id === editing)?.next_review_at) delete payload.schedule_review;
        await api.patch(`/api/library/items/${editing}`, payload);
      } else {
        await api.post('/api/library/items', form);
      }
      setEditing(null); setForm(empty); setShowForm(false);
      await load();
      setNotice('Saved to My Library.');
    } catch (e) { setError(e.response?.data?.error || 'Could not save this problem'); }
    finally { setBusy(false); }
  };

  const startEdit = item => {
    setNotesItem(null);
    setEditing(item.id);
    setForm({ ...item, folder_id: item.folder_id || '', schedule_review: Boolean(item.next_review_at) });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const createFolder = async event => {
    event.preventDefault(); setError('');
    try {
      const { data } = await api.post('/api/library/folders', { name: folderName });
      setFolders(previous => [...previous, data].sort((a, b) => a.name.localeCompare(b.name)));
      setFolderName(''); setShowFolderForm(false); setNotice('Folder created.');
    } catch (e) { setError(e.response?.data?.error || 'Could not create folder'); }
  };
  const review = async item => {
    try { await api.post(`/api/library/items/${item.id}/review`); await load(); setNotice(`Review complete: ${item.title}. Next review scheduled.`); }
    catch (e) { setError(e.response?.data?.error || 'Could not complete review'); }
  };
  const remove = async item => {
    if (!window.confirm(`Remove “${item.title}” from your library?`)) return;
    try { await api.delete(`/api/library/items/${item.id}`); await load(); setNotice('Removed from library.'); }
    catch (e) { setError(e.response?.data?.error || 'Could not remove item'); }
  };

  const selectedQuestion = questions.find(question => question.id === form.question_id);
  const isExternal = form.source !== 'smartleetcode';
  const unfiledCount = items.filter(item => !item.folder_id).length;
  const difficultyCounts = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0, Unknown: 0 };
    const verified = new Set(verifiedIds);
    for (const question of questions) if (verified.has(question.id)) counts[question.difficulty] = (counts[question.difficulty] || 0) + 1;
    for (const item of items) if (item.source !== 'smartleetcode' && item.solved_external) counts[item.difficulty] = (counts[item.difficulty] || 0) + 1;
    return counts;
  }, [items, questions, verifiedIds]);
  const statCards = [
    { label: 'Total Solved', value: summary ? summary.verifiedSolves + summary.externalLoggedSolves : '—', detail: summary ? `${summary.verifiedSolves} verified · ${summary.externalLoggedSolves} external` : 'Verified + logged external', color: 'text-blue-300' },
    { label: 'Easy', value: loading ? '—' : difficultyCounts.Easy, detail: 'Solved problems', color: 'text-green-400' },
    { label: 'Medium', value: loading ? '—' : difficultyCounts.Medium, detail: 'Solved problems', color: 'text-yellow-400' },
    { label: 'Hard', value: loading ? '—' : difficultyCounts.Hard, detail: 'Solved problems', color: 'text-red-400' },
    { label: 'Revisit Pending', value: summary ? summary.overdue.length + summary.dueToday.length : '—', detail: summary ? `${summary.upcoming.length} upcoming` : 'Due or overdue', color: 'text-purple-300' }
  ];

  return <div className="mx-auto max-w-[1440px] px-5 py-10 text-[#e9e9e8] sm:px-8 lg:px-12 lg:py-12">
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><p className="theme-eyebrow mb-2">Your practice space</p><h1 className="text-4xl font-bold tracking-tight text-[#eeece8]">My Library</h1><p className="mt-2 text-gray-400">Choose a folder or platform to view its problems.</p></div>
      <div className="flex items-center gap-3"><span className="rounded-lg border border-[#3b301e] bg-[#2b2114] px-4 py-2 text-sm text-[#f5ad38]">{items.length} saved problems</span><button type="button" onClick={() => showForm ? setShowForm(false) : startAdd()} className="theme-button-primary !py-2">{showForm ? 'Close form' : 'Add problem'}</button></div>
    </header>

    {error && <p role="alert" className="mb-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-red-300">{error}</p>}
    {notice && <p role="status" className="mb-4 rounded-lg border border-green-800 bg-green-950/40 p-3 text-green-300">{notice}</p>}

    <section aria-label="Library progress" className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {statCards.map(stat => <div key={stat.label} className="theme-panel p-4 sm:p-5"><p className={`theme-eyebrow ${stat.color}`}>{stat.label}</p><p className="mt-3 font-mono text-3xl font-semibold text-[#eeece8]">{stat.value}</p><p className="mt-1 text-xs text-gray-400">{stat.detail}</p></div>)}
    </section>
    {!loading && difficultyCounts.Unknown > 0 && <p className="-mt-5 mb-7 text-xs text-gray-400">{difficultyCounts.Unknown} solved {difficultyCounts.Unknown === 1 ? 'problem has' : 'problems have'} unknown difficulty.</p>}

    {showForm && <form onSubmit={save} className="theme-panel mb-8 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-white">{editing ? 'Edit saved problem' : 'Add a problem'}</h2><button type="button" onClick={() => { setEditing(null); setForm(empty); setShowForm(false); }} className="text-sm text-blue-300">Cancel</button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label} htmlFor="source">Source</label><select id="source" className={input} value={form.source} disabled={Boolean(editing)} onChange={e => setForm({ ...empty, source: e.target.value, folder_id: form.folder_id })}>{Object.entries(sourceName).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></div>
        {isExternal ? <div><label className={label} htmlFor="url">Problem URL</label><div className="flex gap-2"><input id="url" required type="url" className={input} value={form.external_url || ''} readOnly={Boolean(editing)} onChange={e => set('external_url', e.target.value)} placeholder="https://..." />{!editing && <button type="button" onClick={detect} disabled={busy} className="rounded-lg bg-blue-600 px-3 text-sm font-semibold hover:bg-blue-500">Detect</button>}</div></div> : <div><label className={label} htmlFor="internal">Smart Leetcode problem</label><select id="internal" required disabled={Boolean(editing)} className={input} value={form.question_id || ''} onChange={e => set('question_id', e.target.value)}><option value="">Choose a problem</option>{questions.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}</select></div>}
        <div><label className={label} htmlFor="title">Title</label><input id="title" required={isExternal} disabled={!isExternal || Boolean(editing)} className={input} value={isExternal ? form.title || '' : selectedQuestion?.title || form.title || ''} onChange={e => set('title', e.target.value)} /></div>
        <div><label className={label} htmlFor="difficulty">Difficulty</label><select id="difficulty" disabled={!isExternal || Boolean(editing)} className={input} value={isExternal ? form.difficulty : selectedQuestion?.difficulty || form.difficulty} onChange={e => set('difficulty', e.target.value)}>{['Unknown', 'Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}</select></div>
        <div><label className={label} htmlFor="topic">Topic</label><input id="topic" className={input} value={form.topic || ''} onChange={e => set('topic', e.target.value)} placeholder="Arrays, DP, graphs..." /></div>
        <div><label className={label} htmlFor="folder">Folder</label><select id="folder" className={input} value={form.folder_id || ''} onChange={e => set('folder_id', e.target.value)}><option value="">No folder</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.schedule_review)} onChange={e => set('schedule_review', e.target.checked)} /> Schedule reviews</label>{isExternal && <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.solved_external)} onChange={e => set('solved_external', e.target.checked)} /> I solved this on its source site (self reported)</label>}</div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={label} htmlFor="approach">Approach / what I learned</label><textarea id="approach" rows="3" className={input} value={form.approach || ''} onChange={e => set('approach', e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={label} htmlFor="edges">Edge cases</label><textarea id="edges" rows="2" className={input} value={form.edge_cases || ''} onChange={e => set('edge_cases', e.target.value)} /></div>
        <div><label className={label} htmlFor="time">My time complexity</label><input id="time" className={input} value={form.time_complexity || ''} onChange={e => set('time_complexity', e.target.value)} placeholder="O(n log n)" /></div>
        <div><label className={label} htmlFor="space">My space complexity</label><input id="space" className={input} value={form.space_complexity || ''} onChange={e => set('space_complexity', e.target.value)} placeholder="O(n)" /></div>
        <div className="sm:col-span-2"><label className={label} htmlFor="language">Solution language</label><input id="language" className={input} value={form.language || ''} onChange={e => set('language', e.target.value)} placeholder="Python, C++, JavaScript..." /></div>
        <div className="sm:col-span-2"><label className={label} htmlFor="code">Saved solution / code</label><textarea id="code" rows="6" className={`${input} font-mono text-sm`} value={form.solution_code || ''} onChange={e => set('solution_code', e.target.value)} /></div>
      </div>
      <button disabled={busy} className="mt-5 rounded-lg bg-green-600 px-5 py-2 font-semibold hover:bg-green-500 disabled:opacity-50">{busy ? 'Saving...' : editing ? 'Save changes' : 'Add to My Library'}</button>
    </form>}

    <section aria-label="Browse saved problems" className="theme-panel p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-white">Your library</h2><p className="mt-1 text-sm text-gray-400">Browse problems by folder or by platform.</p></div>
        <div className="flex rounded-lg border border-[#35393f] bg-[#101215] p-1" role="group" aria-label="Categorize library">
          <button type="button" aria-pressed={view === 'folders'} onClick={() => chooseView('folders')} className={`rounded-md px-4 py-2 text-sm font-semibold ${view === 'folders' ? 'bg-[#f5ad38] text-[#18140d]' : 'text-gray-300 hover:text-white'}`}>By folder</button>
          <button type="button" aria-pressed={view === 'platforms'} onClick={() => chooseView('platforms')} className={`rounded-md px-4 py-2 text-sm font-semibold ${view === 'platforms' ? 'bg-[#f5ad38] text-[#18140d]' : 'text-gray-300 hover:text-white'}`}>By platform</button>
        </div>
      </div>

      {loading ? <p className="text-gray-400">Loading library...</p> : selectedLabel ? <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><button type="button" onClick={() => chooseView(view)} className="mb-2 text-sm font-semibold text-blue-300 hover:text-blue-200">← Back to {view === 'folders' ? 'folders' : 'platforms'}</button><h3 className="text-2xl font-bold text-white">{selectedLabel}</h3><p className="text-sm text-gray-400">{visible.length} {visible.length === 1 ? 'problem' : 'problems'} in this view</p></div>
          <input aria-label={`Search ${selectedLabel}`} className={`${input} w-full sm:w-64`} placeholder="Search in this view" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {visible.length === 0 ? <p className="rounded-lg border border-gray-700 bg-gray-900 p-6 text-gray-400">No problems in this {view === 'folders' ? 'folder' : 'platform'} match your search.</p> : <div className="grid gap-4 md:grid-cols-2">{visible.map(item => <article key={item.id} className="rounded-xl border border-gray-700 bg-gray-800 p-5"><div className="flex items-start justify-between gap-3"><div><h4 className="text-lg font-bold text-white">{item.title}</h4><p className="mt-1 text-sm text-gray-400">{sourceName[item.source]} · {item.difficulty} · {item.topic || 'No topic'}</p></div><span className={`rounded-full px-2 py-1 text-xs ${item.source === 'smartleetcode' ? 'bg-blue-950 text-blue-300' : item.solved_external ? 'bg-green-950 text-green-300' : 'bg-gray-700 text-gray-300'}`}>{item.source === 'smartleetcode' ? verifiedIds.includes(item.question_id) ? 'Verified solved' : 'Not solved' : item.solved_external ? 'Self reported solved' : 'Not logged solved'}</span></div><p className="mt-2 text-xs text-gray-400">Folder: {folders.find(f => f.id === item.folder_id)?.name || 'None'} {item.next_review_at && `· Next review: ${new Date(item.next_review_at).toLocaleDateString()}`}</p>{item.approach && <p className="mt-3 line-clamp-2 text-sm text-gray-300">{item.approach}</p>}<div className="mt-4 flex flex-wrap gap-2 text-sm">{item.source === 'smartleetcode' ? <Link to={`/problem/${item.question_id}`} className="rounded-lg bg-blue-600 px-3 py-2 font-semibold hover:bg-blue-500">Open editor</Link> : <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-600 px-3 py-2 font-semibold hover:bg-blue-500">Open source site</a>}<button type="button" onClick={() => setNotesItem(item)} className="rounded-lg border border-gray-600 px-3 py-2 hover:border-blue-400">Notes</button><button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-gray-600 px-3 py-2 hover:border-blue-400">Edit</button>{item.next_review_at && <button type="button" onClick={() => review(item)} className="rounded-lg border border-green-700 px-3 py-2 text-green-300 hover:bg-green-950">Review done</button>}<button type="button" onClick={() => remove(item)} className="rounded-lg px-3 py-2 text-red-300 hover:bg-red-950">Remove</button></div></article>)}</div>}
      </> : view === 'folders' ? <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold text-white">Your folders</h3><p className="text-sm text-gray-400">Open a folder to see its saved problems.</p></div><button type="button" onClick={() => setShowFolderForm(previous => !previous)} className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600">{showFolderForm ? 'Cancel' : '+ Add folder'}</button></div>
        {showFolderForm && <form onSubmit={createFolder} className="mb-5 flex max-w-md gap-2"><input aria-label="New folder name" className={input} value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="New custom folder" maxLength="80" required /><button className="rounded-lg bg-blue-600 px-4 font-semibold hover:bg-blue-500">Create</button></form>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{folders.map(folder => { const count = items.filter(item => item.folder_id === folder.id).length; return <button type="button" key={folder.id} onClick={() => openCategory(folder.id)} className="group min-h-40 rounded-xl border border-gray-700 bg-gray-800 p-5 text-left shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:bg-gray-700"><FolderIcon /><span className="mt-4 block text-lg font-bold text-white group-hover:text-blue-200">{folder.name}</span><span className="mt-1 block text-sm text-gray-400">{count} {count === 1 ? 'problem' : 'problems'}</span></button>; })}<button type="button" onClick={() => openCategory('unfiled')} className="group min-h-40 rounded-xl border border-dashed border-gray-600 bg-gray-900/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-400"><FolderIcon muted /><span className="mt-4 block text-lg font-bold text-white group-hover:text-blue-200">Unfiled</span><span className="mt-1 block text-sm text-gray-400">{unfiledCount} {unfiledCount === 1 ? 'problem' : 'problems'}</span></button></div>
      </> : <><h3 className="mb-5 text-xl font-bold text-white">Platforms</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(sourceName).map(([key, name]) => { const count = items.filter(item => item.source === key).length; return <button type="button" key={key} onClick={() => openCategory(key, 'platforms')} className="rounded-xl border border-gray-600 bg-gray-800 p-5 text-left transition-colors hover:border-blue-400 hover:bg-gray-700"><span className="mb-3 block text-2xl text-blue-300" aria-hidden="true">◆</span><span className="block text-lg font-bold text-white">{name}</span><span className="mt-1 block text-sm text-gray-400">{count} {count === 1 ? 'problem' : 'problems'}</span></button>; })}</div></>}
    </section>
    {notesItem && <LibraryNotesDialog
      item={notesItem}
      folderName={folders.find(folder => folder.id === notesItem.folder_id)?.name || 'Unfiled'}
      onClose={() => setNotesItem(null)}
    />}
  </div>;
}
