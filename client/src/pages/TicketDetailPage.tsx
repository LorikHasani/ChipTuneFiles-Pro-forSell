import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTicket, useTicketMessages, sendTicketMessage, markTicketMessagesRead } from '../hooks/useApi';
import { formatRelativeTime, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { ticket, loading } = useTicket(id!);
  const { messages, refetch: refetchMessages } = useTicketMessages(id!);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(refetchMessages, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (id && messages?.length) markTicketMessagesRead(id).catch(() => {});
  }, [messages?.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendTicketMessage(id!, newMessage);
      setNewMessage('');
      refetchMessages();
    } catch (err: any) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!ticket) return <p className="text-center text-neutral-500 py-12">Ticket not found</p>;

  const getSenderLabel = (msg: any) => {
    const isMe = msg.senderId === user?.id;
    if (isMe) return user?.contactName || user?.email || 'You';
    const role = msg.sender?.role;
    if (role === 'ADMIN' || role === 'SUPERADMIN') return 'admin';
    return msg.sender?.contactName || msg.sender?.email || 'User';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
        <ArrowLeft size={16} /> Back to tickets
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{ticket.subject}</h1>
        <Badge status={ticket.status} />
      </div>
      <p className="text-sm text-neutral-500">Created {formatRelativeTime(ticket.createdAt)}</p>

      {/* Conversation */}
      <div className="card">
        <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <MessageSquare size={16} className="text-neutral-500" />
          <h2 className="font-semibold text-neutral-900 dark:text-white">Conversation</h2>
        </div>
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {(messages || []).map((msg: any) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] rounded-xl px-4 py-3',
                  isMe ? 'bg-red-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800')}>
                  <p className={cn('text-xs font-medium mb-1', isMe ? 'text-red-200' : 'text-neutral-500 dark:text-neutral-400')}>
                    {getSenderLabel(msg)}
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

        {/* Send */}
        {ticket.status !== 'CLOSED' ? (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Type a reply..." value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
              <button onClick={handleSend} disabled={sending || !newMessage.trim()} className="btn-primary px-4">
                {sending ? <Spinner size="sm" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
            <p className="text-sm text-neutral-500">This ticket has been closed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
