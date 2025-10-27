import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    { path: '/dashboard', label: '📊 Dashboard', icon: '📊' },
    { path: '/dashboard/posts', label: '📝 Posts', icon: '📝' },
    { path: '/dashboard/categories', label: '📁 Categories', icon: '📁' },
    { path: '/dashboard/tags', label: '🏷️ Tags', icon: '🏷️' },
    { path: '/dashboard/comments', label: '💬 Comments', icon: '💬' },
    { path: '/dashboard/uploads', label: '📤 Uploads', icon: '📤' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white shadow-lg">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            CMS Admin
          </h1>
          <p className="text-sm text-gray-400 mt-2">Welcome back, {user?.name}!</p>
          <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${user?.role === 'admin' ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
            {user?.role}
          </div>
        </div>

        <nav className="mt-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive(link.path)
                  ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="font-medium">{link.label.replace(/^[^\s]+\s/, '')}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <div className="mb-3 px-2">
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
