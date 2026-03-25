import { Link } from 'react-router-dom';
import {
  Clock,
  DollarSign,
  Users,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useDashboardStats } from '../../hooks/useApi';
import { formatCurrency, formatDateTime, cn } from '../../lib/utils';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  subtitleIcon?: React.ElementType;
  subtitleColor?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, borderColor, subtitleIcon: SubIcon, subtitleColor }: StatCardProps) {
  return (
    <div className={cn('bg-white dark:bg-neutral-900 rounded-xl border shadow-sm p-5', borderColor)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
      <p className={cn('text-xs mt-2 flex items-center gap-1', subtitleColor || 'text-neutral-500 dark:text-neutral-400')}>
        {SubIcon && <SubIcon className="h-3.5 w-3.5" />}
        {subtitle}
      </p>
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

  const pendingJobs = (stats.recentJobs || []).filter(j => j.status === 'PENDING');
  const recentActivity = (stats.recentJobs || []).slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          subtitle={`${stats.completedToday} completed today`}
          subtitleIcon={TrendingUp}
          subtitleColor="text-green-500"
          icon={FileText}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          borderColor="border-neutral-200 dark:border-neutral-800"
        />
        <StatCard
          title="Pending"
          value={stats.pendingJobs}
          subtitle={`${stats.inProgressJobs} in progress`}
          icon={Clock}
          iconBg="bg-yellow-500/10"
          iconColor="text-yellow-500"
          borderColor="border-neutral-200 dark:border-neutral-800"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Revenue earned"
          icon={DollarSign}
          iconBg="bg-green-500/10"
          iconColor="text-green-500"
          borderColor="border-green-500/30 dark:border-green-500/20"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered clients"
          icon={Users}
          iconBg="bg-pink-500/10"
          iconColor="text-pink-500"
          borderColor="border-pink-500/30 dark:border-pink-500/20"
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
          <div className="p-4">
            {pendingJobs.length > 0 ? (
              <div className="space-y-2">
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
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {[job.brand, job.model].filter(Boolean).join(' ') || 'No vehicle info'}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {job.client?.contactName || job.client?.email || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                          {formatCurrency(job.totalPrice || 0)}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                          {formatDateTime(job.createdAt).split(',').pop()?.trim() || ''}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-neutral-400" />
                    </div>
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
          <div className="p-4">
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((job) => (
                  <Link
                    key={job.id}
                    to={`/admin/jobs/${job.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white font-mono">
                            {job.referenceNumber}
                          </p>
                          <Badge status={job.status} />
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {[job.brand, job.model].filter(Boolean).join(' ') || 'No vehicle info'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
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
