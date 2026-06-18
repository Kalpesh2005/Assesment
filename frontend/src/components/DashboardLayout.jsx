import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Star, 
  KeyRound, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = {
    ADMIN: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/users', label: 'Manage Users', icon: Users },
      { path: '/admin/stores', label: 'Manage Stores', icon: Store },
      { path: '/admin/change-password', label: 'Change Password', icon: KeyRound }
    ],
    USER: [
      { path: '/dashboard', label: 'Stores', icon: Store },
      { path: '/dashboard/change-password', label: 'Change Password', icon: KeyRound }
    ],
    STORE_OWNER: [
      { path: '/owner', label: 'Dashboard & Reviews', icon: LayoutDashboard },
      { path: '/owner/change-password', label: 'Change Password', icon: KeyRound }
    ]
  };

  const currentRoleItems = menuItems[user?.role] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-20">
        <div className="flex items-center space-x-2">
          <Star className="text-indigo-400 h-6 w-6 fill-indigo-400" />
          <span className="font-bold tracking-wider text-xl text-white">StoreRate</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-850 w-64 p-6 flex flex-col justify-between z-10 transition-transform duration-300 transform 
        md:translate-x-0 md:static md:flex
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-8">
          {/* Logo */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/25">
              <Star className="text-indigo-400 h-6 w-6 fill-indigo-400" />
            </div>
            <span className="font-bold tracking-wider text-xl bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">StoreRate</span>
          </div>

          {/* User Profile Card */}
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
            <div className="bg-slate-800 p-2.5 rounded-lg text-indigo-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-white text-sm truncate">{user?.name}</h4>
              <p className="text-xs text-slate-400 truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {currentRoleItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3.5 px-4.5 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                      : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3.5 px-4.5 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer mt-8"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
