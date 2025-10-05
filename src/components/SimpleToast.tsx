import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface SimpleToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function SimpleToast({ message, type, onClose }: SimpleToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${
          type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}
      >
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
        </div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
