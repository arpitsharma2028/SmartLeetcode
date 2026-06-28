import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  return (
    <nav className="bg-gray-800 border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 hover:scale-105 transition-transform duration-200">
              MiniLeetcode
            </Link>
          </div>
          <div className="flex space-x-6 items-center">
            {user ? (
              <>
                <Link to="/problem/1" className="text-gray-300 hover:text-white transition-colors">
                  Practice
                </Link>
                <Link to={`/profile/${user.user_metadata?.username || 'me'}`} className="text-gray-300 hover:text-white transition-colors">
                  Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors border border-gray-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-md hover:shadow-blue-500/50">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
