import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isInterview = location.pathname.includes('/interview/');

  const handleNavClick = (e) => {
    if (isInterview) {
      if (!window.confirm("You are currently in an active interview session. Are you sure you want to leave?")) {
        e.preventDefault();
      }
    }
  };

  const handleLogout = async () => {
    if (isInterview) {
      if (!window.confirm("You are currently in an active interview session. Are you sure you want to logout?")) {
        return;
      }
    }
    await signOut();
    navigate('/login');
  };
  const navClass = path => `transition-colors hover:text-[#f5ad38] ${location.pathname.startsWith(path) ? 'text-[#eeeae3]' : 'text-[#969aa3]'}`;

  return <nav className="border-b border-[#25282c] bg-[#0e0f11]">
    <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12">
      <Link to="/" onClick={handleNavClick} className="flex items-center gap-3 text-base font-bold tracking-tight text-[#ecebe8]">
        <img src="/app icon.jpeg" alt="Smart Leetcode Logo" className="h-8 w-8 rounded-md object-cover" />
        <span>Smart Leetcode</span>
      </Link>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm sm:gap-x-7">
        {user ? <>
          <Link to="/problems" onClick={handleNavClick} className={navClass('/problem')}>Practice</Link>
          <Link to="/library" onClick={handleNavClick} className={navClass('/library')}>My Library</Link>
          <Link to={`/profile/${user.user_metadata?.username || 'me'}`} onClick={handleNavClick} className={navClass('/profile')}>Profile</Link>
          <button type="button" onClick={handleLogout} className="rounded-lg border border-[#35393f] px-4 py-2 font-semibold text-[#e9e9e8] transition-colors hover:border-[#f5ad38]">Log out</button>
        </> : <Link to="/login" onClick={handleNavClick} className="theme-button-secondary !px-4 !py-2">Log in</Link>}
      </div>
    </div>
  </nav>;
};

export default Navbar;
