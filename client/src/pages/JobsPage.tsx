import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Briefcase,
  Car,
  Calendar,
  ChevronRight,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useJobs } from '../hooks/useApi';
import { useBrandingStore } from '../stores/brandingStore';
import { formatDate, formatCredits, getStatusColor, getStatusLabel, cn } from '../lib/utils';
import type { JobStatus } from '../types';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

const STATUS_TABS: { label: string; value: JobStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Waiting for Info', value: 'WAITING_FOR_INFO' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Revision Requested', value: 'REVISION_REQUESTED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function JobsPage() {
  const navigate = useNavigate();
  const currencySymbol = useBrandingStore((s) => s.branding.currency_symbol);
  const [activeStatus, setActiveStatus] = useState<JobStatus | undefined>(undefined);
  const { jobs, loading, error } = useJobs(activeStatus);

  return (
    <div>
      <PageHeader title="My Jobs" subtitle="View and manage your tuning jobs">
        <Link to="/jobs/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Job
        </Link>
      </PageHeader>

      {/* Status Tabs */}
      <div className="mb-6 -mx-1 overflow-x-auto">
        <div className="flex gap-1 min-w-max px-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveStatus(tab.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                activeStatus === tab.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && jobs && jobs.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={
            activeStatus
              ? `You don't have any jobs with status "${getStatusLabel(activeStatus)}".`
              : "You haven't created any jobs yet. Start by uploading your ECU/TCU file."
          }
          action={
            !activeStatus ? (
              <Link to="/jobs/new" className="btn-primary">
                <Plus className="w-4 h-4" />
                Create Your First Job
              </Link>
            ) : undefined
          }
        />
      )}

      {/* Jobs List */}
      {!loading && !error && jobs && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Reference & Status */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono font-semibold text-primary-600 dark:text-primary-400">
                      {job.referenceNumber}
                    </span>
                    <Badge status={job.status} />
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {job.jobType}
                    </span>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-base font-medium text-gray-900 dark:text-white truncate">
                      {job.brand && job.model
                        ? `${job.brand} ${job.model}${job.year ? ` (${job.year})` : ''}`
                        : 'Vehicle not specified'}
                    </span>
                  </div>

                  {/* Meta Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(job.createdAt)}
                    </span>
                    {job.services && job.services.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {job.services.length} service{job.services.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {job.totalPrice > 0 && (
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formatCredits(job.totalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
