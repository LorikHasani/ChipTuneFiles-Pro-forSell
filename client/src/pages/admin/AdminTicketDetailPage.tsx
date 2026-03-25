import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowLeft, User, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useTicket, useTicketMessages, sendTicketMessage, markTicketMessagesRead, updateTicketStatus } from '../../hooks/useApi';
import { formatRelativeTime, formatDate, formatCurrency, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import type { TicketStatus } from '../../types';

const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { ticket, loading, refetch } = useTicket(id!);
  const { messages, refetch: refetchMsgs } = useTicketMessages(id!);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(refetchMsgs, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (id) markTicketMessagesRead(id).catch(() => {}); }, [messages?.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendTicketMessage(id!, newMessage);
      setNewMessage('');
      refetchMsgs();
    } catch { toast.error('Failed'); }
    finally { setSending(false); }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as TicketStatus;
    try {
      await updateTicketStatus(id!, status);
      toast.success(`Status updated`);
      refetch();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!ticket) return <p className="text-center text-neutral-500 py-12">Ticket not found</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Back link */}
      <Link to="/admin/tickets" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
        <ArrowLeft size={16} /> Back to tickets
      </Link>

      {/* Title + Status */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{ticket.subject}</h1>
            <Badge status={ticket.status} />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Created {formatRelativeTime(ticket.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Status:</span>
          <select
            value={ticket.status}
            onChange={handleStatusChange}
            className="input py-1.5 px-3 text-sm"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s === 'OPEN' ? 'Open' : s === 'IN_PROGRESS' ? 'In Progress' : 'Closed'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
              <MessageSquare size={16} className="text-neutral-500" />
              <h2 className="font-semibold text-neutral-900 dark:text-white">Conversation</h2>
            </div>
            <div className="p-4 space-y-4 max-h-[450px] overflow-y-auto">
              {(messages || []).map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[80%] rounded-xl px-4 py-3',
                      isMe ? 'bg-red-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800')}>
                      <p className={cn('text-xs font-medium mb-1', isMe ? 'text-red-200' : 'text-neutral-500 dark:text-neutral-400')}>
                        {msg.sender?.contactName || msg.sender?.email || 'User'}
                        {msg.sender?.role && msg.sender.role !== 'CLIENT' && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">admin</span>
                        )}
                      </p>
                      <p className="text-sm whitespace-pre-wrap font-medium">{msg.message}</p>
                      <p className={cn('text-xs mt-1.5', isMe ? 'text-red-200' : 'text-neutral-400 dark:text-neutral-500')}>
                        {formatRelativeTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Type a reply..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                <button onClick={handleSend} disabled={sending} className="btn-primary px-4">
                  {sending ? <Spinner size="sm" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info sidebar */}
        <div>
          <div className="card p-5">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={16} /> Client Info
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {getInitials(ticket.client?.contactName || undefined, ticket.client?.email)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900 dark:text-white">{ticket.client?.contactName || '-'}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{ticket.client?.email}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-neutral-500 dark:text-neutral-400">Balance</p>
                <p className="font-bold text-neutral-900 dark:text-white">{formatCurrency(Number(ticket.client?.creditBalance ?? 0))}</p>
              </div>
              <div>
                <p className="text-neutral-500 dark:text-neutral-400">Joined</p>
                <p className="font-bold text-neutral-900 dark:text-white">{ticket.client?.createdAt ? formatDate(ticket.client.createdAt) : '-'}</p>
              </div>
              {ticket.client?.id && (
                <Link to={`/admin/users/${ticket.client.id}`} className="text-sm text-red-600 dark:text-red-500 hover:underline font-medium">
                  View Full Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
