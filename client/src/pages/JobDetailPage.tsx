import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  Download,
  FileText,
  Send,
  MessageSquare,
  RotateCcw,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  useJob,
  useJobMessages,
  downloadFile,
  requestRevision,
  sendJobMessage,
  markJobMessagesRead,
} from '../hooks/useApi';
import { useAuthStore } from '../stores/authStore';
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  formatFileSize,
  cn,
} from '../lib/utils';
import { getErrorMessage } from '../lib/api';
import type { FileItem } from '../types';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { job, loading, error, refetch: refetchJob } = useJob(id!);
  const { messages, loading: messagesLoading, refetch: refetchMessages } = useJobMessages(id!);

  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (id && messages && messages.length > 0) {
      markJobMessagesRead(id).catch(() => {});
    }
  }, [id, messages]);

  useEffect(() => {
    const interval = setInterval(refetchMessages, 10000);
    return () => clearInterval(interval);
  }, [refetchMessages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;
    setSendingMessage(true);
    try {
      await sendJobMessage(id, newMessage.trim());
      setNewMessage('');
      refetchMessages();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      await downloadFile(file.id, file.originalName);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionReason.trim() || !id) return;
    setSubmittingRevision(true);
    try {
      await requestRevision(id, revisionReason.trim());
      toast.success('Revision request submitted');
      setShowRevisionModal(false);
      setRevisionReason('');
      refetchJob();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingRevision(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Link to="/jobs" className="btn-primary"><ArrowLeft className="w-4 h-4" /> Back to Jobs</Link>
      </div>
    );
  }

  if (!job) return null;

  const origFiles = (job.files || []).filter(f => f.fileType === 'ORIGINAL');
  const modFiles = (job.files || []).filter(f => f.fileType === 'MODIFIED');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.referenceNumber}</h1>
              <Badge status={job.status} />
            </div>
            <p className="text-sm text-gray-500">Created {formatRelativeTime(job.createdAt)}</p>
          </div>
          {job.status === 'COMPLETED' && (
            <button onClick={() => setShowRevisionModal(true)} className="btn-secondary">
              <RotateCcw className="w-4 h-4" /> Request Revision
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Information */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Car size={18} /> Vehicle Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                ['Brand', job.brand],
                ['Model', job.model],
                ['Year', job.year],
                ['Engine', job.engineType],
                ['Power', job.powerHp ? `${job.powerHp} HP` : null],
                ['ECU', job.ecuType],
                ['Gearbox', job.gearboxType],
                ['Fuel', job.fuelType],
              ].filter(([, val]) => val).map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{val}</p>
                </div>
              ))}
            </div>
            {(job.clientNotes || job.carNotes) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-0.5">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{job.clientNotes || job.carNotes}</p>
              </div>
            )}
          </div>

          {/* Selected Services */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Selected Services</h3>
            <div className="space-y-3">
              {(job.services || []).map(s => (
                <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{s.serviceName}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(s.price)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 dark:border-gray-600">
                <span className="text-sm font-bold text-primary-600">Total</span>
                <span className="text-lg font-bold text-primary-600">{formatCurrency(job.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="card">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={18} /> Messages
              </h3>
            </div>
            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {messagesLoading && <div className="flex justify-center py-4"><Spinner size="sm" /></div>}
              {!messagesLoading && (!messages || messages.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-6">No messages yet</p>
              )}
              {messages?.filter(m => !m.isInternal).map((msg) => (
                <div key={msg.id} className={cn('flex', msg.senderId === user?.id ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5',
                    msg.senderId === user?.id
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                  )}>
                    {msg.senderId !== user?.id && (
                      <p className="text-xs font-semibold mb-0.5 text-primary-600 dark:text-primary-400">
                        {msg.sender?.contactName || msg.sender?.email || 'Team'}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className={cn('text-xs mt-1', msg.senderId === user?.id ? 'text-primary-200' : 'text-gray-400')}>
                      {formatRelativeTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..." className="input flex-1" disabled={sendingMessage} />
              <button type="submit" disabled={!newMessage.trim() || sendingMessage} className="btn-primary px-4">
                {sendingMessage ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Files */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} /> Files
            </h3>
            <div className="space-y-4">
              {/* Original File */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Original File</p>
                {origFiles.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">None uploaded</p>
                ) : (
                  origFiles.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.originalName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(f.fileSize)}</p>
                      </div>
                      <button onClick={() => handleDownload(f)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 flex-shrink-0 ml-2 transition-colors">
                        <Download size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Modified File */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Modified File</p>
                {modFiles.length > 0 ? (
                  modFiles.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.originalName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(f.fileSize)}</p>
                      </div>
                      <button onClick={() => handleDownload(f)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white flex-shrink-0 ml-2 transition-colors">
                        <Download size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">Not available yet</p>
                )}
              </div>
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Job Created</p>
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

      {/* Revision Modal */}
      <Modal isOpen={showRevisionModal} onClose={() => setShowRevisionModal(false)} title="Request Revision">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Describe what needs to be changed. Our team will review and work on the revision.
          </p>
          <textarea rows={4} value={revisionReason} onChange={e => setRevisionReason(e.target.value)}
            placeholder="Describe what needs to be revised..." className="input resize-none w-full" />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowRevisionModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleRequestRevision} disabled={!revisionReason.trim() || submittingRevision} className="btn-primary">
              {submittingRevision ? <><Spinner size="sm" /> Submitting...</> : <><RotateCcw className="w-4 h-4" /> Submit</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
