
import React from 'react';
import Overlay from './Overlay';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;

  return (
    <>
      <Overlay show={isOpen} onClick={onCancel} zIndex='z-50' />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[400px] bg-[var(--bg-panel)] text-[var(--text-primary)] z-[60] p-6 rounded-3xl shadow-2xl border border-[var(--border-primary)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] animate-bounce-in-up"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <h3 id="dialog-title" className="text-[var(--accent-color)] text-2xl font-bold mb-4">{title}</h3>
        <p id="dialog-message" className="text-[var(--text-secondary)] mb-6 text-base leading-relaxed break-all">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="py-2 px-6 rounded-xl bg-[var(--bg-inset)] text-[var(--text-secondary)] font-bold hover:brightness-95 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-6 rounded-xl bg-red-600 text-white font-bold shadow-lg hover:bg-red-700 transition-colors"
          >
            تأكيد
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmationDialog;
