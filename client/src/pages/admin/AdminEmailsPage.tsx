import { useState, useMemo } from 'react';
import { Search, Send, Users, Mail, CheckSquare, Square } from 'lucide-react';
import { useAdminUsers } from '../../hooks/useApi';
import { sendBulkEmail } from '../../hooks/useApi';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import { cn } from '../../lib/utils';
import type { User } from '../../types';

type ColorTheme = 'blue' | 'red';

export default function AdminEmailsPage() {
  const { users, loading } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('blue');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  // Only show CLIENT users
  const clients = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => u.role === 'CLIENT' && u.isActive !== false);
  }, [users]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const term = search.toLowerCase();
    return clients.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        (u.contactName && u.contactName.toLowerCase().includes(term)) ||
        (u.companyName && u.companyName.toLowerCase().includes(term))
    );
  }, [clients, search]);

  const allSelected = filtered.length > 0 && filtered.every((u) => selectedIds.has(u.id));

  const toggleAll = () => {
    if (allSelected) {
      const newSet = new Set(selectedIds);
      filtered.forEach((u) => newSet.delete(u.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      filtered.forEach((u) => newSet.add(u.id));
      setSelectedIds(newSet);
    }
  };

  const toggleUser = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSend = async () => {
    if (selectedIds.size === 0 || !subject.trim() || !message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendBulkEmail({
        recipientIds: Array.from(selectedIds),
        subject: subject.trim(),
        message: message.trim(),
        colorTheme,
      });
      setResult({ success: res.success, failed: res.failed });
      if (res.failed === 0) {
        setSubject('');
        setMessage('');
        setSelectedIds(new Set());
      }
    } catch (err: any) {
      setResult({ success: 0, failed: selectedIds.size });
    } finally {
      setSending(false);
    }
  };

  const getInitials = (user: User) => {
    if (user.contactName) {
      const parts = user.contactName.split(' ');
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Send Email" subtitle="Compose and send emails to your clients" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Select Recipients */}
        <div className="card p-0 flex flex-col" style={{ maxHeight: '70vh' }}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Select Recipients
              </h3>
              <span className="ml-auto text-xs text-gray-500">
                {selectedIds.size} selected
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9"
              />
            </div>
          </div>

          {/* Select All */}
          <div
            className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
            onClick={toggleAll}
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-primary-500 flex-shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select All ({filtered.length})
            </span>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No clients found.</p>
            ) : (
              filtered.map((user) => {
                const selected = selectedIds.has(user.id);
                return (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 transition-colors',
                      selected
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    )}
                    onClick={() => toggleUser(user.id)}
                  >
                    {selected ? (
                      <CheckSquare className="h-4 w-4 text-primary-500 flex-shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-semibold flex-shrink-0">
                      {getInitials(user)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.contactName || user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.companyName && (
                        <p className="text-xs text-gray-400 truncate">{user.companyName}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Compose Email */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Compose Email</h3>
          </div>

          {/* To field */}
          <div>
            <label className="label">To</label>
            <div className="input bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-400">
              {selectedIds.size === 0
                ? 'No recipients selected'
                : `${selectedIds.size} client${selectedIds.size !== 1 ? 's' : ''} selected`}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="label">Subject</label>
            <input
              type="text"
              placeholder="Enter email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
            />
          </div>

          {/* Message */}
          <div>
            <label className="label">Message</label>
            <textarea
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="input resize-none"
            />
          </div>

          {/* Color Theme */}
          <div>
            <label className="label">Email Color Theme</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setColorTheme('blue')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                  colorTheme === 'blue'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-600'
                    : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                Blue
              </button>
              <button
                type="button"
                onClick={() => setColorTheme('red')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                  colorTheme === 'red'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600'
                    : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <span className="w-3 h-3 rounded-full bg-red-500" />
                Red
              </button>
            </div>
          </div>

          {/* Result message */}
          {result && (
            <div
              className={cn(
                'p-3 rounded-lg text-sm',
                result.failed === 0
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              )}
            >
              {result.failed === 0
                ? `Successfully sent to ${result.success} client${result.success !== 1 ? 's' : ''}.`
                : `Sent: ${result.success}, Failed: ${result.failed}`}
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || selectedIds.size === 0 || !subject.trim() || !message.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Spinner size="sm" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {selectedIds.size} Client{selectedIds.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
