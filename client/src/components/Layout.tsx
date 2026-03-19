import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Upload,
  Wallet,
  Tag,
  LifeBuoy,
  Users,
  Package,
  Mail,
  Send,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  Clock,
  Settings,
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
  return d === 0 ? 6 : d - 1;
}

function isPortalOpen(): boolean {
  const now = new Date();
  const day = now.getDay();
  if (day === 0) return false;
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMin = hour * 60 + minute;
  return totalMin >= 540 && totalMin < 1320;
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'All Jobs', path: '/admin/jobs', icon: Briefcase },
  { label: 'Services', path: '/admin/services', icon: Tag },
  { label: 'Packages', path: '/admin/packages', icon: Package },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Tickets', path: '/admin/tickets', icon: LifeBuoy },
  { label: 'Emails', path: '/admin/emails', icon: Mail },
  { label: 'News', path: '/admin/announcements', icon: Send },
  { label: 'Statistics', path: '/admin/stats', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAdmin, logout } = useAuthStore();
  const { branding } = useBrandingStore();
  const navigate = useNavigate();

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

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-black">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col w-[260px] bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
          <NavLink to="/" onClick={closeSidebar} className="flex items-center gap-3 min-w-0">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.brand_name}
                className="h-7 w-7 object-contain rounded-md flex-shrink-0"
              />
            ) : (
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-red-600 text-white font-bold text-xs flex-shrink-0">
                {branding.brand_name.charAt(0)}
              </div>
            )}
            <span className="text-[15px] font-semibold text-neutral-900 dark:text-white truncate tracking-tight">
              {branding.brand_name}
            </span>
          </NavLink>
          <button
            onClick={closeSidebar}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 lg:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {isAdmin ? (
            adminNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all',
                    isActive
                      ? 'bg-red-600/10 dark:bg-red-600/10 text-red-600 dark:text-red-500'
                      : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5'
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                {item.label}
              </NavLink>
            ))
          ) : (
            <>
              <div className="mb-2 mt-1">
                <span className="px-3 text-[11px] font-medium text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">
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
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all',
                      isActive
                        ? 'bg-red-600/10 dark:bg-red-600/10 text-red-600 dark:text-red-500'
                        : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5'
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Working Hours - clients only */}
        {!isAdmin && <div className="flex-shrink-0 border-t border-neutral-200 dark:border-neutral-800 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">Working Hours</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('w-1.5 h-1.5 rounded-full', isPortalOpen() ? 'bg-red-500' : 'bg-neutral-400')} />
            <span className={cn('text-xs font-medium', isPortalOpen() ? 'text-red-600 dark:text-red-400' : 'text-neutral-400')}>
              {isPortalOpen() ? 'Portal Open' : 'Portal Closed'}
            </span>
          </div>
          <div className="space-y-0.5">
            {WORKING_HOURS.map((wh, i) => (
              <div key={wh.day} className={cn(
                'flex justify-between text-[11px] px-1 py-0.5 rounded',
                i === getCurrentDayIndex()
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold'
                  : 'text-neutral-400 dark:text-neutral-600'
              )}>
                <span>{wh.day}</span>
                <span className={wh.hours === 'Closed' ? 'text-neutral-400' : ''}>{wh.hours}</span>
              </div>
            ))}
          </div>
        </div>}

        {/* User section */}
        <div className="flex-shrink-0 border-t border-neutral-200 dark:border-neutral-800 p-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600/10 text-red-600 dark:text-red-500 text-xs font-semibold flex-shrink-0">
              {(user?.contactName || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">{user?.contactName || 'User'}</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-600 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium w-full text-neutral-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="flex items-center justify-between h-14 px-4 sm:px-6 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Credit balance pill */}
            {!isAdmin && (
              <NavLink
                to="/credits"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold transition-all hover:bg-red-700"
              >
                <Wallet className="h-3.5 w-3.5" />
                &euro;{Number(user?.creditBalance ?? 0).toFixed(2)}
              </NavLink>
            )}

            <DarkModeToggle />

            {/* Notification bell */}
            <button
              onClick={() => {
                navigate('/notifications');
                closeSidebar();
              }}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white bg-red-600 rounded-full">
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
