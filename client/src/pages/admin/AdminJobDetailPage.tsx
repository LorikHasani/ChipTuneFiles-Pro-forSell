import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Upload, Send, Eye, EyeOff, Car, Wrench, User, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useJob, useJobMessages, updateJobStatus, uploadFile, downloadFile, sendJobMessage, markJobMessagesRead } from '../../hooks/useApi';
import { formatCurrency, formatDate, formatDateTime, formatFileSize, getStatusLabel, cn } from '../../lib/utils';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import PageHeader from '../../components/PageHeader';
import FileUpload from '../../components/FileUpload';
import type { JobStatus } from '../../types';

const statuses: JobStatus[] = ['PENDING', 'IN_PROGRESS', 'WAITING_FOR_INFO', 'COMPLETED', 'REVISION_REQUESTED', 'REJECTED'];

export default function AdminJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { job, loading, refetch } = useJob(id!);
  const { messages, refetch: refetchMsgs } = useJobMessages(id!);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [modFile, setModFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (job?.adminNotes) setAdminNotes(job.adminNotes);
  }, [job?.adminNotes]);

  useEffect(() => {
    const interval = setInterval(refetchMsgs, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (id) markJobMessagesRead(id).catch(() => {});
  }, [messages?.length]);

  const handleStatusUpdate = async (status: JobStatus) => {
    setUpdatingStatus(true);
    try {
      await updateJobStatus(id!, status, adminNotes || undefined);
      toast.success(`Status updated to ${getStatusLabel(status)}`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUploadMod = async () => {
    if (!modFile) return;
    setUploading(true);
    try {
      await uploadFile(id!, modFile);
      toast.success('Modified file uploaded');
      setModFile(null);
      refetch();
    } catch (err: any) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendJobMessage(id!, newMessage, isInternal);
      setNewMessage('');
      refetchMsgs();
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!job) return <p className="text-center text-gray-500 py-12">Job not found</p>;

  const origFiles = (job.files || []).filter(f => f.fileType === 'ORIGINAL');
  const modFiles = (job.files || []).filter(f => f.fileType === 'MODIFIED');

  return (
    <div className="space-y-6">
      <PageHeader title={`Job ${job.referenceNumber}`}>
        <Badge status={job.status} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Update */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {statuses.map(s => (
                <button key={s} onClick={() => handleStatusUpdate(s)} disabled={updatingStatus || s === job.status}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    s === job.status ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/30' :
                    'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400')}>
                  {getStatusLabel(s)}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Admin Notes</label>
              <textarea className="input" rows={2} value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes..." />
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Car size={18} /> Vehicle</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {[
                ['Brand', job.brand], ['Model', job.model], ['Year', job.year],
                ['Engine', job.engineType], ['Power', job.powerHp ? `${job.powerHp} HP` : null],
                ['ECU', job.ecuType], ['Gearbox', job.gearboxType], ['Fuel', job.fuelType],
                ['VIN', job.vin], ['Mileage', job.mileage ? `${job.mileage} km` : null],
                ['Reading Tool', job.readingTool], ['Tool Type', job.toolType],
              ].map(([label, val]) => val ? (
                <div key={label as string}>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{val}</p>
                </div>
              ) : null)}
            </div>
            {job.carNotes && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400"><strong>Car Notes:</strong> {job.carNotes}</p>}
            {job.clientNotes && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400"><strong>Client Notes:</strong> {job.clientNotes}</p>}
          </div>

          {/* Services */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Wrench size={18} /> Services</h3>
            <div className="space-y-2">
              {(job.services || []).map(s => (
                <div key={s.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-700 dark:text-gray-300">{s.serviceName}</span>
                  <span className="font-medium">{formatCurrency(s.price)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold">
                <span>Total</span><span>{formatCurrency(job.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={18} /> Messages
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {(messages || []).map((msg: any) => (
                <div key={msg.id} className={cn('rounded-lg px-3 py-2 text-sm',
                  msg.isInternal ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                  msg.sender?.role === 'CLIENT' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-primary-50 dark:bg-primary-900/20')}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-xs">{msg.sender?.contactName || msg.sender?.email}</span>
                    {msg.isInternal && <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 rounded">Internal</span>}
                    <span className="text-xs text-gray-400 ml-auto">{formatDateTime(msg.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  {isInternal ? <EyeOff size={14} /> : <Eye size={14} />}
                  {isInternal ? 'Internal (admin only)' : 'Visible to client'}
                </label>
              </div>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Type message..." value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} />
                <button onClick={handleSendMessage} disabled={sending} className="btn-primary">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Client info */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><User size={18} /> Client</h3>
            <p className="font-medium text-gray-900 dark:text-white">{job.client?.contactName || '-'}</p>
            <p className="text-sm text-gray-500">{job.client?.email}</p>
            {job.client?.companyName && <p className="text-sm text-gray-500">{job.client.companyName}</p>}
          </div>

          {/* Files */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Files</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Original Files</p>
                {origFiles.length === 0 ? <p className="text-sm text-gray-400">None</p> :
                  origFiles.map(f => (
                    <button key={f.id} onClick={() => downloadFile(f.id, f.originalName)}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:underline w-full text-left py-1">
                      <Download size={14} /> {f.originalName} <span className="text-gray-400 text-xs">({formatFileSize(f.fileSize)})</span>
                    </button>
                  ))
                }
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Modified Files</p>
                {modFiles.length === 0 ? <p className="text-sm text-gray-400">None uploaded yet</p> :
                  modFiles.map(f => (
                    <button key={f.id} onClick={() => downloadFile(f.id, f.originalName)}
                      className="flex items-center gap-2 text-sm text-green-600 hover:underline w-full text-left py-1">
                      <Download size={14} /> {f.originalName} <span className="text-gray-400 text-xs">({formatFileSize(f.fileSize)})</span>
                    </button>
                  ))
                }
              </div>
              {/* Upload modified */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Upload Modified File</p>
                <FileUpload onFileSelected={setModFile} label="Drop modified file here" />
                {modFile && (
                  <button onClick={handleUploadMod} disabled={uploading} className="btn-primary w-full mt-2">
                    {uploading ? <Spinner size="sm" /> : <Upload size={16} />} Upload
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job info */}
          <div className="card p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Job Type</span><span className="font-medium">{job.jobType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{formatDate(job.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Revisions</span><span>{job.revisionCount}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Original File</span><span>{job.isOriginal ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
