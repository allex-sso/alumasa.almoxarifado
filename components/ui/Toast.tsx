import React, { useEffect } from 'react';
import { WarningIcon, CheckCircleIcon, XCircleIcon } from '../icons/Icons';

const typeClasses = {
  warning: {
    bg: 'bg-yellow-100 border-yellow-400',
    text: 'text-yellow-800',
    icon: <WarningIcon />,
    buttonHover: 'hover:bg-yellow-200',
    ring: 'focus:ring-yellow-400',
  },
  success: {
    bg: 'bg-green-100 border-green-400',
    text: 'text-green-800',
    icon: <CheckCircleIcon />,
    buttonHover: 'hover:bg-green-200',
    ring: 'focus:ring-green-400',
  },
  error: {
    bg: 'bg-red-100 border-red-400',
    text: 'text-red-800',
    icon: <XCircleIcon />,
    buttonHover: 'hover:bg-red-200',
    ring: 'focus:ring-red-400',
  },
};

interface ToastProps {
  message: string;
  type: 'warning' | 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const classes = typeClasses[type];

  return (
    <div 
      className={`fixed top-5 right-5 z-[9999] max-w-sm w-full p-4 rounded-lg shadow-lg border-l-4 flex items-center transition-opacity duration-300 animate-fade-in-right ${classes.bg}`}
      role="alert"
    >
      <div className={`flex-shrink-0 ${classes.text}`}>
        {classes.icon}
      </div>
      <div className="ml-3">
        <p className={`text-sm font-medium ${classes.text}`}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 inline-flex h-8 w-8 ${classes.text} ${classes.buttonHover} ${classes.ring}`}
        aria-label="Fechar"
      >
         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      </button>
    </div>
  );
};

export default Toast;