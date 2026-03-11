import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Upload,
  Send,
  Eye,
  EyeOff,
  Car,
  Wrench,
  User,
  MessageSquare,
  Clock,
  FileText,
  Plus,
  Play,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useJob,
  useJobMessages,
  updateJobStatus,
  uploadFile,
  downloadFile,
  sendJobMessage,
  markJobMessagesRead,
} from '../../hooks/useApi';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatFileSize,
  getStatusLabel,
  cn,
} from '../../lib/utils';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import FileUpload from '../../components/FileUpload';
import type { JobStatus } from '../../types';

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_FOR_INFO', label: 'Waiting for Info' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REVISION_REQUESTED', label: 'Revision Requested' },
  { value: 'REJECTED', label: 'Rejected' },
];

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
  const [selectedStatus, setSelectedStatus] = useState<JobStatus>('PENDING');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (job) {
      setAdminNotes(job.adminNotes || '');
      setSelectedStatus(job.status);
    }
  }, [job?.id, job?.status]);

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

  const handleSaveNotes = async () => {
    setUpdatingStatus(true);
    try {
      await updateJobStatus(id!, job!.status, adminNotes || undefined);
      toast.success('Notes saved');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save notes');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUploadMod = async () => {
    if (!modFile) return;
    setUploading(true);
    try {
      await uploadFile(id!, modFile, 'MODIFIED');
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
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!job) return <p className="text-center text-gray-500 py-12">Job not found</p>;

  const origFiles = (job.files || []).filter(f => f.fileType === 'ORIGINAL');
  const modFiles = (job.files || []).filter(f => f.fileType === 'MODIFIED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/admin/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to all jobs
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.referenceNumber}</h1>
          <Badge status={job.status} />
        </div>
        <p className="text-sm text-gray-500 mt-1">Created {formatRelativeTime(job.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} /> Client Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{job.client?.contactName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{job.client?.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Company</p>
                <p className="font-medium text-gray-900 dark:text-white">{job.client?.companyName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Balance</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(job.client?.creditBalance || 0)}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Car size={18} /> Vehicle Information
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                ['Brand', job.brand],
                ['Model', job.model],
                ['Year', job.year],
                ['Engine', job.engineType],
                ['Power', job.powerHp ? `${job.powerHp} HP` : null],
                ['ECU', job.ecuType],
                ['Gearbox', job.gearboxType],
                ['Fuel', job.fuelType],
                ['VIN', job.vin],
                ['Mileage', job.mileage ? `${job.mileage} km` : null],
                ['Reading Tool', job.readingTool],
                ['Tool Type', job.toolType],
              ].filter(([, val]) => val).map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{val}</p>
                </div>
              ))}
            </div>
            {(job.carNotes || job.clientNotes) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {job.clientNotes && (
                  <div>
                    <p className="text-xs text-gray-500 italic">Client Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{job.clientNotes}</p>
                  </div>
                )}
                {job.carNotes && (
                  <div>
                    <p className="text-xs text-gray-500 italic">Car Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{job.carNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Requested Services */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Wrench size={18} /> Requested Services
            </h3>
            <div className="space-y-3">
              {(job.services || []).map(s => (
                <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{s.serviceName}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(s.price)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 dark:border-gray-600">
                <span className="text-sm font-bold text-red-600">Total</span>
                <span className="text-lg font-bold text-red-600">{formatCurrency(job.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="card">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={18} /> Messages with Client
              </h3>
            </div>
            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {(!messages || messages.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-6">No messages yet</p>
              ) : (
                messages.map((msg: any) => (
                  <div key={msg.id} className={cn('rounded-lg px-3 py-2 text-sm',
                    msg.isInternal ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                    msg.sender?.role === 'CLIENT' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-red-50 dark:bg-red-900/20')}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">{msg.sender?.contactName || msg.sender?.email}</span>
                      {msg.isInternal && <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 rounded">Internal</span>}
                      <span className="text-xs text-gray-400 ml-auto">{formatDateTime(msg.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))
              )}
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
                <input className="input flex-1" placeholder="Type a message to client..." value={newMessage}
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
          {/* Job Status */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Job Status</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Update Status</label>
                <select
                  className="input"
                  value={selectedStatus}
                  onChange={e => {
                    const newStatus = e.target.value as JobStatus;
                    setSelectedStatus(newStatus);
                    handleStatusUpdate(newStatus);
                  }}
                  disabled={updatingStatus}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Admin Notes (internal)</label>
                <textarea className="input" rows={3} value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)} placeholder="Add notes about this job..." />
              </div>
              <button onClick={handleSaveNotes} disabled={updatingStatus} className="btn-primary w-full bg-red-600 hover:bg-red-700">
                Save Notes
              </button>
            </div>
          </div>

          {/* Files */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} /> Files
            </h3>
            <div className="space-y-4">
              {/* Original Files */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Original File (from client)</p>
                {origFiles.length === 0 ? (
                  <p className="text-sm text-gray-400">None uploaded</p>
                ) : (
                  origFiles.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.originalName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(f.fileSize)}</p>
                      </div>
                      <button onClick={() => downloadFile(f.id, f.originalName)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex-shrink-0 ml-2 transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Modified Files */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Modified File (tuned)</p>
                {modFiles.length > 0 ? (
                  modFiles.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.originalName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(f.fileSize)}</p>
                      </div>
                      <button onClick={() => downloadFile(f.id, f.originalName)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex-shrink-0 ml-2 transition-colors">
                        <Download size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <FileUpload onFileSelected={setModFile} label="Upload modified file" />
                    {modFile && (
                      <button onClick={handleUploadMod} disabled={uploading} className="btn-primary w-full mt-2 bg-red-600 hover:bg-red-700">
                        {uploading ? <Spinner size="sm" /> : <Upload size={16} />} Upload
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {job.status === 'PENDING' && (
                <button onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={updatingStatus}
                  className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                  <Play size={16} /> Start Working
                </button>
              )}
              {(job.status === 'IN_PROGRESS' || job.status === 'REVISION_REQUESTED') && modFiles.length > 0 && (
                <button onClick={() => handleStatusUpdate('COMPLETED')} disabled={updatingStatus}
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Mark Complete
                </button>
              )}
              {(job.status === 'IN_PROGRESS' || job.status === 'REVISION_REQUESTED') && modFiles.length === 0 && (
                <p className="text-xs text-gray-500 text-center italic">Upload modified file to mark as complete</p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={18} /> Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Created</p>
                  <p className="text-xs text-gray-500">{formatDateTime(job.createdAt)}</p>
                </div>
              </div>
              {job.updatedAt !== job.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</p>
                    <p className="text-xs text-gray-500">{formatDateTime(job.updatedAt)}</p>
                  </div>
                </div>
              )}
              {job.revisionCount > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{job.revisionCount} Revision(s)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
