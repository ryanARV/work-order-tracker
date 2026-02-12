'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-700';
      case 'error':
        return 'bg-red-600 border-red-700';
      case 'warning':
        return 'bg-orange-500 border-orange-600';
      case 'info':
        return 'bg-blue-600 border-blue-700';
      default:
        return 'bg-gray-600 border-gray-700';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md w-full sm:w-auto animate-in slide-in-from-bottom-5 fade-in duration-300`}
    >
      <div
        className={`${getStyles()} text-white px-6 py-4 rounded-lg shadow-lg border-l-4 flex items-center gap-3`}
      >
        <span className="text-2xl font-bold">{getIcon()}</span>
        <p className="font-medium text-sm sm:text-base">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto text-white hover:text-gray-200 font-bold text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
