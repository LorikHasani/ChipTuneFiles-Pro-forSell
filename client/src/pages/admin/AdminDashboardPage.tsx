import { Link } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  DollarSign,
  Users,
  ArrowRight,
  TrendingUp,
  FileText,
  Activity,
} from 'lucide-react';
import { useDashboardStats } from '../../hooks/useApi';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, subtitle, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-red-600 dark:text-red-500">{title}</p>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
      <p className="text-xs text-red-600 dark:text-red-500 mt-2">{subtitle}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Get pending jobs from recent jobs
  const pendingJobs = (stats.recentJobs || []).filter(j => j.status === 'PENDING');
  const recentActivity = (stats.recentJobs || []).slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Admin Dashboard</h1>

      {/* Stats Cards - 4 in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          subtitle={`${stats.completedToday} completed today`}
          icon={FileText}
          iconBg="bg-red-600/10"
          iconColor="text-red-600 dark:text-red-500"
        />
        <StatCard
          title="Pending"
          value={stats.pendingJobs}
          subtitle={`${stats.inProgressJobs} in progress`}
          icon={Clock}
          iconBg="bg-red-600/10"
          iconColor="text-red-600 dark:text-red-500"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Revenue earned"
          icon={DollarSign}
          iconBg="bg-red-600/10"
          iconColor="text-red-600 dark:text-red-500"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered clients"
          icon={Users}
          iconBg="bg-red-600/10"
          iconColor="text-red-600 dark:text-red-500"
        />
      </div>

      {/* Two-column layout: Pending Jobs + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Jobs */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Pending Jobs</h2>
            <Link
              to="/admin/jobs?status=PENDING"
              className="text-sm font-medium text-red-600 dark:text-red-500 hover:text-red-700"
            >
              View all
            </Link>
          </div>
          <div className="p-6">
            {pendingJobs.length > 0 ? (
              <div className="space-y-3">
                {pendingJobs.slice(0, 5).map((job) => (
                  <Link
                    key={job.id}
                    to={`/admin/jobs/${job.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white font-mono">
                        {job.referenceNumber}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                        {[job.brand, job.model].filter(Boolean).join(' ') || 'No vehicle info'}
                        {' · '}
                        {job.client?.contactName || job.client?.email || 'Unknown'}
                      </p>
                    </div>
                    <Badge status={job.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 dark:text-neutral-600 text-center py-6">
                No pending jobs
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Recent Activity</h2>
            <Link
              to="/admin/jobs"
              className="text-sm font-medium text-red-600 dark:text-red-500 hover:text-red-700"
            >
              View all
            </Link>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((job) => (
                  <Link
                    key={job.id}
                    to={`/admin/jobs/${job.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white font-mono">
                        {job.referenceNumber}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                        {job.client?.contactName || job.client?.email || 'Unknown'}
                        {' · '}
                        {formatDate(job.createdAt)}
                      </p>
                    </div>
                    <Badge status={job.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 dark:text-neutral-600 text-center py-6">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
