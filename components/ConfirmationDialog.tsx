
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
      {/* Background Overlay is handled by the component below, but we need the click handler */}
      <div className="absolute inset-0 pointer-events-auto" onClick={onCancel}></div> 
      
      <Overlay show={isOpen} onClick={onCancel} zIndex='z-50' />
      
      <div
        className="relative w-full max-w-[400px] max-h-[85vh] bg-[var(--bg-panel)] text-[var(--text-primary)] z-[70] p-6 rounded-3xl shadow-2xl border border-[var(--border-primary)] flex flex-col animate-bounce-in-up overflow-hidden pointer-events-auto"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <h3 id="dialog-title" className="text-[var(--accent-color)] text-2xl font-bold mb-4 shrink-0">{title}</h3>
        
        <div className="overflow-y-auto custom-scrollbar mb-6 pr-1">
            <p id="dialog-message" className="text-[var(--text-secondary)] text-base leading-relaxed break-words whitespace-pre-wrap">
                {message}
            </p>
        </div>

        <div className="flex justify-end gap-3 shrink-0">
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
    </div>
  );
};

export default ConfirmationDialog;
