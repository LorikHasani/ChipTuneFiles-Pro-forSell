import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, MessageSquare } from 'lucide-react';
import { useTickets } from '../../hooks/useApi';
import { formatRelativeTime, getStatusLabel, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import type { Ticket, TicketStatus } from '../../types';

const tabs: (TicketStatus | 'ALL')[] = ['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'];

export default function AdminTicketsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const { tickets, loading } = useTickets(filter === 'ALL' ? undefined : filter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium',
              filter === tab ? 'bg-red-600 text-white' :
              'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100')}>
            {tab === 'ALL' ? 'All' : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : !tickets?.length ? (
        <EmptyState icon={LifeBuoy} title="No tickets" description="No support tickets match the current filter" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-500">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500">Client</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500">Messages</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {tickets.map((t: Ticket) => (
                <tr key={t.id} onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  className="hover:bg-neutral-50 dark:hover:bg-white/[0.03] cursor-pointer">
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{t.subject}</td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{t.client?.contactName || t.client?.email || '-'}</td>
                  <td className="px-4 py-3"><Badge status={t.status} /></td>
                  <td className="px-4 py-3 text-neutral-500">
                    <span className="flex items-center gap-1"><MessageSquare size={14} /> {t._count?.messages || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatRelativeTime(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
