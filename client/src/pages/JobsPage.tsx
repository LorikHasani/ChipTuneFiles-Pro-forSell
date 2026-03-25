import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Briefcase,
  Car,
  Calendar,
  ChevronRight,
  Layers,
  AlertCircle,
  Search,
  X,
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
  const [searchQuery, setSearchQuery] = useState('');
  const { jobs, loading, error } = useJobs(activeStatus);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    if (!searchQuery.trim()) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(job =>
      job.referenceNumber?.toLowerCase().includes(q) ||
      job.brand?.toLowerCase().includes(q) ||
      job.model?.toLowerCase().includes(q) ||
      job.engineType?.toLowerCase().includes(q) ||
      job.ecuType?.toLowerCase().includes(q) ||
      job.jobType?.toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  const statusCounts = useMemo(() => {
    if (!jobs) return {};
    const counts: Record<string, number> = { ALL: jobs.length };
    jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
    return counts;
  }, [jobs]);

  return (
    <div>
      <PageHeader title="My Jobs" subtitle="View and manage your tuning jobs">
        <Link to="/jobs/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Job
        </Link>
      </PageHeader>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          className="input pl-9 pr-9 w-full"
          placeholder="Search by reference, brand, model, engine..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="mb-6 -mx-1 overflow-x-auto">
        <div className="flex gap-1 min-w-max px-1">
          {STATUS_TABS.map((tab) => {
            const count = tab.value ? statusCounts[tab.value] : statusCounts.ALL;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveStatus(tab.value)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5',
                  activeStatus === tab.value
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full',
                    activeStatus === tab.value ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl">
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
      {!loading && !error && filteredJobs.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title={searchQuery ? 'No matching jobs' : 'No jobs found'}
          description={
            searchQuery
              ? `No jobs match "${searchQuery}". Try a different search term.`
              : activeStatus
              ? `You don't have any jobs with status "${getStatusLabel(activeStatus)}".`
              : "You haven't created any jobs yet. Start by uploading your ECU/TCU file."
          }
          action={
            searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="btn-secondary">
                <X className="w-4 h-4" /> Clear Search
              </button>
            ) : !activeStatus ? (
              <Link to="/jobs/new" className="btn-primary">
                <Plus className="w-4 h-4" />
                Create Your First Job
              </Link>
            ) : undefined
          }
        />
      )}

      {/* Jobs List */}
      {!loading && !error && filteredJobs.length > 0 && (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <button
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="w-full text-left bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Reference & Status */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono font-semibold text-neutral-900 dark:text-white">
                      {job.referenceNumber}
                    </span>
                    <Badge status={job.status} />
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-300">
                      {job.jobType}
                    </span>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="text-base font-medium text-neutral-900 dark:text-white truncate">
                      {job.brand && job.model
                        ? `${job.brand} ${job.model}${job.year ? ` (${job.year})` : ''}`
                        : 'Vehicle not specified'}
                    </span>
                  </div>

                  {/* Meta Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
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
                      <span className="font-medium text-neutral-600 dark:text-neutral-300">
                        {formatCredits(job.totalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
