import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
    try {
      const { data } = await api.get('/api/library/summary', { params: { tzOffset: new Date().getTimezoneOffset() } });
      setLibrarySummary(data);
      setLibraryError('');
    } catch (err) { setLibraryError(err.response?.data?.error || 'Could not load review queue'); }
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
        const [profileRes, heatmapRes] = await Promise.all([
          api.get(`/api/profile/${username}`),
          api.get(`/api/profile/${username}/heatmap`)
        ]);
        setProfileData(profileRes.data);
        setHeatmapData(heatmapRes.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally { setLoading(false); }
    };
    fetchProfileData();
  }, [username]);

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center text-[#999da6]">Loading profile...</div>;
  if (error || !profileData) return <div className="flex min-h-[70vh] flex-col items-center justify-center"><h2 className="mb-2 text-2xl font-bold text-red-400">Access denied</h2><p className="text-[#999da6]">{error || 'Profile not found or is set to private.'}</p></div>;

  const { stats } = profileData;
  const queues = [
    { name: 'Overdue', items: librarySummary?.overdue || [] },
    { name: 'Due today', items: librarySummary?.dueToday || [] },
    { name: 'Upcoming', items: librarySummary?.upcoming || [] }
  ];

  return <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
    <div className="grid gap-6 lg:grid-cols-[335px_minmax(0,1fr)]">
      <aside className="theme-panel h-fit p-6 sm:p-7">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#373b41] bg-[#191b1e] font-mono text-2xl text-[#f5ad38]" aria-hidden="true">{profileData.username?.charAt(0).toUpperCase()}</div>
        <h1 className="mt-5 break-words text-2xl font-bold tracking-tight text-[#edece9]">{profileData.username}</h1>
        <p className="theme-eyebrow mt-1">Competitive programmer</p>
        <dl className="mt-6 divide-y divide-[#282b30] border-t border-[#282b30] text-sm">
          {[
            ['Global score', stats.total_score],
            ['Clean streak', `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`],
            ['AI hints used', stats.total_hints_used],
            ...(isOwner ? [['Verified solves', librarySummary?.verifiedSolves ?? '—'], ['External solves', librarySummary?.externalLoggedSolves ?? '—']] : [])
          ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 py-3"><dt className="text-[#999da6]">{label}</dt><dd className="font-mono font-semibold text-[#e9e9e8]">{value}</dd></div>)}
        </dl>
        <button type="button" onClick={() => setIsCompareModalOpen(true)} className="theme-button-secondary mt-5 w-full !py-2.5 text-sm">Compare profile</button>
      </aside>

      <div className="min-w-0 space-y-5">
        <section className="theme-panel grid grid-cols-3 divide-x divide-[#2a2e33]" aria-label="Solved by difficulty">
          {[['Easy', stats.easy_solved], ['Medium', stats.medium_solved], ['Hard', stats.hard_solved]].map(([label, value]) => <div key={label} className="p-5 sm:p-6"><h2 className="theme-eyebrow">{label}</h2><p className="mt-3 font-mono text-3xl font-semibold text-[#edece9]">{value}</p></div>)}
        </section>

        <Heatmap data={heatmapData} />

        {isOwner && <section className="theme-panel p-6" aria-labelledby="revisit-title">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="revisit-title" className="text-lg font-bold text-[#edece9]">Revisit queue</h2><Link to="/library" className="text-sm text-[#a8abb2] hover:text-[#f5ad38]">Open My Library →</Link></div>
          {libraryError && <p role="alert" className="mt-3 text-sm text-red-300">{libraryError}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {queues.map(queue => <div key={queue.name} className="theme-subpanel min-w-0 p-4"><h3 className="theme-eyebrow">{queue.name}</h3><p className="mt-2 font-mono text-2xl text-[#ecebe8]">{queue.items.length}</p>{queue.items.length > 0 && <div className="mt-4 space-y-3 border-t border-[#292d31] pt-4">{queue.items.map(item => <div key={item.id} className="border-b border-[#292d31] pb-3 last:border-0 last:pb-0"><p className="truncate text-sm font-medium text-[#e9e9e8]" title={item.title}>{item.title}</p><p className="mt-1 text-xs text-[#92969f]">{item.source === 'smartleetcode' ? 'Smart Leetcode' : item.source} · {new Date(item.next_review_at).toLocaleDateString()}</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><Link to={item.source === 'smartleetcode' ? `/problem/${item.question_id}` : item.external_url} target={item.source === 'smartleetcode' ? undefined : '_blank'} rel="noopener noreferrer" className="font-semibold text-[#f5ad38] hover:text-[#ffc061]">Review now</Link><button type="button" onClick={() => completeReview(item)} className="text-[#b7bbc3] hover:text-white">Mark reviewed</button></div></div>)}</div>}</div>)}
          </div>
          {queues.every(queue => queue.items.length === 0) && <p className="mt-4 text-sm text-[#999da6]">Nothing scheduled. Add a review date when you save notes on a problem.</p>}
          <p className="mt-5 text-xs text-[#81858e]">Verified Smart Leetcode solves and self-reported external solves are tracked separately. Only accepted submissions affect competitive score.</p>
        </section>}

        {isOwner && <MockInterviewsList username={profileData.username} />}
      </div>
    </div>

    <CompareModal isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} currentUserData={profileData} />
  </div>;
};

export default Profile;
