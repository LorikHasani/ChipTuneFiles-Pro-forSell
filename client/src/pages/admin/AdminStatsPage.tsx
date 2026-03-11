import { BarChart3, TrendingUp, Users, FileText, CreditCard, DollarSign } from 'lucide-react';
import { useDashboardStats } from '../../hooks/useApi';
import { formatCurrency, getStatusLabel } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import type { DashboardStats } from '../../types';

export default function AdminStatsPage() {
  const { stats, loading } = useDashboardStats();

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!stats) return <p className="text-center text-gray-500 py-12">Failed to load stats</p>;

  const statusBreakdown = [
    { status: 'PENDING', count: stats.pendingJobs, color: 'bg-yellow-500' },
    { status: 'IN_PROGRESS', count: stats.inProgressJobs, color: 'bg-blue-500' },
    { status: 'COMPLETED', count: stats.completedJobs, color: 'bg-green-500' },
  ];

  const totalJobsForBar = Math.max(1, stats.pendingJobs + stats.inProgressJobs + stats.completedJobs);

  return (
    <div className="space-y-6">
      <PageHeader title="Statistics & Analytics" subtitle="Platform performance overview" />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
          { label: 'Total Jobs', value: stats.totalJobs, icon: FileText, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
          { label: 'Completed Today', value: stats.completedToday, icon: TrendingUp, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
        ].map(stat => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs by Status */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 size={18} /> Jobs by Status
        </h3>
        <div className="space-y-4">
          {statusBreakdown.map(item => (
            <div key={item.status}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">{getStatusLabel(item.status)}</span>
                <span className="font-medium text-gray-900 dark:text-white">{item.count}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                <div className={`${item.color} h-3 rounded-full transition-all`}
                  style={{ width: `${(item.count / totalJobsForBar) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credits overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard size={18} /> Credit Economy
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Total Revenue</span>
              <span className="font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Total Credits in System</span>
              <span className="font-bold">{stats.totalCreditsIssued?.toFixed(0) || '0'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Avg Revenue per User</span>
              <span className="font-bold">{stats.totalUsers ? formatCurrency(stats.totalRevenue / stats.totalUsers) : '-'}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Quick Stats
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Pending Jobs</span>
              <span className="font-bold text-yellow-600">{stats.pendingJobs}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">In Progress</span>
              <span className="font-bold text-blue-600">{stats.inProgressJobs}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Completion Rate</span>
              <span className="font-bold text-green-600">
                {stats.totalJobs ? `${((stats.completedJobs / stats.totalJobs) * 100).toFixed(1)}%` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
