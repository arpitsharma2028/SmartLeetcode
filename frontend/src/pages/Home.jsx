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
    if (!user) { navigate('/login'); return; }
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
    } finally { setIsChallenging(false); }
  };

  return <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pt-24">
    <section className="grid min-h-[430px] items-center gap-12 lg:grid-cols-[1.04fr_1fr] lg:gap-20" aria-labelledby="hero-title">
      <div>
        <p className="theme-eyebrow mb-6">Free competitive programming</p>
        <h1 id="hero-title" className="max-w-[680px] text-[clamp(3rem,5.2vw,5.35rem)] font-bold leading-[1.07] tracking-[-.055em] text-[#eeece8]">Get unstuck without reading the answer.</h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-[#9da0a8]">Write code in the browser, ask the AI mentor for a nudge, then spar or mock-interview with a friend in real time. Hints cost points, so every clean solve means something.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/problems" className="theme-button-primary">Start coding</Link>
          <Link to={`/interview/${demoRoomId}`} className="theme-button-secondary">Mock interview</Link>
          <button type="button" onClick={handleSparringChallenge} disabled={isChallenging} className="theme-button-secondary">{isChallenging ? 'Creating match...' : 'Challenge to sparring'}</button>
        </div>
        {challengeError && <p role="alert" className="mt-4 text-sm text-red-400">{challengeError}</p>}
      </div>

      <div className="theme-panel overflow-hidden shadow-2xl shadow-black/20" aria-label="Preview of a coding problem and mentor hint">
        <div className="flex items-center justify-between border-b border-[#2a2e33] px-5 py-4 font-mono text-xs font-semibold tracking-[.14em] text-[#999da6]"><span>TWO_SUM.JS</span><span>3 / 5 TESTS</span></div>
        <div className="p-5 sm:p-7">
          <pre className="overflow-x-auto font-mono text-[13px] leading-7 text-[#c5c8c9]"><code>{`function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    // ...\n  }\n}`}</code></pre>
          <div className="mt-5 rounded-lg border border-[#34383e] bg-[#121417] p-4">
            <p className="theme-eyebrow !text-[#f5ad38]">Mentor hint 1</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#e9e9e8]">What could you remember about each number you have already visited?</p>
          </div>
        </div>
      </div>
    </section>

    <section className="mt-14 grid gap-8 border-t border-[#272a2e] pt-8 md:grid-cols-3 lg:mt-20" aria-label="Platform features">
      <div><h2 className="font-semibold text-[#e9e9e8]">AI mentor</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#999da6]">Reads your current code and gives one small nudge without revealing the solution.</p></div>
      <div><h2 className="font-semibold text-[#e9e9e8]">1v1 sparring</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#999da6]">Share a room link and race a friend on a random medium problem.</p></div>
      <div><h2 className="font-semibold text-[#e9e9e8]">Mock interviews</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#999da6]">Live code sync, an evaluation rubric, and private feedback for the candidate.</p></div>
    </section>
  </div>;
};

export default Home;
