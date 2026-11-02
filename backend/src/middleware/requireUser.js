const supabase = require('../config/supabaseClient');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function requireUser(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Sign in required' });
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid session' });
    req.user = data.user;
    req.db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
};
