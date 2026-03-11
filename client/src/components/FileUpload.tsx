import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X } from 'lucide-react';
import { cn, formatFileSize } from '../lib/utils';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  label?: string;
  className?: string;
}

export default function FileUpload({
  onFileSelected,
  accept,
  maxSize = 50 * 1024 * 1024, // 50MB default
  label = 'Upload a file',
  className,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors?.[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${formatFileSize(maxSize)}.`);
        } else if (rejection.errors?.[0]?.code === 'file-invalid-type') {
          setError('Invalid file type.');
        } else {
          setError('File could not be accepted.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelected(file);
      }
    },
    [onFileSelected, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className={className}>
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center w-full px-6 py-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500',
            'bg-gray-50 dark:bg-gray-800/50'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud
            className={cn(
              'h-10 w-10 mb-3',
              isDragActive
                ? 'text-primary-500'
                : 'text-gray-400 dark:text-gray-500'
            )}
          />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isDragActive ? 'Drop your file here' : label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Drag & drop or click to browse. Max {formatFileSize(maxSize)}.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
              <File className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 ml-3"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
