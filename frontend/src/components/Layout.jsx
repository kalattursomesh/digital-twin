import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, User, LogOut, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Layout = ({ setAuth }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('twin_token');
    localStorage.removeItem('twin_user');
    setAuth(false);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-y-0 border-l-0 rounded-none rounded-r-2xl flex flex-col z-10 relative">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2 rounded-xl shadow-lg shadow-primary-500/30">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight leading-tight">Digital Twin</h1>
            <p className="text-xs text-primary-400 font-medium">Behavior Engine</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/10 text-primary-400 font-medium border border-primary-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
              }`
            }
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/10 text-primary-400 font-medium border border-primary-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
              }`
            }
          >
            <Activity size={20} />
            Activity Log
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/10 text-primary-400 font-medium border border-primary-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
              }`
            }
          >
            <User size={20} />
            Twin Profile
          </NavLink>
        </nav>

        <div className="p-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/15 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-950/15 blur-[110px] rounded-full pointer-events-none -z-10" />
        
        <div className="p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
