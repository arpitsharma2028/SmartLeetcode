const supabase = require('../config/supabaseClient');

// Save a new mock interview
exports.saveInterview = async (req, res) => {
  try {
    const { room_id, host_username, guest_username, question_title, status, feedback, rubric } = req.body;

    if (!room_id || !host_username || !guest_username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('mock_interviews')
      .insert([{ room_id, host_username, guest_username, question_title, status, feedback, rubric }])
      .select();

    if (error) {
      console.error('Supabase error inserting interview:', error);
      return res.status(500).json({ error: error.message });
    }

    // Interview results remain in mock_interviews. Competitive points and solved
    // counts are awarded only by an accepted Smart Leetcode code submission.
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Server error saving interview:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get interviews where user is the candidate (guest)
exports.getCandidateInterviews = async (req, res) => {
  try {
    const { username } = req.params;
    const { data, error } = await supabase
      .from('mock_interviews')
      .select('*')
      .eq('guest_username', username)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching candidate interviews:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get interviews where user is the interviewer (host)
exports.getInterviewerInterviews = async (req, res) => {
  try {
    const { username } = req.params;
    const { data, error } = await supabase
      .from('mock_interviews')
      .select('*')
      .eq('host_username', username)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching interviewer interviews:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
