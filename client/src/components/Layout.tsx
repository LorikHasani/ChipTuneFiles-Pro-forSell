import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Upload,
  Wallet,
  Tag,
  LifeBuoy,
  Calculator,
  Shield,
  Users,
  Wrench,
  Package,
  Megaphone,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useBrandingStore } from '../stores/brandingStore';
import DarkModeToggle from './DarkModeToggle';
import { cn } from '../lib/utils';
import api from '../lib/api';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const clientNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Upload File', path: '/jobs/new', icon: Upload },
  { label: 'My Jobs', path: '/jobs', icon: Briefcase },
  { label: 'Prices', path: '/prices', icon: Tag },
  { label: 'Balance', path: '/credits', icon: Wallet },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Tickets', path: '/tickets', icon: LifeBuoy },
];

const WORKING_HOURS = [
  { day: 'Mon', hours: '9:00 AM - 10:00 PM' },
  { day: 'Tue', hours: '9:00 AM - 10:00 PM' },
  { day: 'Wed', hours: '9:00 AM - 10:00 PM' },
  { day: 'Thu', hours: '9:00 AM - 10:00 PM' },
  { day: 'Fri', hours: '9:00 AM - 10:00 PM' },
  { day: 'Sat', hours: '9:00 AM - 10:00 PM' },
  { day: 'Sun', hours: 'Closed' },
];

function getCurrentDayIndex(): number {
  const d = new Date().getDay();
  // JS: 0=Sun,1=Mon..6=Sat → we want 0=Mon..6=Sun
  return d === 0 ? 6 : d - 1;
}

function isPortalOpen(): boolean {
  const now = new Date();
  const day = now.getDay();
  if (day === 0) return false; // Sunday
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMin = hour * 60 + minute;
  return totalMin >= 540 && totalMin < 1320; // 9:00 AM - 10:00 PM
}

const adminNavItems: NavItem[] = [
  { label: 'Admin Dashboard', path: '/admin', icon: Shield },
  { label: 'Manage Jobs', path: '/admin/jobs', icon: Briefcase },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Services', path: '/admin/services', icon: Wrench },
  { label: 'Packages', path: '/admin/packages', icon: Package },
  { label: 'Tickets', path: '/admin/tickets', icon: LifeBuoy },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAdmin, logout } = useAuthStore();
  const { branding } = useBrandingStore();
  const navigate = useNavigate();

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get<{ count: number }>('/notifications/unread-count');
        setUnreadCount(data.count);
      } catch {
        // Silently fail
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close sidebar on route change (mobile)
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <NavLink to="/" onClick={closeSidebar} className="flex items-center gap-3 min-w-0">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.brand_name}
                className="h-8 w-8 object-contain rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary-600 text-white font-bold text-sm flex-shrink-0">
                {branding.brand_name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {branding.brand_name}
            </span>
          </NavLink>
          <button
            onClick={closeSidebar}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 lg:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Client navigation */}
          <div className="mb-2">
            <span className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Menu
            </span>
          </div>
          {clientNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={closeSidebar}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}

          {/* Admin navigation */}
          {isAdmin && (
            <>
              <div className="mt-6 mb-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Administration
                </span>
              </div>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50'
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Working Hours */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Working Hours</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('w-2 h-2 rounded-full', isPortalOpen() ? 'bg-green-500' : 'bg-red-500')} />
            <span className={cn('text-xs font-medium', isPortalOpen() ? 'text-green-500' : 'text-red-500')}>
              {isPortalOpen() ? 'Portal Open' : 'Portal Closed'}
            </span>
          </div>
          <div className="space-y-0.5">
            {WORKING_HOURS.map((wh, i) => (
              <div key={wh.day} className={cn(
                'flex justify-between text-xs px-1 py-0.5 rounded',
                i === getCurrentDayIndex()
                  ? 'bg-primary-900/30 text-white font-semibold'
                  : 'text-gray-500 dark:text-gray-400'
              )}>
                <span>{wh.day}</span>
                <span className={wh.hours === 'Closed' ? 'text-red-500' : ''}>{wh.hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User section at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-semibold flex-shrink-0">
              {(user?.contactName || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.contactName || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 lg:hidden transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Credit balance pill */}
            <NavLink
              to="/credits"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
            >
              <Wallet className="h-4 w-4" />
              &euro;{Number(user?.creditBalance ?? 0).toFixed(2)}
            </NavLink>

            {/* Dark mode toggle */}
            <DarkModeToggle />

            {/* Notification bell */}
            <button
              onClick={() => {
                navigate('/notifications');
                closeSidebar();
              }}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
