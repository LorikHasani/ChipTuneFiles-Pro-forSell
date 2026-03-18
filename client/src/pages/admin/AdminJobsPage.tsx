import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Search } from 'lucide-react';
import { useJobs } from '../../hooks/useApi';
import { formatDate, getStatusLabel, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import type { Job, JobStatus } from '../../types';

const tabs: (JobStatus | 'ALL')[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'WAITING_FOR_INFO', 'COMPLETED', 'REVISION_REQUESTED', 'REJECTED'];

export default function AdminJobsPage() {
  const [filter, setFilter] = useState<JobStatus | 'ALL'>('ALL');
  const { jobs, loading } = useJobs(filter === 'ALL' ? undefined : filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Jobs" subtitle="View and manage all tuning jobs" />

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === tab ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' :
              'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100')}>
            {tab === 'ALL' ? 'All' : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : !jobs?.length ? (
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
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {jobs.map((job: Job) => (
                  <tr key={job.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link to={`/admin/jobs/${job.id}`} className="text-neutral-900 dark:text-white hover:underline font-medium">
                        {job.referenceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {job.client?.contactName || job.client?.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {[job.brand, job.model, job.year].filter(Boolean).join(' ') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">{job.jobType}</span>
                    </td>
                    <td className="px-4 py-3"><Badge status={job.status} /></td>
                    <td className="px-4 py-3 font-medium">{job.totalPrice}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(job.createdAt)}</td>
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
