import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isChallenging, setIsChallenging] = useState(false);
  const [challengeError, setChallengeError] = useState('');
  const demoRoomId = Math.random().toString(36).substring(7);

  const handleSparringChallenge = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsChallenging(true);
    setChallengeError('');
    try {
      const res = await api.post('/api/sparring/create', {
        userId: user.id,
        username: user.user_metadata?.username
      });
      navigate(`/sparring/${res.data.roomId}?questionId=${res.data.questionId}`);
    } catch (error) {
      console.error('Failed to create sparring room', error);
      setChallengeError('Failed to start challenge. Please try again.');
    } finally {
      setIsChallenging(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-6 text-center tracking-tight">
        Welcome to Smart Leetcode
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl text-center mb-8">
        A highly gamified, free competitive programming platform. Master algorithms, challenge friends, and build your ultimate coding streak.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <Link 
          to="/problems"
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105"
        >
          Start Coding
        </Link>
        <Link 
          to={`/interview/${demoRoomId}`}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105"
        >
          Mock Interview
        </Link>
        <button
          type="button"
          onClick={handleSparringChallenge}
          disabled={isChallenging}
          className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105"
        >
          {isChallenging ? 'Creating Match...' : 'Challenge to Sparring'}
        </button>
      </div>
      {challengeError && <p role="alert" className="mt-4 text-red-400">{challengeError}</p>}
    </div>
  );
};

export default Home;
