import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Plus, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTickets, createTicket } from '../hooks/useApi';
import { formatRelativeTime, getStatusColor, getStatusLabel, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import type { Ticket, TicketStatus } from '../types';

const statusTabs: (TicketStatus | 'ALL')[] = ['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'];

export default function TicketsPage() {
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const { tickets, loading, refetch } = useTickets(filter === 'ALL' ? undefined : filter);
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both fields');
      return;
    }
    setSubmitting(true);
    try {
      await createTicket(subject, message);
      toast.success('Ticket created');
      setShowModal(false);
      setSubject('');
      setMessage('');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Support Tickets" subtitle="Get help from our team">
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Ticket
        </button>
      </PageHeader>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusTabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === tab ? 'bg-neutral-900 dark:bg-white text-white dark:text-black' :
              'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200')}>
            {tab === 'ALL' ? 'All' : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {loading ? <Spinner /> : !tickets?.length ? (
        <EmptyState icon={LifeBuoy} title="No tickets" description="Create a ticket to get help from our support team"
          action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> New Ticket</button>} />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: Ticket) => (
            <Link key={ticket.id} to={`/tickets/${ticket.id}`}
              className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow block">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-neutral-900 dark:text-white truncate">{ticket.subject}</h3>
                  <Badge status={ticket.status} />
                </div>
                <p className="text-sm text-neutral-500">{formatRelativeTime(ticket.updatedAt)}</p>
              </div>
              {ticket._count && (
                <div className="flex items-center gap-1 text-neutral-400 ml-4">
                  <MessageSquare size={16} />
                  <span className="text-sm">{ticket._count.messages}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Support Ticket" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input className="input" placeholder="Brief description of your issue" value={subject}
              onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={5} placeholder="Describe your issue in detail..."
              value={message} onChange={e => setMessage(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={submitting} className="btn-primary">
              {submitting ? <Spinner size="sm" /> : null} Submit Ticket
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
