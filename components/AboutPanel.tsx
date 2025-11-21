
import React from 'react';
import Icon from './Icon';

interface AboutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutPanel: React.FC<AboutPanelProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Main Content Card */}
      <div className={`relative w-full max-w-[360px] bg-[#050A14] border border-[#FFD700]/30 rounded-3xl p-6 shadow-2xl transform transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}>
        
        {/* Gold Glow Effect */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#FFD700]/20 blur-3xl rounded-full pointer-events-none"></div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors">
           ✕
        </button>

        {/* Logo & Branding */}
        <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 mb-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl border border-[#FFD700]/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.15)]">
                {/* Stylized Calculator Icon */}
                <svg className="w-10 h-10 text-[#FFD700]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1">Abo Suhail Calculator</h2>
            <p className="text-[#FFD700] text-lg font-serif italic tracking-wider opacity-90">𝒜𝒷ℴ 𝒮𝓊𝒽𝒶𝒾𝓁</p>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent mb-6"></div>

        {/* Features List */}
        <div className="space-y-3 text-right mb-8">
            <div className="flex items-center justify-end gap-3 text-gray-300 text-sm">
                <span>تصحيح ذكي للأخطاء</span>
                <span className="text-[#FFD700]">✨</span>
            </div>
            <div className="flex items-center justify-end gap-3 text-gray-300 text-sm">
                <span>حسابات ضريبية دقيقة</span>
                <span className="text-[#FFD700]">📊</span>
            </div>
            <div className="flex items-center justify-end gap-3 text-gray-300 text-sm">
                <span>يعمل بدون إنترنت</span>
                <span className="text-[#FFD700]">📡</span>
            </div>
            <div className="flex items-center justify-end gap-3 text-gray-300 text-sm">
                <span>تخصيص شامل للمظهر</span>
                <span className="text-[#FFD700]">🎨</span>
            </div>
        </div>

        {/* Footer */}
        <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-[2px]">Premium Edition</p>
            <p className="text-[10px] text-gray-600 mt-1">Version 2.0.0</p>
        </div>

      </div>
    </div>
  );
};

export default AboutPanel;
