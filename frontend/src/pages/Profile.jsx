import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../api';
import Heatmap from '../components/Heatmap';
import { useAuth } from '../context/AuthContext';
import CompareModal from '../components/CompareModal';
import MockInterviewsList from '../components/Profile/MockInterviewsList';

const Profile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [librarySummary, setLibrarySummary] = useState(null);
  const [libraryError, setLibraryError] = useState('');
  const isOwner = user?.user_metadata?.username === username;

  const loadLibrarySummary = async () => {
    try { const { data } = await api.get('/api/library/summary', { params: { tzOffset: new Date().getTimezoneOffset() } }); setLibrarySummary(data); setLibraryError(''); }
    catch (err) { setLibraryError(err.response?.data?.error || 'Could not load review queue'); }
  };

  useEffect(() => { if (isOwner) loadLibrarySummary(); }, [isOwner]);

  const completeReview = async item => {
    try { await api.post(`/api/library/items/${item.id}/review`); await loadLibrarySummary(); }
    catch (err) { setLibraryError(err.response?.data?.error || 'Could not complete review'); }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch basic stats and heatmap concurrently
        const [profileRes, heatmapRes] = await Promise.all([
          api.get(`/api/profile/${username}`),
          api.get(`/api/profile/${username}/heatmap`)
        ]);

        setProfileData(profileRes.data);
        setHeatmapData(heatmapRes.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading Profile...</div>;
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-red-500 mb-2">Access Denied</h2>
        <p className="text-gray-400">{error || 'Profile not found or is set to private.'}</p>
      </div>
    );
  }

  const { stats } = profileData;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 mt-10 mb-20 font-sans">
      
      {/* Profile Header & Stats */}
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl relative overflow-hidden">
        {/* Aesthetic background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">{profileData.username}</h1>
            <p className="text-blue-400 font-medium tracking-wide uppercase text-sm">Competitive Programmer</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button 
              onClick={() => setIsCompareModalOpen(true)}
              className="px-5 py-2 rounded font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/50 transition-all transform hover:-translate-y-0.5"
            >
              Compare Profile
            </button>
          </div>
        </div>

        {/* Global Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner col-span-2 md:col-span-1">
            <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">Global Score</h3>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">{stats.total_score}</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner col-span-2 md:col-span-1">
            <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">Clean Streak</h3>
            <p className="text-4xl font-black text-white">{stats.streak} <span className="text-sm font-medium text-gray-500">days</span></p>
          </div>
          
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner">
            <h3 className="text-green-500 font-semibold uppercase tracking-wider text-xs mb-2">Easy Solved</h3>
            <p className="text-3xl font-bold text-gray-100">{stats.easy_solved}</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner">
            <h3 className="text-yellow-500 font-semibold uppercase tracking-wider text-xs mb-2">Medium Solved</h3>
            <p className="text-3xl font-bold text-gray-100">{stats.medium_solved}</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner">
            <h3 className="text-red-500 font-semibold uppercase tracking-wider text-xs mb-2">Hard Solved</h3>
            <p className="text-3xl font-bold text-gray-100">{stats.hard_solved}</p>
          </div>
        </div>

        {/* Total Hints Used Metric */}
        <div className="text-right">
          <p className="text-sm text-gray-500">Total AI Hints Consumed: <span className="text-blue-400 font-bold">{stats.total_hints_used}</span></p>
        </div>
      </div>

      {/* Dynamic Heatmap */}
      <Heatmap data={heatmapData} />

      {isOwner && <section className="mt-8 space-y-6" aria-label="Personal practice dashboard">
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold text-white">Practice progress</h2><p className="mt-1 text-sm text-gray-400">Verified Smart Leetcode submissions and self reported external solves are tracked separately.</p></div><Link to="/library" className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500">Open My Library</Link></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-lg border border-green-800 bg-green-950/30 p-4"><p className="text-sm text-green-300">Smart Leetcode verified solves</p><p className="mt-1 text-3xl font-bold text-white">{librarySummary?.verifiedSolves ?? '—'}</p><p className="text-xs text-gray-400">Only accepted submissions can earn competitive score.</p></div><div className="rounded-lg border border-blue-800 bg-blue-950/30 p-4"><p className="text-sm text-blue-300">External solves logged</p><p className="mt-1 text-3xl font-bold text-white">{librarySummary?.externalLoggedSolves ?? '—'}</p><p className="text-xs text-gray-400">Self reported; no competitive points.</p></div></div>{libraryError && <p role="alert" className="mt-3 text-sm text-red-300">{libraryError}</p>}</div>
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6"><h2 className="mb-4 text-2xl font-bold text-white">Revisit queue</h2><div className="grid gap-5 lg:grid-cols-3">{[['Overdue', librarySummary?.overdue || [], 'text-red-300'], ['Due today', librarySummary?.dueToday || [], 'text-yellow-300'], ['Upcoming', librarySummary?.upcoming || [], 'text-blue-300']].map(([heading, list, tone]) => <div key={heading}><h3 className={`mb-3 font-semibold ${tone}`}>{heading} <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-white">{list.length}</span></h3>{list.length === 0 ? <p className="text-sm text-gray-500">Nothing here.</p> : <div className="space-y-2">{list.map(item => <div key={item.id} className="rounded-lg border border-gray-700 bg-gray-900 p-3"><p className="font-medium text-white">{item.title}</p><p className="mb-2 text-xs text-gray-400">{item.source === 'smartleetcode' ? 'Smart Leetcode' : item.source} · {new Date(item.next_review_at).toLocaleDateString()}</p><div className="flex gap-2 text-xs"><Link to={item.source === 'smartleetcode' ? `/problem/${item.question_id}` : item.external_url} target={item.source === 'smartleetcode' ? undefined : '_blank'} rel="noopener noreferrer" className="rounded bg-blue-600 px-2 py-1 font-semibold hover:bg-blue-500">Review now</Link><button onClick={() => completeReview(item)} className="rounded border border-green-700 px-2 py-1 text-green-300 hover:bg-green-950">Mark reviewed</button></div></div>)}</div>}</div>)}</div></div>
      </section>}

      {/* Private Mock Interviews List */}
      {user?.user_metadata?.username === profileData.username && (
        <MockInterviewsList username={profileData.username} />
      )}

      <CompareModal 
        isOpen={isCompareModalOpen} 
        onClose={() => setIsCompareModalOpen(false)} 
        currentUserData={profileData} 
      />
    </div>
  );
};

export default Profile;
