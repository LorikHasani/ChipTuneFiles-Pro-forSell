import { Link } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  Loader2,
  CheckCircle2,
  Users,
  DollarSign,
  ArrowRight,
  Settings,
  ClipboardList,
  UserCog,
} from 'lucide-react';
import { useDashboardStats } from '../../hooks/useApi';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, cn } from '../../lib/utils';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of your platform activity"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={Briefcase}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Pending Jobs"
          value={stats.pendingJobs}
          icon={Clock}
          iconBg="bg-yellow-100 dark:bg-yellow-900/30"
          iconColor="text-yellow-600 dark:text-yellow-400"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgressJobs}
          icon={Loader2}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday}
          icon={CheckCircle2}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          to="/admin/jobs"
          className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Manage Jobs</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">View and process jobs</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </Link>
        <Link
          to="/admin/users"
          className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <UserCog className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Manage Users</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Users and credits</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </Link>
        <Link
          to="/admin/settings"
          className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Settings</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Branding and config</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </Link>
      </div>

      {/* Recent Jobs Table */}
      <Card
        title="Recent Jobs"
        subtitle="Latest submitted jobs across all clients"
        action={
          <Link to="/admin/jobs" className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
            View All
          </Link>
        }
      >
        {stats.recentJobs && stats.recentJobs.length > 0 ? (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                    Reference
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                    Client
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                    Vehicle
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats.recentJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {job.referenceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {job.client?.contactName || job.client?.email || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {[job.brand, job.model, job.year].filter(Boolean).join(' ') || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={job.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(job.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/jobs/${job.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="Jobs will appear here once clients start submitting them."
          />
        )}
      </Card>
    </div>
  );
}
