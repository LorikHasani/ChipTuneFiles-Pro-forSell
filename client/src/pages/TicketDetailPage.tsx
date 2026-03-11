import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTicket, useTicketMessages, sendTicketMessage, markTicketMessagesRead } from '../hooks/useApi';
import { formatDateTime, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import PageHeader from '../components/PageHeader';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { ticket, loading } = useTicket(id!);
  const { messages, refetch: refetchMessages } = useTicketMessages(id!);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Poll messages
  useEffect(() => {
    const interval = setInterval(refetchMessages, 10000);
    return () => clearInterval(interval);
  }, [id]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read
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
  if (!ticket) return <p className="text-center text-gray-500 py-12">Ticket not found</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title={ticket.subject}>
        <Badge status={ticket.status} />
      </PageHeader>

      {/* Messages */}
      <div className="card">
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {(messages || []).map((msg: any) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] rounded-xl px-4 py-3',
                  isMe ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700')}>
                  <p className={cn('text-xs font-medium mb-1', isMe ? 'text-primary-200' : 'text-gray-500')}>
                    {msg.sender?.contactName || msg.sender?.email || 'User'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={cn('text-xs mt-1', isMe ? 'text-primary-200' : 'text-gray-400')}>
                    {formatDateTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Send */}
        {ticket.status !== 'CLOSED' && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Type a message..." value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
              <button onClick={handleSend} disabled={sending || !newMessage.trim()} className="btn-primary">
                {sending ? <Spinner size="sm" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
