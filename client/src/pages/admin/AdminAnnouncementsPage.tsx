import { useState } from 'react';
import { Plus, Edit2, Trash2, Megaphone, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../hooks/useApi';
import { formatDate, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import type { Announcement, AnnouncementType } from '../../types';

export default function AdminAnnouncementsPage() {
  const { announcements, loading, refetch } = useAnnouncements();
  const [modal, setModal] = useState<Partial<Announcement> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!modal?.title || !modal?.message) return;
    setSaving(true);
    try {
      if (modal.id) {
        await updateAnnouncement(modal.id, modal);
      } else {
        await createAnnouncement(modal);
      }
      toast.success('Announcement saved');
      setModal(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAnnouncement(deleteId);
      toast.success('Deleted');
      setDeleteId(null);
      refetch();
    } catch { toast.error('Failed'); }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      await updateAnnouncement(a.id, { isActive: !a.isActive });
      refetch();
    } catch { toast.error('Failed'); }
  };

  const typeColors: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-700',
    WARNING: 'bg-yellow-100 text-yellow-700',
    SUCCESS: 'bg-green-100 text-green-700',
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Broadcast messages to all users">
        <button onClick={() => setModal({ title: '', message: '', type: 'INFO', isActive: true })} className="btn-primary">
          <Plus size={16} /> New Announcement
        </button>
      </PageHeader>

      {!announcements?.length ? (
        <EmptyState icon={Megaphone} title="No announcements" description="Create an announcement to broadcast to users" />
      ) : (
        <div className="space-y-3">
          {announcements.map((a: Announcement) => (
            <div key={a.id} className="card p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded font-medium', typeColors[a.type] || typeColors.INFO)}>
                    {a.type}
                  </span>
                  {!a.isActive && <span className="text-xs text-gray-400">(Inactive)</span>}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{a.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(a.createdAt)}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => toggleActive(a)} className="text-gray-400 hover:text-gray-600">
                  {a.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => setModal(a)} className="text-gray-400 hover:text-gray-600"><Edit2 size={16} /></button>
                <button onClick={() => setDeleteId(a.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Announcement' : 'New Announcement'} size="md">
        {modal && (
          <div className="space-y-4">
            <div><label className="label">Title</label><input className="input" value={modal.title || ''}
              onChange={e => setModal(m => m ? { ...m, title: e.target.value } : m)} /></div>
            <div><label className="label">Message</label><textarea className="input" rows={4} value={modal.message || ''}
              onChange={e => setModal(m => m ? { ...m, message: e.target.value } : m)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Type</label>
                <select className="input" value={modal.type || 'INFO'}
                  onChange={e => setModal(m => m ? { ...m, type: e.target.value as AnnouncementType } : m)}>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="SUCCESS">Success</option>
                </select></div>
              <div><label className="label">Image URL (optional)</label><input className="input" value={modal.imageUrl || ''}
                onChange={e => setModal(m => m ? { ...m, imageUrl: e.target.value } : m)} /></div>
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

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Announcement" message="Are you sure you want to delete this announcement?"
        confirmText="Delete" variant="danger" />
    </div>
  );
}
