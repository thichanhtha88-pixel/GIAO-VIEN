import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const colorConfig = {
    danger: {
      icon: <XCircle className="w-10 h-10 text-red-600" />,
      bg: 'bg-red-50',
      btn: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
      bg: 'bg-amber-50',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: <Info className="w-10 h-10 text-blue-600" />,
      bg: 'bg-blue-50',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${colorConfig.bg}`}>
            {colorConfig.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 leading-tight">{title}</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold text-sm transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer ${colorConfig.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icon = {
          success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
        }[toast.type];

        const border = {
          success: 'border-emerald-500 bg-emerald-50 text-emerald-950',
          error: 'border-red-500 bg-red-50 text-red-950',
          warning: 'border-amber-500 bg-amber-50 text-amber-950',
          info: 'border-blue-500 bg-blue-50 text-blue-950',
        }[toast.type];

        return (
          <div
            key={toast.id}
            onClick={() => onRemove(toast.id)}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border-l-4 shadow-lg bg-white border border-slate-200 cursor-pointer transition-transform hover:scale-[1.02] ${border}`}
          >
            {icon}
            <div className="flex-1 text-sm">
              {toast.title && <div className="font-bold">{toast.title}</div>}
              <div className="text-slate-700 leading-snug">{toast.message}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
