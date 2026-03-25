import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminCreditPackages, createCreditPackage, updateCreditPackage, deleteCreditPackage } from '../../hooks/useApi';
import { formatCurrency } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { CreditPackage } from '../../types';

export default function AdminPackagesPage() {
  const { packages, loading, refetch } = useAdminCreditPackages();
  const [modal, setModal] = useState<Partial<CreditPackage> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CreditPackage | null>(null);

  const activeCount = (packages || []).filter((p: CreditPackage) => p.isActive).length;

  const handleSave = async () => {
    if (!modal?.name || !modal?.credits || !modal?.price) return;
    setSaving(true);
    try {
      if (modal.id) {
        await updateCreditPackage(modal.id, modal);
      } else {
        await createCreditPackage(modal);
      }
      toast.success('Package saved');
      setModal(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const toggleActive = async (pkg: CreditPackage) => {
    try {
      await updateCreditPackage(pkg.id, { isActive: !pkg.isActive });
      refetch();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCreditPackage(deleteTarget.id);
      toast.success('Package deactivated');
      setDeleteTarget(null);
      refetch();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {(packages || []).length} packages ({activeCount} active)
        </p>
        <button
          onClick={() => setModal({ name: '', credits: 0, price: 0, bonusCredits: 0, sortOrder: 0, isActive: true })}
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Package
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-500">Name</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-500">Credits</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-500">Price</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-500">Per Unit</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-500">Order</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-500">Active</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {(packages || []).map((pkg: CreditPackage) => {
                const perUnit = pkg.credits > 0 ? pkg.price / pkg.credits : 0;
                return (
                  <tr key={pkg.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{pkg.name}</td>
                    <td className="px-4 py-3 text-center text-neutral-900 dark:text-white">{pkg.credits}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-500">{formatCurrency(pkg.price)}</td>
                    <td className="px-4 py-3 text-center text-neutral-500 dark:text-neutral-400">{formatCurrency(perUnit)}</td>
                    <td className="px-4 py-3 text-center text-neutral-500 dark:text-neutral-400">{pkg.sortOrder}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(pkg)} className="inline-flex">
                        {pkg.isActive ? (
                          <ToggleRight size={24} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={24} className="text-neutral-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setModal(pkg)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeleteTarget(pkg)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Package' : 'New Package'} size="sm">
        {modal && (
          <div className="space-y-4">
            <div><label className="label">Name</label><input className="input" value={modal.name || ''}
              onChange={e => setModal(m => m ? { ...m, name: e.target.value } : m)} placeholder="e.g. Starter Pack" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Credits</label><input className="input" type="number" value={modal.credits ?? ''}
                onChange={e => setModal(m => m ? { ...m, credits: parseFloat(e.target.value) || 0 } : m)} /></div>
              <div><label className="label">Price (EUR)</label><input className="input" type="number" value={modal.price ?? ''}
                onChange={e => setModal(m => m ? { ...m, price: parseFloat(e.target.value) || 0 } : m)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Bonus Credits</label><input className="input" type="number" value={modal.bonusCredits ?? 0}
                onChange={e => setModal(m => m ? { ...m, bonusCredits: parseFloat(e.target.value) || 0 } : m)} /></div>
              <div><label className="label">Sort Order</label><input className="input" type="number" value={modal.sortOrder ?? 0}
                onChange={e => setModal(m => m ? { ...m, sortOrder: parseInt(e.target.value) || 0 } : m)} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Spinner size="sm" /> : null} Save
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Package"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"? This will make it unavailable for purchase.`}
      />
    </div>
  );
}
