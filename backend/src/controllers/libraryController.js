const intervals = [1, 3, 7, 14, 30, 60, 120];
const fields = 'id,source,question_id,external_url,title,difficulty,topic,folder_id,solved_external,approach,edge_cases,solution_code,language,time_complexity,space_complexity,review_step,next_review_at,last_reviewed_at,created_at';
const difficultySet = new Set(['Easy', 'Medium', 'Hard', 'Unknown']);
const sources = new Set(['smartleetcode', 'leetcode', 'gfg', 'other']);
const fail = (res, error) => res.status(500).json({ error: error.message || 'Library request failed' });
const clean = (value, max = 10000) => String(value ?? '').trim().slice(0, max);

function classifyUrl(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    url.hash = '';
    const host = url.hostname.toLowerCase();
    const source = /(^|\.)leetcode\.com$/.test(host) ? 'leetcode'
      : /(^|\.)geeksforgeeks\.org$/.test(host) ? 'gfg' : 'other';
    return { url: url.toString(), source };
  } catch { return null; }
}

function titleFromUrl(url) {
  const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || new URL(url).hostname;
  return decodeURIComponent(slug).replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 255);
}

function nextDate(step) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + intervals[Math.min(step, intervals.length - 1)]);
  return date.toISOString();
}

async function ownerFolder(supabase, userId, folderId) {
  if (!folderId) return true;
  const { data } = await supabase.from('library_folders').select('id').eq('id', folderId).eq('user_id', userId).maybeSingle();
  return Boolean(data);
}

