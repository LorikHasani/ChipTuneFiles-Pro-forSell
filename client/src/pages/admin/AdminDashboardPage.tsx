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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>

      {/* Stats Cards - 4 in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          subtitle={`${stats.completedToday} completed today`}
          icon={FileText}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Pending"
          value={stats.pendingJobs}
          subtitle={`${stats.inProgressJobs} in progress`}
          icon={Clock}
          iconBg="bg-yellow-100 dark:bg-yellow-900/30"
          iconColor="text-yellow-600 dark:text-yellow-400"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="Revenue earned"
          icon={DollarSign}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered clients"
          icon={Users}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Two-column layout: Pending Jobs + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Jobs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Pending Jobs</h2>
            <Link
              to="/admin/jobs?status=PENDING"
              className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
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
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                        {job.referenceNumber}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                No pending jobs
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <Link
              to="/admin/jobs"
              className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
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
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                        {job.referenceNumber}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
