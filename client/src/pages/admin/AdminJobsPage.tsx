import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Search, Clock, ArrowRight, Eye } from 'lucide-react';
import { useJobs, useDashboardStats } from '../../hooks/useApi';
import { formatCurrency, formatDate, getStatusLabel, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import type { Job, JobStatus } from '../../types';

const tabs: (JobStatus | 'ALL')[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'WAITING_FOR_INFO', 'COMPLETED', 'REVISION_REQUESTED', 'REJECTED'];

const tabLabels: Record<string, string> = {
  ALL: 'All Jobs',
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_INFO: 'Waiting for Info',
  COMPLETED: 'Completed',
  REVISION_REQUESTED: 'Revision',
  REJECTED: 'Rejected',
};

export default function AdminJobsPage() {
  const [filter, setFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const { jobs, loading } = useJobs(filter === 'ALL' ? undefined : filter);
  const { stats } = useDashboardStats();

  const filteredJobs = useMemo(() => {
    if (!jobs || !search.trim()) return jobs;
    const term = search.toLowerCase();
    return jobs.filter((job: Job) =>
      (job.referenceNumber?.toLowerCase().includes(term)) ||
      (job.brand?.toLowerCase().includes(term)) ||
      (job.model?.toLowerCase().includes(term)) ||
      (job.client?.contactName?.toLowerCase().includes(term)) ||
      (job.client?.email?.toLowerCase().includes(term))
    );
  }, [jobs, search]);

  const statusCounts = [
    { label: 'Pending', count: stats?.pendingJobs ?? 0, color: 'text-purple-500' },
    { label: 'In Progress', count: stats?.inProgressJobs ?? 0, color: 'text-blue-500' },
    { label: 'Revisions', count: 0, color: 'text-red-500' },
    { label: 'Completed', count: stats?.completedJobs ?? 0, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Status Count Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statusCounts.map((s) => (
          <div key={s.label} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
            <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="input pl-9 py-2 text-sm w-56"
            placeholder="Search by ref, vehicle, c..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === tab ? 'bg-red-600 text-white' :
                'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700')}>
              {tabLabels[tab] || getStatusLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : !filteredJobs?.length ? (
        <EmptyState icon={FolderOpen} title="No jobs found" description="No jobs match the current filter" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Reference</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Vehicle</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredJobs.map((job: Job) => (
                  <tr key={job.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link to={`/admin/jobs/${job.id}`} className="text-red-600 dark:text-red-500 hover:underline font-medium font-mono text-xs">
                        {job.referenceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-neutral-900 dark:text-white font-medium">{job.client?.contactName || '-'}</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">{job.client?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-neutral-900 dark:text-white font-medium">
                        {[job.brand, job.model].filter(Boolean).join(' ') || '-'}
                      </p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        {[job.year, job.engineType, job.powerHp ? `${job.powerHp}hp` : null].filter(Boolean).join(' • ')}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(job.totalPrice || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-neutral-400" />
                        {formatDate(job.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/jobs/${job.id}`} className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-red-600 flex items-center gap-1 font-medium">
                        View <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
