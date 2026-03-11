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

  const pendingCount = jobs?.filter((j) => j.status === 'PENDING').length ?? 0;
  const completedCount = jobs?.filter((j) => j.status === 'COMPLETED').length ?? 0;
  const totalCount = jobs?.length ?? 0;
  const recentJobs = jobs?.slice(0, 5) ?? [];

  const announcementIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const announcementBg = (type: string) => {
    switch (type) {
      case 'WARNING':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
      case 'SUCCESS':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const stats = [
    {
      label: 'Credit Balance',
      value: user?.creditBalance != null ? Number(user.creditBalance).toFixed(0) : '0',
      icon: Wallet,
      color: 'text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400',
    },
    {
      label: 'Total Jobs',
      value: totalCount.toString(),
      icon: Briefcase,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      label: 'Pending Jobs',
      value: pendingCount.toString(),
      icon: Clock,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    },
    {
      label: 'Completed Jobs',
      value: completedCount.toString(),
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.contactName || user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Here's an overview of your account activity.
        </p>
      </div>

      {/* Active Announcements */}
      {!announcementsLoading && announcements && announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border',
                announcementBg(a.type)
              )}
            >
              {announcementIcon(a.type)}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  {a.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {a.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {jobsLoading ? '-' : stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/jobs/new"
          className="card p-4 flex items-center gap-3 hover:border-primary-300 dark:hover:border-primary-600 transition-colors group"
        >
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white text-sm">New Job</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Submit a tuning request</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </Link>

        <Link
          to="/credits"
          className="card p-4 flex items-center gap-3 hover:border-green-300 dark:hover:border-green-600 transition-colors group"
        >
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white text-sm">Buy Credits</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Top up your balance</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
        </Link>

        <Link
          to="/prices"
          className="card p-4 flex items-center gap-3 hover:border-purple-300 dark:hover:border-purple-600 transition-colors group"
        >
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <List className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white text-sm">View Prices</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Browse service pricing</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
        </Link>
      </div>

      {/* Recent Jobs & Admin Panel */}
      <div className={cn('grid gap-6', isAdmin ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1')}>
        {/* Recent Jobs */}
        <div className={cn('card', isAdmin ? 'lg:col-span-2' : '')}>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Jobs</h2>
            <Link
              to="/jobs"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
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
              <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No jobs yet</p>
              <Link
                to="/jobs/new"
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create your first job
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {job.referenceNumber}
                      </p>
                      <Badge status={job.status} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {[job.brand, job.model, job.year].filter(Boolean).join(' ') || job.jobType + ' Job'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatRelativeTime(job.createdAt)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Admin Quick Panel */}
        {isAdmin && (
          <div className="card">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-500" />
                Admin Panel
              </h2>
            </div>
            <div className="p-4 space-y-2">
              <Link
                to="/admin"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dashboard</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">System overview</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </Link>
              <Link
                to="/admin/jobs"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Manage Jobs</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Review & process</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </Link>
              <Link
                to="/admin/users"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Users</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage accounts</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
