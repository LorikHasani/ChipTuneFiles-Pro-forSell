import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Briefcase,
  Clock,
  CheckCircle2,
  Plus,
  CreditCard,
  List,
  Megaphone,
  AlertTriangle,
  Info,
  ArrowRight,
  Shield,
  ChevronRight,
  X,
  Send as SendIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useJobs, useActiveAnnouncements } from '../hooks/useApi';
import { formatRelativeTime, getStatusColor, getStatusLabel, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const { jobs, loading: jobsLoading } = useJobs();
  const { announcements, loading: announcementsLoading } = useActiveAnnouncements();
  const [showNewsModal, setShowNewsModal] = useState(false);

  useEffect(() => {
    if (!announcementsLoading && announcements && announcements.length > 0 && !isAdmin) {
      const dismissedKey = `news_dismissed_${announcements.map(a => a.id).join('_')}`;
      if (!sessionStorage.getItem(dismissedKey)) {
        setShowNewsModal(true);
      }
    }
  }, [announcementsLoading, announcements, isAdmin]);

  const dismissNewsModal = () => {
    setShowNewsModal(false);
    if (announcements) {
      const dismissedKey = `news_dismissed_${announcements.map(a => a.id).join('_')}`;
      sessionStorage.setItem(dismissedKey, '1');
    }
  };

  const pendingCount = jobs?.filter((j) => j.status === 'PENDING').length ?? 0;
  const completedCount = jobs?.filter((j) => j.status === 'COMPLETED').length ?? 0;
  const totalCount = jobs?.length ?? 0;
  const recentJobs = jobs?.slice(0, 5) ?? [];

  const announcementIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-neutral-400 shrink-0" />;
    }
  };

  const announcementBg = (type: string) => {
    switch (type) {
      case 'WARNING':
        return 'bg-amber-50 border-amber-200/60 dark:bg-amber-500/5 dark:border-amber-500/20';
      case 'SUCCESS':
        return 'bg-emerald-50 border-emerald-200/60 dark:bg-emerald-500/5 dark:border-emerald-500/20';
      default:
        return 'bg-neutral-50 border-neutral-200 dark:bg-white/[0.02] dark:border-neutral-800';
    }
  };

  const stats = [
    {
      label: 'Credit Balance',
      value: user?.creditBalance != null ? Number(user.creditBalance).toFixed(0) : '0',
      icon: Wallet,
    },
    {
      label: 'Total Jobs',
      value: totalCount.toString(),
      icon: Briefcase,
    },
    {
      label: 'Pending Jobs',
      value: pendingCount.toString(),
      icon: Clock,
    },
    {
      label: 'Completed Jobs',
      value: completedCount.toString(),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white tracking-tight">
          Welcome back, {user?.contactName || user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Here's what's happening with your tuning jobs today.
        </p>
      </div>

      {/* Active Announcements */}
      {!announcementsLoading && announcements && announcements.length > 0 && (isAdmin || !showNewsModal) && (
        <div className="space-y-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-lg border',
                announcementBg(a.type)
              )}
            >
              {announcementIcon(a.type)}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-neutral-900 dark:text-white">
                  {a.title}
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {a.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-600/10 dark:bg-red-600/10">
                <stat.icon className="w-[18px] h-[18px] text-red-600 dark:text-red-500" />
              </div>
              <div>
                <p className="text-xl font-semibold text-neutral-900 dark:text-white tabular-nums">
                  {jobsLoading ? '-' : stat.value}
                </p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-600 uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/jobs/new"
          className="card p-4 flex items-center gap-3 hover:border-red-300 dark:hover:border-red-900/50 transition-all group"
        >
          <div className="w-9 h-9 bg-red-600/10 rounded-lg flex items-center justify-center">
            <Plus className="w-[18px] h-[18px] text-red-600 dark:text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-neutral-900 dark:text-white text-sm">New Job</p>
            <p className="text-xs text-neutral-400">Submit a tuning request</p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-700 group-hover:text-red-500 transition-colors" />
        </Link>

        <Link
          to="/credits"
          className="card p-4 flex items-center gap-3 hover:border-red-300 dark:hover:border-red-900/50 transition-all group"
        >
          <div className="w-9 h-9 bg-red-600/10 rounded-lg flex items-center justify-center">
            <CreditCard className="w-[18px] h-[18px] text-red-600 dark:text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-neutral-900 dark:text-white text-sm">Buy Credits</p>
            <p className="text-xs text-neutral-400">Top up your balance</p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-700 group-hover:text-red-500 transition-colors" />
        </Link>

        <Link
          to="/prices"
          className="card p-4 flex items-center gap-3 hover:border-red-300 dark:hover:border-red-900/50 transition-all group"
        >
          <div className="w-9 h-9 bg-red-600/10 rounded-lg flex items-center justify-center">
            <List className="w-[18px] h-[18px] text-red-600 dark:text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-neutral-900 dark:text-white text-sm">View Prices</p>
            <p className="text-xs text-neutral-400">Browse service pricing</p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-700 group-hover:text-red-500 transition-colors" />
        </Link>
      </div>

      {/* Recent Jobs & Admin Panel */}
      <div className={cn('grid gap-4', isAdmin ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1')}>
        {/* Recent Jobs */}
        <div className={cn('card', isAdmin ? 'lg:col-span-2' : '')}>
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Recent Jobs</h2>
            <Link
              to="/jobs"
              className="text-xs text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
            >
              View all
            </Link>
          </div>

          {jobsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">No jobs yet</p>
              <Link
                to="/jobs/new"
                className="mt-3 inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-500 hover:underline font-medium"
              >
                <Plus className="w-4 h-4" />
                Create your first job
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {job.referenceNumber}
                      </p>
                      <Badge status={job.status} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">
                      {[job.brand, job.model, job.year].filter(Boolean).join(' ') || job.jobType + ' Job'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400">
                      {formatRelativeTime(job.createdAt)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-700 group-hover:text-red-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Admin Quick Panel */}
        {isAdmin && (
          <div className="card">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                Admin Panel
              </h2>
            </div>
            <div className="p-3 space-y-1">
              <Link
                to="/admin"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors group"
              >
                <div className="w-8 h-8 bg-red-600/10 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-red-600 dark:text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Dashboard</p>
                  <p className="text-xs text-neutral-400">System overview</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-700 group-hover:text-red-500 transition-colors" />
              </Link>
              <Link
                to="/admin/jobs"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors group"
              >
                <div className="w-8 h-8 bg-red-600/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-red-600 dark:text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Manage Jobs</p>
                  <p className="text-xs text-neutral-400">Review & process</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-700 group-hover:text-red-500 transition-colors" />
              </Link>
              <Link
                to="/admin/users"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors group"
              >
                <div className="w-8 h-8 bg-red-600/10 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-red-600 dark:text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Users</p>
                  <p className="text-xs text-neutral-400">Manage accounts</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-700 group-hover:text-red-500 transition-colors" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* News Modal for Clients */}
      {showNewsModal && announcements && announcements.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) dismissNewsModal(); }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <SendIcon className="w-4 h-4 text-red-500" />
                News
              </h2>
              <button
                onClick={dismissNewsModal}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-3">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    announcementBg(a.type)
                  )}
                >
                  <div className="flex items-start gap-3">
                    {announcementIcon(a.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white text-sm">
                        {a.title}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1 whitespace-pre-wrap">
                        {a.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={dismissNewsModal}
                className="btn-primary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
