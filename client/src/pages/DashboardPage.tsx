import { Link } from 'react-router-dom';
import {
  Wallet,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Settings,
  Activity,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useJobs } from '../hooks/useApi';
import { formatDate, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { jobs, loading: jobsLoading } = useJobs();

  const activeJobs = jobs?.filter((j) => j.status === 'PENDING' || j.status === 'IN_PROGRESS').length ?? 0;
  const pendingCount = jobs?.filter((j) => j.status === 'PENDING').length ?? 0;
  const completedCount = jobs?.filter((j) => j.status === 'COMPLETED').length ?? 0;
  const totalCount = jobs?.length ?? 0;
  const recentJobs = jobs?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Welcome back, {user?.contactName || user?.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="mt-1 text-sm text-neutral-500 italic">
          Here's what's happening with your tuning jobs today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Balance */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Balance</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {jobsLoading ? '-' : `€${Number(user?.creditBalance ?? 0).toFixed(2)}`}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-500/10">
              <Wallet className="w-[18px] h-[18px] text-green-500" />
            </div>
          </div>
          <Link to="/credits" className="text-xs text-red-500 hover:text-red-400 font-medium mt-2 inline-block">
            Top up balance →
          </Link>
        </div>

        {/* Active Jobs */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Active Jobs</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {jobsLoading ? '-' : activeJobs}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-500/10">
              <Activity className="w-[18px] h-[18px] text-purple-500" />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border border-neutral-600 inline-flex items-center justify-center text-[8px]">⏱</span>
            {pendingCount} pending
          </p>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Completed</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {jobsLoading ? '-' : completedCount}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-500/10">
              <CheckCircle2 className="w-[18px] h-[18px] text-green-500" />
            </div>
          </div>
        </div>

        {/* Total Jobs */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Jobs</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {jobsLoading ? '-' : totalCount}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-orange-500/10">
              <Zap className="w-[18px] h-[18px] text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-3 space-y-1">
            <Link
              to="/jobs/new?type=ECU"
              className="flex items-center gap-3 px-3 py-3 rounded-lg bg-red-600 text-white transition-colors group"
            >
              <Cpu className="w-[18px] h-[18px]" />
              <span className="flex-1 text-sm font-medium">ECU Stage</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/jobs/new?type=TCU"
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors group"
            >
              <Settings className="w-[18px] h-[18px] text-neutral-400" />
              <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-white">TCU Stage</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-red-500 transition-colors" />
            </Link>
            <Link
              to="/jobs"
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors group"
            >
              <Activity className="w-[18px] h-[18px] text-neutral-400" />
              <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-white">View All Jobs</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-red-500 transition-colors" />
            </Link>
            <Link
              to="/credits"
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors group"
            >
              <Wallet className="w-[18px] h-[18px] text-neutral-400" />
              <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-white">Top Up Balance</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-red-500 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Recent Jobs</h2>
            <Link
              to="/jobs"
              className="text-xs text-red-600 dark:text-red-500 hover:text-red-700 font-medium"
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
                Create your first job
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate font-mono">
                        {job.referenceNumber}
                      </p>
                      <Badge status={job.status} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">
                      {[job.brand, job.model].filter(Boolean).join(' ') || job.jobType + ' Job'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">
                      {formatDate(job.createdAt)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-700 group-hover:text-red-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
