import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, Edit2, Trash2, Megaphone, ToggleLeft, ToggleRight, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, uploadAnnouncementImage } from '../../hooks/useApi';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const openModal = (data: Partial<Announcement>) => {
    setModal(data);
    setImageFile(null);
    setImagePreview(data.imageUrl || null);
  };

  const handleSave = async () => {
    if (!modal?.title || !modal?.message) return;
    setSaving(true);
    try {
      let imageUrl = modal.imageUrl || null;

      // Upload new image if one was selected
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await uploadAnnouncementImage(imageFile);
        setUploadingImage(false);
      }

      const payload = { ...modal, imageUrl };

      if (modal.id) {
        await updateAnnouncement(modal.id, payload);
      } else {
        await createAnnouncement(payload);
      }
      toast.success('Announcement saved');
      setModal(null);
      setImageFile(null);
      setImagePreview(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
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

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setModal(m => m ? { ...m, imageUrl: null } : m);
  };

  const typeColors: Record<string, string> = {
    INFO: 'bg-neutral-100 text-neutral-600',
    WARNING: 'bg-neutral-100 text-neutral-600',
    SUCCESS: 'bg-neutral-100 text-neutral-600',
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Broadcast messages to all users">
        <button onClick={() => openModal({ title: '', message: '', type: 'INFO', isActive: true })} className="btn-primary">
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
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{a.title}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded font-medium', typeColors[a.type] || typeColors.INFO)}>
                    {a.type}
                  </span>
                  {!a.isActive && <span className="text-xs text-neutral-400">(Inactive)</span>}
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{a.message}</p>
                {a.imageUrl && (
                  <img src={a.imageUrl} alt="" className="mt-2 h-16 rounded object-cover" />
                )}
                <p className="text-xs text-neutral-400 mt-1">{formatDate(a.createdAt)}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => toggleActive(a)} className="text-neutral-400 hover:text-neutral-500">
                  {a.isActive ? <ToggleRight size={20} className="text-neutral-500" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => openModal(a)} className="text-neutral-400 hover:text-neutral-500"><Edit2 size={16} /></button>
                <button onClick={() => setDeleteId(a.id)} className="text-neutral-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => { setModal(null); setImageFile(null); setImagePreview(null); }} title={modal?.id ? 'Edit Announcement' : 'New Announcement'} size="md">
        {modal && (
          <div className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="Announcement title" value={modal.title || ''}
                onChange={e => setModal(m => m ? { ...m, title: e.target.value } : m)} />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input" rows={4} placeholder="Announcement message..." value={modal.message || ''}
                onChange={e => setModal(m => m ? { ...m, message: e.target.value } : m)} />
            </div>

            {/* Image Upload */}
            <div>
              <label className="label">Image (optional)</label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover" />
                  <button onClick={clearImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={cn(
                    'flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                    isDragActive
                      ? 'border-neutral-400 bg-neutral-100 dark:bg-neutral-800'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  )}
                >
                  <input {...getInputProps()} />
                  <ImagePlus className="w-8 h-8 text-neutral-400 mb-2" />
                  <p className="text-sm text-neutral-500">Click to upload image</p>
                  <p className="text-xs text-neutral-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Type</label>
              <select className="input" value={modal.type || 'INFO'}
                onChange={e => setModal(m => m ? { ...m, type: e.target.value as AnnouncementType } : m)}>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="SUCCESS">Success</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setModal(null); setImageFile(null); setImagePreview(null); }} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploadingImage} className="btn-primary">
                {(saving || uploadingImage) ? <Spinner size="sm" /> : null} {modal.id ? 'Save' : 'Create'}
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
