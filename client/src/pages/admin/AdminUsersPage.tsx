import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminUsers, adjustCredits } from '../../hooks/useApi';
import { formatDate, formatCurrency, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import type { User } from '../../types';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const { users, loading, refetch } = useAdminUsers(search);
  const [creditModal, setCreditModal] = useState<{ userId: string; name: string; balance: number } | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [adjusting, setAdjusting] = useState(false);

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

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Manage platform users" />

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input className="input pl-10" placeholder="Search by name, email, company..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <Spinner /> : !users?.length ? (
        <EmptyState icon={Users} title="No users found" description="No users match your search" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-500">Email</th>
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
                      <Link to={`/admin/users/${u.id}`} className="text-neutral-900 dark:text-white hover:underline font-medium">
                        {u.contactName || '-'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{u.email}</td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{u.companyName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded',
                        u.role === 'SUPERADMIN' ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300' :
                        u.role === 'ADMIN' ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300' :
                        'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300')}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{Number(u.creditBalance).toFixed(0)}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setCreditModal({ userId: u.id, name: u.contactName || u.email, balance: Number(u.creditBalance) })}
                        className="text-xs btn-secondary py-1 px-2">
                        <CreditCard size={14} /> Credits
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
