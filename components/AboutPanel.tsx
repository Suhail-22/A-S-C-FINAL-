
import React from 'react';

interface AboutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutPanel: React.FC<AboutPanelProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed top-0 bottom-0 right-0 w-[320px] max-w-[85vw] bg-[var(--bg-panel)] text-[var(--text-primary)] z-50 p-5 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out border-l-2 border-[var(--border-primary)] transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[var(--accent-color)] text-2xl font-bold">ℹ️ حول Abo Suhail Calculator</h2>
        <button onClick={onClose} className="text-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">✕</button>
      </div>
      <div className="bg-[var(--bg-inset-light)] rounded-2xl p-4 mb-6 border border-[var(--border-secondary)]">
          <p className="text-[var(--text-secondary)] leading-relaxed text-base font-semibold text-center mb-4">مرحباً بك في مستقبل الحسابات!</p>
          <p className="text-[var(--text-secondary)] leading-relaxed text-base mb-4">هذه ليست مجرد آلة حاسبة، بل هي مساعدك الذكي المصمم لجعل الأرقام تعمل من أجلك.</p>
          <h4 className="text-[var(--text-primary)] font-bold mb-2">أبرز الميزات:</h4>
          <ul className='list-disc list-inside space-y-2 text-[var(--text-secondary)]'>
              <li><strong className="text-[var(--text-primary)]">🧠 تصحيح ذكي:</strong> مدعومة من Gemini AI، تقوم الآلة الحاسبة تلقائياً باكتشاف الأخطاء وتقديم إصلاحات فورية.</li>
              <li><strong className="text-[var(--text-primary)]">💰 حسابات ضريبية متقدمة:</strong> أوضاع ضريبية قابلة للتخصيص بالكامل، سواء لإضافة ضريبة القيمة المضافة أو استخلاصها.</li>
              <li><strong className="text-[var(--text-primary)]">📜 سجل شامل:</strong> لا تفقد أي عملية مرة أخرى. أضف ملاحظات، وصدّر بياناتك كملفات TXT أو CSV.</li>
              <li><strong className="text-[var(--text-primary)]">🎨 تخصيص عميق:</strong> اختر بين المظاهر، غيّر الخطوط، وحتى لون نص الأزرار.</li>
              <li><strong className="text-[var(--text-primary)]">🌐 تطبيق ويب تقدمي (PWA):</strong> ثبّت الآلة الحاسبة على جهازك واستخدمها بدون اتصال بالإنترنت.</li>
          </ul>
      </div>
      <div className="text-center text-sm text-gray-400 dark:text-gray-500">
        الإصدار 1.7.0 © 2025
      </div>
    </div>
  );
};

export default AboutPanel;
