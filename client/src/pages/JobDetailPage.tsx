import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  Layers,
  Download,
  FileText,
  Send,
  MessageSquare,
  RotateCcw,
  Clock,
  Hash,
  Fuel,
  Gauge,
  Settings,
  Cpu,
  StickyNote,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
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
import { useBrandingStore } from '../stores/brandingStore';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatFileSize,
  formatCredits,
  cn,
} from '../lib/utils';
import { getErrorMessage } from '../lib/api';
import type { FileItem, JobMessage } from '../types';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const currencySymbol = useBrandingStore((s) => s.branding.currency_symbol);

  const { job, loading, error, refetch: refetchJob } = useJob(id!);
  const {
    messages,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useJobMessages(id!);

  // Messaging state
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Revision state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Download state
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (id && messages && messages.length > 0) {
      markJobMessagesRead(id).catch(() => {});
    }
  }, [id, messages]);

  // Poll messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchMessages();
    }, 10000);
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
    setDownloadingFileId(file.id);
    try {
      await downloadFile(file.id, file.originalName);
      toast.success('File download started');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionReason.trim() || !id) return;

    setSubmittingRevision(true);
    try {
      await requestRevision(id, revisionReason.trim());
      toast.success('Revision request submitted successfully');
      setShowRevisionModal(false);
      setRevisionReason('');
      refetchJob();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingRevision(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Failed to load job
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <Link to="/jobs" className="btn-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </div>
    );
  }

  if (!job) return null;

  const originalFile = job.files?.find((f) => f.fileType === 'ORIGINAL');
  const modifiedFile = job.files?.find((f) => f.fileType === 'MODIFIED');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {job.referenceNumber}
              </h1>
              <Badge status={job.status} />
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {job.jobType}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Created {formatDate(job.createdAt)}
              </span>
              {job.updatedAt !== job.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Updated {formatRelativeTime(job.updatedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Revision Button */}
          {job.status === 'COMPLETED' && (
            <button
              onClick={() => setShowRevisionModal(true)}
              className="btn-secondary"
            >
              <RotateCcw className="w-4 h-4" />
              Request Revision
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Information */}
          <Card title="Vehicle Information" subtitle="Details about the vehicle">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Car} label="Brand" value={job.brand} />
              <InfoRow icon={Car} label="Model" value={job.model} />
              <InfoRow icon={CalendarDays} label="Year" value={job.year?.toString()} />
              <InfoRow icon={Settings} label="Engine Type" value={job.engineType} />
              <InfoRow icon={Gauge} label="Power" value={job.powerHp ? `${job.powerHp} HP` : null} />
              <InfoRow icon={Cpu} label="ECU Type" value={job.ecuType} />
              <InfoRow icon={Settings} label="Gearbox" value={job.gearboxType} />
              <InfoRow icon={Hash} label="VIN" value={job.vin} />
              <InfoRow icon={Gauge} label="Mileage" value={job.mileage ? `${job.mileage.toLocaleString()} km` : null} />
              <InfoRow icon={Fuel} label="Fuel Type" value={job.fuelType} />
              {job.readingTool && (
                <InfoRow icon={Settings} label="Reading Tool" value={job.readingTool} />
              )}
              {job.toolType && (
                <InfoRow icon={Settings} label="Tool Type" value={job.toolType} />
              )}
            </div>
            {job.isOriginal !== undefined && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={cn(
                      'w-4 h-4',
                      job.isOriginal
                        ? 'text-green-500'
                        : 'text-gray-400 dark:text-gray-500'
                    )}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {job.isOriginal ? 'Original file' : 'Not an original file'}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Files Section */}
          <Card title="Files" subtitle="Original and modified files">
            <div className="space-y-3">
              {/* Original File */}
              {originalFile ? (
                <FileRow
                  file={originalFile}
                  label="Original File"
                  onDownload={handleDownload}
                  isDownloading={downloadingFileId === originalFile.id}
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No original file uploaded
                </p>
              )}

              {/* Modified File */}
              {modifiedFile ? (
                <FileRow
                  file={modifiedFile}
                  label="Modified File"
                  onDownload={handleDownload}
                  isDownloading={downloadingFileId === modifiedFile.id}
                />
              ) : (
                job.status === 'COMPLETED' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Modified file not yet available
                  </p>
                )
              )}
            </div>
          </Card>

          {/* Messages Section */}
          <Card title="Messages" subtitle="Communicate with the team">
            <div className="space-y-4">
              {/* Messages List */}
              <div
                ref={messagesContainerRef}
                className="max-h-96 overflow-y-auto space-y-3 scrollbar-thin"
              >
                {messagesLoading && (
                  <div className="flex justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                )}

                {!messagesLoading && (!messages || messages.length === 0) && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No messages yet. Send a message to start the conversation.
                    </p>
                  </div>
                )}

                {messages?.filter((m) => !m.isInternal).map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwnMessage={msg.senderId === user?.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Message Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="input flex-1"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="btn-primary px-4"
                >
                  {sendingMessage ? (
                    <Spinner size="sm" className="border-white/30 border-t-white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Services Card */}
          <Card title="Services" subtitle="Selected services for this job">
            {job.services && job.services.length > 0 ? (
              <div className="space-y-3">
                {job.services.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {svc.serviceName}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCredits(svc.price)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {formatCredits(job.totalPrice)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No services selected
              </p>
            )}
          </Card>

          {/* Notes Card */}
          {(job.clientNotes || job.adminNotes || job.carNotes) && (
            <Card title="Notes">
              <div className="space-y-4">
                {job.clientNotes && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <StickyNote className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Your Notes
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {job.clientNotes}
                    </p>
                  </div>
                )}

                {job.carNotes && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Car className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Car Notes
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {job.carNotes}
                    </p>
                  </div>
                )}

                {job.adminNotes && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Admin Notes
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {job.adminNotes}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Job Info Card */}
          <Card title="Job Details">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <Badge status={job.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Type</span>
                <span className="font-medium text-gray-900 dark:text-white">{job.jobType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Created</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDate(job.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatRelativeTime(job.updatedAt)}</span>
              </div>
              {job.revisionCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Revisions</span>
                  <span className="font-medium text-gray-900 dark:text-white">{job.revisionCount}</span>
                </div>
              )}
              {job.creditsUsed > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Credits Used</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCredits(job.creditsUsed)}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Revision Modal */}
      <Modal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Request Revision"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please describe what needs to be changed or corrected. Our team will review your request and work on the revision.
          </p>
          <div>
            <label htmlFor="revision-reason" className="label">
              Revision Reason
            </label>
            <textarea
              id="revision-reason"
              rows={4}
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="Describe what needs to be revised..."
              className="input resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowRevisionModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestRevision}
              disabled={!revisionReason.trim() || submittingRevision}
              className="btn-primary"
            >
              {submittingRevision ? (
                <>
                  <Spinner size="sm" className="border-white/30 border-t-white" />
                  Submitting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Submit Revision Request
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function FileRow({
  file,
  label,
  onDownload,
  isDownloading,
}: {
  file: FileItem;
  label: string;
  onDownload: (file: FileItem) => void;
  isDownloading: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
          <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
            {label}
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {file.originalName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(file.fileSize)}
          </p>
        </div>
      </div>
      <button
        onClick={() => onDownload(file)}
        disabled={isDownloading}
        className="btn-secondary text-sm px-3 py-1.5 flex-shrink-0 ml-3"
      >
        {isDownloading ? (
          <Spinner size="sm" />
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download
          </>
        )}
      </button>
    </div>
  );
}

function MessageBubble({
  message,
  isOwnMessage,
}: {
  message: JobMessage;
  isOwnMessage: boolean;
}) {
  return (
    <div className={cn('flex', isOwnMessage ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isOwnMessage
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
        )}
      >
        {!isOwnMessage && (
          <p
            className={cn(
              'text-xs font-semibold mb-0.5',
              'text-primary-600 dark:text-primary-400'
            )}
          >
            {message.sender?.contactName || message.sender?.email || 'Team'}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        <p
          className={cn(
            'text-xs mt-1',
            isOwnMessage ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'
          )}
        >
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
