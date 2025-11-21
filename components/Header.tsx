
import React from 'react';
import Icon from './Icon';
import { TaxSettings } from '../types';

interface HeaderProps {
  taxSettings: TaxSettings;
  onToggleSettings: () => void;
  onShare: () => void;
  onToggleHistory: () => void;
  historyCount: number;
  entryCountDisplay: number;
}

const HeaderButton: React.FC<{ onClick: () => void; children: React.ReactNode; 'aria-label': string }> = ({ onClick, children, 'aria-label': ariaLabel }) => (
  <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-12 h-12 flex items-center justify-center rounded-[10px] bg-[var(--bg-inset)] text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--bg-inset-light)] hover:text-[var(--text-primary)] shadow-sm"
  >
    {children}
  </button>
);

const Header: React.FC<HeaderProps> = ({ taxSettings, onToggleSettings, onShare, onToggleHistory, historyCount, entryCountDisplay }) => {
  const { isEnabled, rate, mode } = taxSettings;

  const getTaxRateLabel = () => {
    if (!isEnabled) return '---';
    const displayRate = rate || 0;
    switch (mode) {
      case 'add-15': return '+15%';
      case 'divide-93': return '/0.93';
      case 'custom': return `+${displayRate}%`;
      case 'extract-custom': return `-${displayRate}%`;
      default: return `${displayRate}%`;
    }
  };

  return (
    <div className="flex justify-between items-center p-3 rounded-[var(--button-radius)] mb-4 bg-[var(--bg-header)] border border-[var(--border-primary)] backdrop-blur-sm">
      
      <div className="flex items-center gap-2">
        <HeaderButton onClick={onToggleSettings} aria-label="فتح الإعدادات"><Icon name='settings' /></HeaderButton>
        
        {/* Entry Count Box - Styled identical to Settings Button for consistency */}
        <div className="w-12 h-12 flex flex-col items-center justify-center rounded-[10px] bg-[var(--bg-inset)] text-[var(--text-secondary)] shadow-sm">
           <Icon name="list" className="w-5 h-5 opacity-70 mb-0.5" />
           <span className="text-[10px] font-bold text-[var(--text-primary)] leading-none">{entryCountDisplay}</span>
        </div>
      </div>

      {/* Tax Label - Centered or Flexible */}
      <div className={`text-sm py-1 px-2.5 rounded-[8px] bg-[var(--bg-inset)] text-[var(--text-secondary)] whitespace-nowrap transition-opacity duration-300 flex items-center gap-1 ${isEnabled ? 'opacity-100' : 'opacity-60'}`}>
         <span className="text-[11px] opacity-80">الضريبة:</span>
         <span className="font-bold text-[var(--text-primary)] inline-block" dir="ltr">{getTaxRateLabel()}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <HeaderButton onClick={onToggleHistory} aria-label="فتح السجل"><Icon name='history' /></HeaderButton>
          {historyCount > 0 && <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none animate-pop-in">{historyCount > 99 ? '99+' : historyCount}</span>}
        </div>
        <HeaderButton onClick={onShare} aria-label="مشاركة النتيجة"><Icon name='share' /></HeaderButton>
      </div>
    </div>
  );
};

export default Header;
