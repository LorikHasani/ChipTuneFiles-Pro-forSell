import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  variant = 'primary',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full mb-4',
            variant === 'danger'
              ? 'bg-red-50 dark:bg-red-950/30'
              : 'bg-neutral-100 dark:bg-neutral-800'
          )}
        >
          <AlertTriangle
            className={cn(
              'h-6 w-6',
              variant === 'danger'
                ? 'text-red-600 dark:text-red-400'
                : 'text-neutral-600 dark:text-neutral-400'
            )}
          />
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          {message}
        </p>
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'flex-1',
              variant === 'danger' ? 'btn-danger' : 'btn-primary'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