exports.metadata = async (req, res) => {
  const parsed = classifyUrl(req.query.url);
  if (!parsed) return res.status(400).json({ error: 'Enter a valid http(s) problem URL' });
  let title = titleFromUrl(parsed.url);
  let difficulty = 'Unknown';
  // Only fetch known public problem pages. Other sites are entered manually.
  if (parsed.source !== 'other') {
    try {
      const response = await fetch(parsed.url, { signal: AbortSignal.timeout(5000), redirect: 'manual', headers: { 'User-Agent': 'SmartLeetcode/1.0' } });
      if (response.ok) {
        const html = (await response.text()).slice(0, 250000);
        const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);
        const page = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = clean((og?.[1] || page?.[1] || title).replace(/\s*[-|].*$/, ''), 255) || title;
        // Site markup changes often, so difficulty remains an editable suggestion.
        const match = html.match(/(?:difficulty|questionDifficulty)["':\s>]{1,30}(Easy|Medium|Hard)\b/i);
        if (match) difficulty = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
      }
    } catch { /* URL-derived title remains available for review. */ }
  }
  res.json({ ...parsed, title, difficulty });
};

exports.questions = async (req, res) => {
  const supabase = req.db;
  const { data, error } = await supabase.from('questions').select('id,title,difficulty').order('title');
  if (error) return fail(res, error);
  res.json(data || []);
};

exports.folders = async (req, res) => {
  const supabase = req.db;
  const { data, error } = await supabase.from('library_folders').select('id,name').eq('user_id', req.user.id).order('name');
  if (error) return fail(res, error);
  res.json(data || []);
};

exports.createFolder = async (req, res) => {
  const supabase = req.db;
  const name = clean(req.body.name, 80);
  if (!name) return res.status(400).json({ error: 'Folder name is required' });
  const { data, error } = await supabase.from('library_folders').insert({ user_id: req.user.id, name }).select('id,name').single();
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Folder already exists' : error.message });
  res.status(201).json(data);
};

exports.deleteFolder = async (req, res) => {
  const supabase = req.db;
  const { error } = await supabase.from('library_folders').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return fail(res, error);
  res.status(204).end();
};

exports.items = async (req, res) => {
  const supabase = req.db;
  const { data, error } = await supabase.from('library_items').select(fields).eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return fail(res, error);
  res.json(data || []);
};

exports.summary = async (req, res) => {
  const supabase = req.db;
  const { data: items, error } = await supabase.from('library_items').select('id,source,solved_external,next_review_at,title,question_id,external_url,review_step').eq('user_id', req.user.id);
  if (error) return fail(res, error);
  const { data: solves, error: solvesError } = await supabase.from('submissions').select('question_id').eq('user_id', req.user.id).eq('status', 'Accepted');
  if (solvesError) return fail(res, solvesError);
  const verified = new Set((solves || []).map(s => s.question_id));
  const offset = Math.max(-840, Math.min(840, Number(req.query.tzOffset) || 0));
  const localDay = value => new Date(new Date(value).getTime() - offset * 60000).toISOString().slice(0, 10);
  const today = localDay(new Date());
  const upcoming = [], dueToday = [], overdue = [];
  for (const item of items || []) {
    if (!item.next_review_at) continue;
    const date = localDay(item.next_review_at);
    (date < today ? overdue : date === today ? dueToday : upcoming).push(item);
  }
  res.json({ verifiedSolves: verified.size, verifiedQuestionIds: [...verified], externalLoggedSolves: (items || []).filter(i => i.source !== 'smartleetcode' && i.solved_external).length, dueToday, upcoming, overdue });
};

exports.saveItem = async (req, res) => {
  const supabase = req.db;
  const body = req.body || {};
  if (!sources.has(body.source)) return res.status(400).json({ error: 'Choose a source' });
  if (!(await ownerFolder(supabase, req.user.id, body.folder_id))) return res.status(400).json({ error: 'Invalid folder' });
  let question = null, external = null;
  if (body.source === 'smartleetcode') {
    const result = await supabase.from('questions').select('id,title,difficulty').eq('id', body.question_id).maybeSingle();
    if (result.error || !result.data) return res.status(400).json({ error: 'Select a Smart Leetcode problem' });
    question = result.data;
  } else {
    external = classifyUrl(body.external_url);
    if (!external || external.source !== body.source) return res.status(400).json({ error: 'URL does not match the selected source' });
  }
  const title = question?.title || clean(body.title, 255);
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const difficulty = question?.difficulty || (difficultySet.has(body.difficulty) ? body.difficulty : 'Unknown');
  const row = {
    user_id: req.user.id, source: body.source, question_id: question?.id || null, external_url: external?.url || null,
    title, difficulty, topic: clean(body.topic, 80) || null, folder_id: body.folder_id || null,
    solved_external: body.source === 'smartleetcode' ? false : body.solved_external === true,
    approach: clean(body.approach), edge_cases: clean(body.edge_cases), solution_code: clean(body.solution_code, 50000),
    language: clean(body.language, 50) || null, time_complexity: clean(body.time_complexity, 80) || null,
    space_complexity: clean(body.space_complexity, 80) || null,
    next_review_at: body.schedule_review ? nextDate(0) : null
  };
  const { data, error } = await supabase.from('library_items').insert(row).select(fields).single();
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Already in your library. Open it to update your notes.' : error.message });
  res.status(201).json(data);
};

exports.updateItem = async (req, res) => {
  const supabase = req.db;
  const body = req.body || {};
  const { data: existing } = await supabase.from('library_items').select('id,source').eq('id', req.params.id).eq('user_id', req.user.id).maybeSingle();
  if (!existing) return res.status(404).json({ error: 'Library item not found' });
  if ('folder_id' in body && !(await ownerFolder(supabase, req.user.id, body.folder_id))) return res.status(400).json({ error: 'Invalid folder' });
  const changes = { updated_at: new Date().toISOString() };
  for (const [key, max] of Object.entries({ topic: 80, approach: 10000, edge_cases: 10000, solution_code: 50000, language: 50, time_complexity: 80, space_complexity: 80 })) {
    if (key in body) changes[key] = clean(body[key], max) || null;
  }
  if ('folder_id' in body) changes.folder_id = body.folder_id || null;
  if (existing.source !== 'smartleetcode') {
    if ('title' in body) changes.title = clean(body.title, 255);
    if (!changes.title && 'title' in changes) return res.status(400).json({ error: 'Title is required' });
    if ('difficulty' in body && difficultySet.has(body.difficulty)) changes.difficulty = body.difficulty;
    if ('solved_external' in body) changes.solved_external = body.solved_external === true;
  }
  if (body.schedule_review === true) changes.next_review_at = nextDate(0);
  if (body.schedule_review === false) changes.next_review_at = null;
  const { data, error } = await supabase.from('library_items').update(changes).eq('id', req.params.id).eq('user_id', req.user.id).select(fields).single();
  if (error) return fail(res, error);
  res.json(data);
};

exports.completeReview = async (req, res) => {
  const supabase = req.db;
  const { data: item, error } = await supabase.from('library_items').select('id,review_step,next_review_at').eq('id', req.params.id).eq('user_id', req.user.id).maybeSingle();
  if (error) return fail(res, error);
  if (!item) return res.status(404).json({ error: 'Library item not found' });
  if (!item.next_review_at) return res.status(400).json({ error: 'Schedule this item for review first' });
  const step = item.review_step + 1;
  const { data, error: updateError } = await supabase.from('library_items').update({ review_step: step, last_reviewed_at: new Date().toISOString(), next_review_at: nextDate(step), updated_at: new Date().toISOString() }).eq('id', item.id).eq('user_id', req.user.id).select(fields).single();
  if (updateError) return fail(res, updateError);
  res.json(data);
};

exports.deleteItem = async (req, res) => {
  const supabase = req.db;
  const { error } = await supabase.from('library_items').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return fail(res, error);
  res.status(204).end();
};
