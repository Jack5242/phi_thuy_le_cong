import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 left-4 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
      <div className="flex items-center gap-3 bg-teal-900 text-white px-6 py-4 rounded-lg shadow-2xl border border-white/10">
        <CheckCircle size={20} className="text-teal-100" />
        <span className="font-medium tracking-wide">{message}</span>
      </div>
    </div>
  );
};
