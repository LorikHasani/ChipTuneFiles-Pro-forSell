import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useTicket, useTicketMessages, sendTicketMessage, markTicketMessagesRead, updateTicketStatus } from '../../hooks/useApi';
import { formatDateTime, getStatusLabel, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import PageHeader from '../../components/PageHeader';
import type { TicketStatus } from '../../types';

const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

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

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      await updateTicketStatus(id!, status);
      toast.success(`Status changed to ${getStatusLabel(status)}`);
      refetch();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!ticket) return <p className="text-center text-neutral-500 py-12">Ticket not found</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title={ticket.subject}>
        <Badge status={ticket.status} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Status buttons */}
          <div className="flex gap-2 mb-4">
            {statuses.map(s => (
              <button key={s} onClick={() => handleStatusChange(s)} disabled={s === ticket.status}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border',
                  s === ticket.status ? 'bg-red-600 border-red-600 text-white' :
                  'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400')}>
                {getStatusLabel(s)}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="card">
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {(messages || []).map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[80%] rounded-xl px-4 py-3',
                      isMe ? 'bg-red-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800')}>
                      <p className={cn('text-xs font-medium mb-1', isMe ? 'text-neutral-300 dark:text-neutral-500' : 'text-neutral-500')}>
                        {msg.sender?.contactName || msg.sender?.email}
                        {msg.sender?.role !== 'CLIENT' && <span className="ml-1 text-xs">(Admin)</span>}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={cn('text-xs mt-1', isMe ? 'text-neutral-300 dark:text-neutral-500' : 'text-neutral-400')}>{formatDateTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Reply to ticket..." value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
                <button onClick={handleSend} disabled={sending} className="btn-primary">
                  {sending ? <Spinner size="sm" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Client info sidebar */}
        <div>
          <div className="card p-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2"><User size={16} /> Client</h3>
            <p className="font-medium text-sm">{ticket.client?.contactName || '-'}</p>
            <p className="text-sm text-neutral-500">{ticket.client?.email}</p>
            {ticket.client?.companyName && <p className="text-sm text-neutral-500">{ticket.client.companyName}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
