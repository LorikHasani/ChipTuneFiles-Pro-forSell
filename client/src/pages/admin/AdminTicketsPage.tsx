import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const { tickets, loading } = useTickets(filter === 'ALL' ? undefined : filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" subtitle="Manage all customer support tickets" />

      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium',
              filter === tab ? 'bg-primary-600 text-white' :
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200')}>
            {tab === 'ALL' ? 'All' : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : !tickets?.length ? (
        <EmptyState icon={LifeBuoy} title="No tickets" description="No support tickets match the current filter" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Messages</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tickets.map((t: Ticket) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <Link to={`/admin/tickets/${t.id}`} className="text-primary-600 hover:underline font-medium">{t.subject}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.client?.contactName || t.client?.email || '-'}</td>
                  <td className="px-4 py-3"><Badge status={t.status} /></td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="flex items-center gap-1"><MessageSquare size={14} /> {t._count?.messages || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatRelativeTime(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
