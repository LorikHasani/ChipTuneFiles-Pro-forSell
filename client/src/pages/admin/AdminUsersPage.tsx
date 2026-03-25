import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, CreditCard, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminUsers, adjustCredits, useDashboardStats } from '../../hooks/useApi';
import { formatCurrency, formatRelativeTime, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import type { User } from '../../types';

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

function getAvatarColor(name?: string, email?: string): string {
  const str = name || email || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    'bg-red-600', 'bg-blue-600', 'bg-green-600', 'bg-purple-600',
    'bg-pink-600', 'bg-orange-600', 'bg-teal-600', 'bg-indigo-600',
  ];
  return colors[Math.abs(hash) % colors.length];
}

function getRoleBadge(role: string) {
  const styles: Record<string, string> = {
    CLIENT: 'bg-green-500/10 text-green-500',
    ADMIN: 'bg-blue-500/10 text-blue-500',
    SUPERADMIN: 'bg-purple-500/10 text-purple-500',
  };
  const labels: Record<string, string> = {
    CLIENT: 'client',
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded', styles[role] || 'bg-neutral-500/10 text-neutral-500')}>
      {labels[role] || role}
    </span>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const { users, loading, refetch } = useAdminUsers(search);
  const { stats } = useDashboardStats();
  const [creditModal, setCreditModal] = useState<{ userId: string; name: string; balance: number } | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const totalBalance = (users || []).reduce((sum: number, u: any) => sum + Number(u.creditBalance || 0), 0);

  const handleAdjust = async () => {
    if (!creditModal || !creditAmount) return;
    setAdjusting(true);
    try {
      await adjustCredits(creditModal.userId, parseFloat(creditAmount), creditDesc || 'Admin adjustment');
      toast.success('Credits adjusted');
      setCreditModal(null);
      setCreditAmount('');
      setCreditDesc('');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to adjust');
    } finally {
      setAdjusting(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? (users || []).length, color: 'text-purple-500' },
    { label: 'Clients', value: stats?.totalClients ?? 0, color: 'text-green-500' },
    { label: 'Admins', value: stats?.totalAdmins ?? 0, color: 'text-blue-500' },
    { label: 'Total Balance', value: formatCurrency(totalBalance), color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-full">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input className="input pl-10 w-full" placeholder="Search by name, email, company..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <Spinner /> : !users?.length ? (
        <EmptyState icon={Users} title="No users found" description="No users match your search" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Balance</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Joined</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', getAvatarColor(u.contactName, u.email))}>
                          {getInitials(u.contactName, u.email)}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/admin/users/${u.id}`} className="text-neutral-900 dark:text-white hover:underline font-medium block truncate">
                            {u.contactName || '-'}
                          </Link>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{u.companyName || '-'}</td>
                    <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                    <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white">{formatCurrency(Number(u.creditBalance))}</td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1 text-xs">
                        <Calendar size={13} className="text-neutral-400" />
                        {formatRelativeTime(u.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setCreditModal({ userId: u.id, name: u.contactName || u.email, balance: Number(u.creditBalance) })}
                        className="text-xs btn-secondary py-1.5 px-3 flex items-center gap-1.5">
                        <CreditCard size={14} /> Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credit adjustment modal */}
      <Modal isOpen={!!creditModal} onClose={() => setCreditModal(null)} title="Adjust Credits" size="sm">
        {creditModal && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Adjusting credits for <strong>{creditModal.name}</strong>
            </p>
            <p className="text-sm">Current balance: <strong>{Number(creditModal.balance).toFixed(0)}</strong> credits</p>
            <div>
              <label className="label">Amount (+ to add, - to deduct)</label>
              <input className="input" type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                placeholder="e.g. 50 or -20" />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={creditDesc} onChange={e => setCreditDesc(e.target.value)}
                placeholder="Reason for adjustment" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCreditModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleAdjust} disabled={adjusting || !creditAmount} className="btn-primary">
                {adjusting ? <Spinner size="sm" /> : null} Adjust
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
