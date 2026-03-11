import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, CreditCard, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminUser, updateUser, adjustCredits, deleteUser } from '../../hooks/useApi';
import { formatDate, formatDateTime, formatCurrency, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: userData, loading, refetch } = useAdminUser(id!);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (userData) {
      setForm({
        contactName: userData.contactName || '',
        companyName: userData.companyName || '',
        phone: userData.phone || '',
        country: userData.country || '',
        role: userData.role,
        isActive: userData.isActive,
      });
    }
  }, [userData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(id!, form);
      toast.success('User updated');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (!creditAmount) return;
    setAdjusting(true);
    try {
      await adjustCredits(id!, parseFloat(creditAmount), creditDesc || 'Admin adjustment');
      toast.success('Credits adjusted');
      setCreditAmount('');
      setCreditDesc('');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setAdjusting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(id!);
      toast.success('User deactivated');
      refetch();
      setShowDelete(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!userData) return <p className="text-center text-gray-500 py-12">User not found</p>;

  return (
    <div className="space-y-6">
      <PageHeader title={userData.contactName || userData.email} subtitle={userData.email}>
        <button onClick={() => setShowDelete(true)} className="btn-danger"><Trash2 size={16} /> Deactivate</button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Edit form */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Edit User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Contact Name</label>
                <input className="input" value={form.contactName || ''}
                  onChange={e => setForm((f: any) => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Company</label>
                <input className="input" value={form.companyName || ''}
                  onChange={e => setForm((f: any) => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone || ''}
                  onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Country</label>
                <input className="input" value={form.country || ''}
                  onChange={e => setForm((f: any) => ({ ...f, country: e.target.value }))} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role || 'CLIENT'}
                  onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))}>
                  <option value="CLIENT">Client</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive ?? true}
                    onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active Account</span>
                </label>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Spinner size="sm" /> : <Save size={16} />} Save Changes
            </button>
          </div>

          {/* Recent jobs */}
          {(userData as any).recentJobs?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Jobs</h3>
              <div className="space-y-2">
                {(userData as any).recentJobs.map((j: any) => (
                  <Link key={j.id} to={`/admin/jobs/${j.id}`}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <div>
                      <span className="text-primary-600 font-medium text-sm">{j.referenceNumber}</span>
                      <span className="text-gray-500 text-sm ml-2">{[j.brand, j.model].filter(Boolean).join(' ')}</span>
                    </div>
                    <Badge status={j.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          {(userData as any).recentTransactions?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Transactions</h3>
              <div className="space-y-2 text-sm">
                {(userData as any).recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex justify-between py-1">
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">{tx.description || tx.type}</span>
                      <span className="text-gray-400 text-xs ml-2">{formatDateTime(tx.createdAt)}</span>
                    </div>
                    <span className={cn('font-medium', tx.type === 'JOB_PAYMENT' ? 'text-red-600' : 'text-green-600')}>
                      {tx.type === 'JOB_PAYMENT' ? '-' : '+'}{Math.abs(Number(tx.amount)).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="card p-4 text-sm space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <User size={24} className="text-primary-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{userData.contactName || '-'}</p>
                <p className="text-gray-500 text-xs">{userData.role}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{userData.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Credits</span><span className="font-bold">{Number(userData.creditBalance).toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Joined</span><span>{formatDate(userData.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className={userData.isActive ? 'text-green-600' : 'text-red-600'}>{userData.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>

          {/* Credit adjustment */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><CreditCard size={16} /> Adjust Credits</h3>
            <div className="space-y-3">
              <input className="input" type="number" placeholder="Amount (+/-)" value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)} />
              <input className="input" placeholder="Description" value={creditDesc}
                onChange={e => setCreditDesc(e.target.value)} />
              <button onClick={handleAdjust} disabled={adjusting || !creditAmount} className="btn-primary w-full">
                {adjusting ? <Spinner size="sm" /> : null} Adjust Credits
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Deactivate User" message="This will deactivate the user account. They will not be able to log in."
        confirmText="Deactivate" variant="danger" />
    </div>
  );
}
