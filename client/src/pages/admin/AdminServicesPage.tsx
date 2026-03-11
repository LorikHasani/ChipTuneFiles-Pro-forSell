import { useState } from 'react';
import { Plus, Edit2, Wrench, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAllServices, createCategory, updateCategory, createService, updateService } from '../../hooks/useApi';
import { formatCurrency, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import type { ServiceCategory, Service, JobType } from '../../types';

export default function AdminServicesPage() {
  const { categories, loading, refetch } = useAllServices();
  const [activeTab, setActiveTab] = useState<JobType>('ECU');
  const [catModal, setCatModal] = useState<Partial<ServiceCategory> | null>(null);
  const [svcModal, setSvcModal] = useState<(Partial<Service> & { categoryId?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = (categories || []).filter((c: ServiceCategory) => c.jobType === activeTab);

  const handleSaveCat = async () => {
    if (!catModal?.name) return;
    setSaving(true);
    try {
      if (catModal.id) {
        await updateCategory(catModal.id, catModal);
      } else {
        await createCategory({ ...catModal, jobType: activeTab } as any);
      }
      toast.success('Category saved');
      setCatModal(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleSaveSvc = async () => {
    if (!svcModal?.name || !svcModal?.code || !svcModal?.categoryId) return;
    setSaving(true);
    try {
      if (svcModal.id) {
        await updateService(svcModal.id, svcModal);
      } else {
        await createService(svcModal as any);
      }
      toast.success('Service saved');
      setSvcModal(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const toggleService = async (svc: Service) => {
    try {
      await updateService(svc.id, { isActive: !svc.isActive });
      refetch();
    } catch { toast.error('Failed to toggle'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Service Management" subtitle="Configure tuning services and categories">
        <button onClick={() => setCatModal({ name: '', selectionType: 'MULTIPLE', sortOrder: 0 })} className="btn-primary">
          <Plus size={16} /> New Category
        </button>
      </PageHeader>

      <div className="flex gap-2">
        {(['ECU', 'TCU'] as JobType[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('px-6 py-2 rounded-lg text-sm font-medium',
              activeTab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400')}>
            {t}
          </button>
        ))}
      </div>

      {filtered.map((cat: ServiceCategory) => (
        <div key={cat.id} className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
              <p className="text-xs text-gray-500">{cat.selectionType} selection &middot; {cat.isActive ? 'Active' : 'Inactive'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSvcModal({ categoryId: cat.id, code: '', name: '', basePrice: 0, sortOrder: 0 })}
                className="btn-secondary text-xs py-1 px-2"><Plus size={14} /> Service</button>
              <button onClick={() => setCatModal(cat)} className="btn-ghost text-xs py-1 px-2"><Edit2 size={14} /></button>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {(cat.services || []).map((svc: Service) => (
              <div key={svc.id} className="p-3 px-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleService(svc)} className="text-gray-400 hover:text-gray-600">
                    {svc.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                  </button>
                  <div>
                    <p className={cn('text-sm font-medium', !svc.isActive && 'text-gray-400 line-through')}>
                      {svc.name} <span className="text-gray-400 font-normal">({svc.code})</span>
                    </p>
                    {svc.description && <p className="text-xs text-gray-500 truncate max-w-md">{svc.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">{formatCurrency(svc.basePrice)}</span>
                  <button onClick={() => setSvcModal({ ...svc, categoryId: cat.id })} className="text-gray-400 hover:text-gray-600">
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Category modal */}
      <Modal isOpen={!!catModal} onClose={() => setCatModal(null)} title={catModal?.id ? 'Edit Category' : 'New Category'} size="md">
        {catModal && (
          <div className="space-y-4">
            <div><label className="label">Name</label><input className="input" value={catModal.name || ''}
              onChange={e => setCatModal(c => c ? { ...c, name: e.target.value } : c)} /></div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={catModal.description || ''}
              onChange={e => setCatModal(c => c ? { ...c, description: e.target.value } : c)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Selection Type</label>
                <select className="input" value={catModal.selectionType || 'MULTIPLE'}
                  onChange={e => setCatModal(c => c ? { ...c, selectionType: e.target.value as any } : c)}>
                  <option value="SINGLE">Single</option><option value="MULTIPLE">Multiple</option>
                </select></div>
              <div><label className="label">Sort Order</label><input className="input" type="number"
                value={catModal.sortOrder ?? 0} onChange={e => setCatModal(c => c ? { ...c, sortOrder: parseInt(e.target.value) || 0 } : c)} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCatModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveCat} disabled={saving} className="btn-primary">
                {saving ? <Spinner size="sm" /> : null} Save
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Service modal */}
      <Modal isOpen={!!svcModal} onClose={() => setSvcModal(null)} title={svcModal?.id ? 'Edit Service' : 'New Service'} size="md">
        {svcModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Code</label><input className="input" value={svcModal.code || ''}
                onChange={e => setSvcModal(s => s ? { ...s, code: e.target.value } : s)} placeholder="e.g. STAGE1" /></div>
              <div><label className="label">Name</label><input className="input" value={svcModal.name || ''}
                onChange={e => setSvcModal(s => s ? { ...s, name: e.target.value } : s)} /></div>
            </div>
            <div><label className="label">Description</label><textarea className="input" rows={2} value={svcModal.description || ''}
              onChange={e => setSvcModal(s => s ? { ...s, description: e.target.value } : s)} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="label">Price</label><input className="input" type="number" value={svcModal.basePrice ?? ''}
                onChange={e => setSvcModal(s => s ? { ...s, basePrice: parseFloat(e.target.value) || 0 } : s)} /></div>
              <div><label className="label">Est. Hours</label><input className="input" type="number" step="0.5"
                value={svcModal.estimatedHours ?? ''} onChange={e => setSvcModal(s => s ? { ...s, estimatedHours: parseFloat(e.target.value) || undefined } : s)} /></div>
              <div><label className="label">Sort Order</label><input className="input" type="number"
                value={svcModal.sortOrder ?? 0} onChange={e => setSvcModal(s => s ? { ...s, sortOrder: parseInt(e.target.value) || 0 } : s)} /></div>
            </div>
            <div><label className="label">Icon (emoji)</label><input className="input" value={svcModal.icon || ''}
              onChange={e => setSvcModal(s => s ? { ...s, icon: e.target.value } : s)} placeholder="e.g. ⚡" /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSvcModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveSvc} disabled={saving} className="btn-primary">
                {saving ? <Spinner size="sm" /> : null} Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
