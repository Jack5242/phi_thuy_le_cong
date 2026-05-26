import React, { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  duration?: number;
  type?: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, duration = 3000, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const isError = type === 'error';

  return (
    <div className="fixed bottom-4 left-4 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border ${isError ? 'bg-red-600 text-white border-red-500' : 'bg-teal-900 text-white border-white/10'}`}>
        {isError ? (
          <XCircle size={20} className="text-red-100" />
        ) : (
          <CheckCircle size={20} className="text-teal-100" />
        )}
        <span className="font-medium tracking-wide">{message}</span>
      </div>
    </div>
  );
};
