const pusher = require('../config/pusher');
const supabase = require('../config/supabaseClient');
const crypto = require('crypto');

exports.createRoom = async (req, res) => {
  try {
    const { userId, username } = req.body;
    
    // Generate unique room ID
    const roomId = crypto.randomBytes(4).toString('hex');
    
    // Pick a random 'Medium' question for the match
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id')
      .eq('difficulty', 'Medium');
      
    if (error || !questions || questions.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch questions pool' });
    }
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    // Trigger global event (optional, can be used for global lobby)
    await pusher.trigger('global-lobby', 'room-created', {
      roomId,
      hostId: userId,
      hostName: username,
      questionId: randomQuestion.id
    });
    
    res.status(200).json({ 
      roomId,
      questionId: randomQuestion.id,
      message: 'Room created successfully. Share the roomId to invite opponent.'
    });
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: 'Server error creating room' });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomId, userId, username } = req.body;
    
    if (!roomId || !userId) {
      return res.status(400).json({ error: 'Missing roomId or userId' });
    }
    
    // Notify host that player 2 joined
    await pusher.trigger(`room-${roomId}`, 'player-joined', {
      userId,
      username,
      message: `${username} has joined the match!`
    });
    
    res.status(200).json({ message: 'Successfully joined room' });
  } catch (err) {
    console.error('Error joining room:', err);
    res.status(500).json({ error: 'Server error joining room' });
  }
};

exports.syncCode = async (req, res) => {
  try {
    const { roomId, userId, sourceCode } = req.body;
    
    if (!roomId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Broadcast the code update to everyone else in the room
    await pusher.trigger(`room-${roomId}`, 'code-update', {
      userId,
      sourceCode
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error syncing code:', err);
    res.status(500).json({ error: 'Server error syncing code' });
  }
};

exports.submitSync = async (req, res) => {
  try {
    const { roomId, userId, status, message } = req.body;
    
    if (!roomId || !userId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Sync submission status to opponent
    await pusher.trigger(`room-${roomId}`, 'submission-status', {
      userId,
      status,
      message
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error syncing submission:', err);
    res.status(500).json({ error: 'Server error syncing submission' });
  }
};
