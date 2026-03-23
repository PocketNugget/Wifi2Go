import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldAlert, LogOut } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const navItems = [
    { label: 'Active Devices', path: '/admin/devices', icon: Users },
    { label: 'Security Logs', path: '/admin/logs', icon: ShieldAlert },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-appleGray dark:bg-appleDark text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/20 flex flex-col fixed inset-y-0 left-0">
        <div className="p-6 flex items-center gap-3 mb-8">
          <div className="bg-appleBlue text-white p-2 rounded-xl">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">NetConnect</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${active ? 'bg-appleBlue text-white shadow-md shadow-appleBlue/20' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
