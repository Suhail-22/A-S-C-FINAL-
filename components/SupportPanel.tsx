
import React from 'react';

interface SupportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const sendSupportMessage = () => {
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd3Wx_1HGEUGRRqUP411cn_hQyR6lxvxw18F2Tb5rC-NPwiGw/viewform';
    window.open(formUrl, '_blank');
};

const SupportPanel: React.FC<SupportPanelProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed top-0 bottom-0 left-0 w-[320px] max-w-[85vw] bg-[var(--bg-panel)] text-[var(--text-primary)] z-50 p-5 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out border-r-2 border-[var(--border-primary)] transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[var(--accent-color)] text-2xl font-bold">💬 دعم Abo Suhail Calculator</h2>
        <button onClick={onClose} className="text-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">✕</button>
      </div>
      <div className="bg-[var(--bg-inset-light)] rounded-2xl p-4 mb-6 border border-[var(--border-secondary)]">
        <p className="text-[var(--text-secondary)] leading-relaxed text-base">
            مرحبًا! 👋 نحن متحمسون لسماع رأيك. يمكنك إرسال أي ملاحظة، اقتراح، أو بلاغ عن مشكلة.
            <br /><br />
            <span className="text-[var(--accent-color)] font-bold">✓ سيتم فتح نموذج دعم رسمي لإرسال رسالتك!</span>
        </p>
      </div>
      <button onClick={() => { sendSupportMessage(); onClose(); }} className="w-full bg-gradient-to-br from-green-600/80 to-green-700/90 text-white border border-green-400/80 rounded-2xl p-4 text-lg font-bold cursor-pointer shadow-[0_7px_16px_rgba(0,0,0,0.35),0_0_22px_rgba(100,220,100,0.35)] hover:from-green-600">
        فتح نموذج الدعم الآن
      </button>
    </div>
  );
};

export default SupportPanel;