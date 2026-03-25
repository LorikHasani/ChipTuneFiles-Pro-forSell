import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../hooks/useApi';
import { formatRelativeTime, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import type { Notification } from '../types';

function getNotificationLink(n: Notification): string | null {
  if (!n.linkType || !n.linkId) return null;
  switch (n.linkType) {
    case 'JOB': return `/jobs/${n.linkId}`;
    case 'TICKET': return `/tickets/${n.linkId}`;
    case 'CREDIT': return '/credits';
    default: return null;
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, loading, refetch } = useNotifications();
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      refetch();
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      markNotificationRead(n.id).catch(() => {});
    }
    const link = getNotificationLink(n);
    if (link) {
      navigate(link);
    } else {
      refetch();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      refetch();
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-neutral-500" />
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-neutral-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={markingAll}
            className="btn-secondary text-sm flex items-center gap-1.5">
            {markingAll ? <Spinner size="sm" /> : <CheckCheck size={14} />}
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !notifications?.length ? (
        <div className="card py-16 text-center">
          <Bell size={32} className="text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No notifications yet</p>
        </div>
      ) : (
        <div className="card divide-y divide-neutral-100 dark:divide-neutral-800">
          {notifications.map((n) => {
            const link = getNotificationLink(n);
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  'flex items-start gap-3 px-5 py-4 transition-colors cursor-pointer group',
                  !n.isRead
                    ? 'bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                    : 'hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
                )}
              >
                {/* Unread dot */}
                <div className="pt-1.5 flex-shrink-0">
                  <div className={cn('w-2 h-2 rounded-full', !n.isRead ? 'bg-blue-500' : 'bg-transparent')} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium',
                    !n.isRead ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
                  )}>
                    {n.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-neutral-400">{formatRelativeTime(n.createdAt)}</span>
                    {link && (
                      <span className="text-xs text-blue-500 flex items-center gap-0.5">
                        View <ExternalLink size={10} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
