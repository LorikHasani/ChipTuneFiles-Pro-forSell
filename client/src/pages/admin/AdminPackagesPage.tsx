import { useState } from 'react';
import { Plus, Edit2, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreditPackages, createCreditPackage, updateCreditPackage } from '../../hooks/useApi';
import { formatCurrency } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import type { CreditPackage } from '../../types';

export default function AdminPackagesPage() {
  const { packages, loading, refetch } = useCreditPackages();
  const [modal, setModal] = useState<Partial<CreditPackage> | null>(null);
  const [saving, setSaving] = useState(false);

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

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Credit Packages" subtitle="Manage credit purchase packages">
        <button onClick={() => setModal({ name: '', credits: 0, price: 0, bonusCredits: 0, sortOrder: 0, isActive: true })}
          className="btn-primary"><Plus size={16} /> New Package</button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(packages || []).map((pkg: CreditPackage) => (
          <div key={pkg.id} className="card p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">{pkg.name}</h3>
                <p className="text-sm text-neutral-500">{pkg.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(pkg)} className="text-neutral-400 hover:text-neutral-500">
                  {pkg.isActive ? <ToggleRight size={20} className="text-neutral-500" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => setModal(pkg)} className="text-neutral-400 hover:text-neutral-500"><Edit2 size={16} /></button>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Credits</span><span className="font-bold">{pkg.credits}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Bonus</span><span className="text-neutral-500">+{pkg.bonusCredits}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Price</span><span className="font-bold">{formatCurrency(pkg.price)}</span></div>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
