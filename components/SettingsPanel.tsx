import React, { useState } from 'react';
import { TaxSettings } from '../types';
import Icon from './Icon';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    vibrationEnabled: boolean;
    setVibrationEnabled: (enabled: boolean) => void;
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    taxSettings: TaxSettings;
    setTaxSettings: React.Dispatch<React.SetStateAction<TaxSettings>>;
    maxHistory: number;
    setMaxHistory: (value: number) => void;
    orientation: 'auto' | 'portrait';
    setOrientation: (value: 'auto' | 'portrait') => void;
  };
  theme: string;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
  buttonTextColor: string | null;
  setButtonTextColor: (color: string | null) => void;
  borderColor: string | null;
  setBorderColor?: (color: string | null) => void;
  numberBtnColor?: string | null;
  setNumberBtnColor?: (color: string | null) => void;
  funcBtnColor?: string | null;
  setFuncBtnColor?: (color: string | null) => void;
  calcBgColor?: string | null;
  setCalcBgColor?: (color: string | null) => void;
  onOpenSupport: () => void;
  onShowAbout: () => void;
  onCheckForUpdates: () => void;
  deferredPrompt?: any;
  onInstallApp?: () => void;
}

const convertArabicNumerals = (str: string | number): string => {
    if (typeof str !== 'string' && typeof str !== 'number') return '';
    return String(str)
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1632))
        .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1776));
};

// Helper component for Collapsible Sections
const SettingsSection = ({ title, isOpen, onToggle, children, icon }: { title: string, isOpen: boolean, onToggle: () => void, children?: React.ReactNode, icon?: string }) => (
    <div className="mb-3 border border-[var(--border-secondary)] rounded-xl bg-[var(--bg-inset-light)] overflow-hidden transition-all duration-300">
        <button 
            onClick={onToggle}
            className="w-full flex items-center justify-between p-3 text-right font-bold text-[var(--text-primary)] hover:bg-[var(--bg-inset)] transition-colors"
        >
            <span className="flex items-center gap-2">{icon} {title}</span>
            <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
        </button>
        <div className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-3 pt-0 border-t border-[var(--border-secondary)] border-opacity-30">
                {children}
            </div>
        </div>
    </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, theme, onThemeChange, fontFamily, setFontFamily, fontScale, setFontScale, buttonTextColor, setButtonTextColor, borderColor, setBorderColor, numberBtnColor, setNumberBtnColor, funcBtnColor, setFuncBtnColor, calcBgColor, setCalcBgColor, onOpenSupport, onShowAbout, onCheckForUpdates, deferredPrompt, onInstallApp }) => {
  const { vibrationEnabled, setVibrationEnabled, soundEnabled, setSoundEnabled, taxSettings, setTaxSettings, maxHistory, setMaxHistory, orientation, setOrientation } = settings;
  
  // State to track which section is expanded
  const [expandedSection, setExpandedSection] = useState<string | null>('appearance');

  const toggleSection = (section: string) => {
      setExpandedSection(expandedSection === section ? null : section);
  };
  
  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setTaxSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const westernValue = convertArabicNumerals(e.target.value);
     if (/^\d*\.?\d*$/.test(westernValue)) {
        setTaxSettings(prev => ({...prev, rate: Number(westernValue) }));
     }
  };

  return (
    <div className={`fixed top-0 bottom-0 right-0 w-[320px] max-w-[85vw] bg-[var(--bg-panel)] text-[var(--text-primary)] z-50 p-5 shadow-2xl overflow-y-auto border-l-2 border-[var(--border-primary)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[var(--accent-color)] text-2xl font-bold">⚙️ الإعدادات</h3>
        <button onClick={onClose} className="text-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">✕</button>
      </div>
      
      {deferredPrompt && onInstallApp && (
        <div className="mb-6 animate-bounce-in-up">
           <button onClick={onInstallApp} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl py-3 font-bold text-lg shadow-lg hover:from-blue-700 transition-all flex items-center justify-center gap-2">
             📲 تثبيت التطبيق على الجهاز
           </button>
        </div>
      )}

      {/* --- Appearance & Colors Section (Main Collapsible) --- */}
      <SettingsSection 
        title="تخصيص المظهر والألوان" 
        icon="🎨"
        isOpen={expandedSection === 'appearance'} 
        onToggle={() => toggleSection('appearance')}
      >
        {/* Tab 1: Theme & Fonts */}
        <div className="mb-4">
            <h5 className="text-sm font-bold text-[var(--text-secondary)] mb-2 border-b border-[var(--border-secondary)] pb-1">النسق والخطوط</h5>
            
            {/* Theme Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <button onClick={() => onThemeChange('light')} className={`py-1.5 rounded-lg text-xs transition-all border border-[var(--border-secondary)] ${theme === 'light' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] font-bold border-transparent' : ''}`}>فاتح</button>
                <button onClick={() => onThemeChange('dark')} className={`py-1.5 rounded-lg text-xs transition-all border border-[var(--border-secondary)] ${theme === 'dark' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] font-bold border-transparent' : ''}`}>داكن</button>
                <button onClick={() => onThemeChange('system')} className={`py-1.5 rounded-lg text-xs transition-all border border-[var(--border-secondary)] ${theme === 'system' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] font-bold border-transparent' : ''}`}>نظام</button>
            </div>

            {/* Font Selection */}
            <div className="mb-3">
                <label htmlFor="font-family-select" className="block text-[var(--text-secondary)] mb-1 text-xs">نوع الخط:</label>
                <select id="font-family-select" value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full p-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-panel)] text-[var(--text-primary)] text-sm">
                    <option value='Tajawal'>Tajawal (افتراضي)</option>
                    <option value='Cairo'>Cairo</option>
                    <option value='Almarai'>Almarai</option>
                </select>
            </div>

            {/* Font Scale */}
            <div className="mb-2">
                <label htmlFor="font-size-slider" className="block text-[var(--text-secondary)] mb-1 text-xs">{`حجم الخط: (${Math.round(fontScale * 100)}%)`}</label>
                <input id="font-size-slider" type='range' min='0.85' max='1.15' step='0.05' value={fontScale} onChange={e => setFontScale(parseFloat(e.target.value))} className='w-full h-1.5 bg-[var(--bg-panel)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]' />
            </div>
        </div>

        {/* Tab 2: Structure Colors */}
        <div className="mb-4">
             <h5 className="text-sm font-bold text-[var(--text-secondary)] mb-2 border-b border-[var(--border-secondary)] pb-1">ألوان الهيكل</h5>
             
             {/* Calculator Body Background */}
            <div className="flex justify-between items-center mb-2">
                <label className="text-[var(--text-primary)] text-xs">لون الخلفية:</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={calcBgColor || '#050A14'} onChange={e => setCalcBgColor && setCalcBgColor(e.target.value)} className="w-8 h-6 p-0 rounded border-none bg-transparent cursor-pointer" />
                    <button onClick={() => setCalcBgColor && setCalcBgColor(null)} className={`text-xs text-[var(--accent-color)] ${!calcBgColor ? 'opacity-50' : ''}`} disabled={!calcBgColor}>↺</button>
                </div>
            </div>

            {/* Border Color */}
            <div className="flex justify-between items-center mb-2">
                <label className="text-[var(--text-primary)] text-xs">لون الإطار:</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={borderColor || '#1A2B4D'} onChange={e => setBorderColor && setBorderColor(e.target.value)} className="w-8 h-6 p-0 rounded border-none bg-transparent cursor-pointer" />
                    <button onClick={() => setBorderColor && setBorderColor(null)} className={`text-xs text-[var(--accent-color)] ${!borderColor ? 'opacity-50' : ''}`} disabled={!borderColor}>↺</button>
                </div>
            </div>
        </div>

        {/* Tab 3: Button Colors */}
        <div>
             <h5 className="text-sm font-bold text-[var(--text-secondary)] mb-2 border-b border-[var(--border-secondary)] pb-1">ألوان الأزرار</h5>
             
             {/* Number Btn Color */}
            <div className="flex justify-between items-center mb-2">
                <label className="text-[var(--text-primary)] text-xs">خلفية الأرقام:</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={numberBtnColor || '#101B35'} onChange={e => setNumberBtnColor && setNumberBtnColor(e.target.value)} className="w-8 h-6 p-0 rounded border-none bg-transparent cursor-pointer" />
                    <button onClick={() => setNumberBtnColor && setNumberBtnColor(null)} className={`text-xs text-[var(--accent-color)] ${!numberBtnColor ? 'opacity-50' : ''}`} disabled={!numberBtnColor}>↺</button>
                </div>
            </div>

             {/* Func Btn Color */}
             <div className="flex justify-between items-center mb-2">
                <label className="text-[var(--text-primary)] text-xs">خلفية العمليات:</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={funcBtnColor || '#1A2B4D'} onChange={e => setFuncBtnColor && setFuncBtnColor(e.target.value)} className="w-8 h-6 p-0 rounded border-none bg-transparent cursor-pointer" />
                    <button onClick={() => setFuncBtnColor && setFuncBtnColor(null)} className={`text-xs text-[var(--accent-color)] ${!funcBtnColor ? 'opacity-50' : ''}`} disabled={!funcBtnColor}>↺</button>
                </div>
            </div>

            {/* Text Color */}
            <div className="flex justify-between items-center mb-2">
                <label className="text-[var(--text-primary)] text-xs">لون النص:</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={buttonTextColor || '#ffffff'} onChange={e => setButtonTextColor(e.target.value)} className="w-8 h-6 p-0 rounded border-none bg-transparent cursor-pointer" />
                    <button onClick={() => setButtonTextColor(null)} className={`text-xs text-[var(--accent-color)] ${!buttonTextColor ? 'opacity-50' : ''}`} disabled={!buttonTextColor}>↺</button>
                </div>
            </div>
        </div>
      </SettingsSection>

      {/* --- Tax Settings Section --- */}
      <SettingsSection 
        title="إعدادات الضريبة" 
        icon="💰"
        isOpen={expandedSection === 'tax'} 
        onToggle={() => toggleSection('tax')}
      >
        <label className="flex items-center mb-4 text-[var(--text-secondary)] font-bold text-sm">
          <input type="checkbox" name="isEnabled" checked={taxSettings.isEnabled} onChange={handleTaxChange} className="ml-3 w-5 h-5 accent-[var(--accent-color)]" />
          تفعيل حساب الضريبة
        </label>
        <div className={`transition-opacity ${taxSettings.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <label className={`flex items-center mb-4 text-[var(--text-secondary)] text-sm`}>
                <input type="checkbox" name="showTaxPerNumber" checked={taxSettings.showTaxPerNumber} onChange={handleTaxChange} disabled={!taxSettings.isEnabled} className="ml-3 w-5 h-5 accent-[var(--accent-color)]" />
                عرض الضريبة فوق كل رقم
            </label>
            <select name="mode" value={taxSettings.mode} onChange={handleTaxChange} className="w-full p-2.5 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-panel)] text-[var(--text-primary)] mb-4 text-sm">
              <option value="add-15">إضافة 15%</option>
              <option value="extract-custom">استخلاص نسبة مخصصة</option>
              <option value="divide-93">القسمة على 0.93</option>
              <option value="custom">إضافة نسبة مخصصة</option>
            </select>
            {['custom', 'extract-custom'].includes(taxSettings.mode) && (
              <div className="flex items-center justify-between mb-4 animate-fade-in-down">
                <label className="text-[var(--text-secondary)] text-sm">النسبة المئوية:</label>
                <input 
                    type="text" 
                    inputMode="decimal"
                    value={taxSettings.rate} 
                    onChange={handleTaxRateChange} 
                    onBlur={() => setTaxSettings(prev => ({...prev, rate: parseFloat(String(prev.rate)) || 0 }))}
                    placeholder="%" 
                    className="w-24 p-2 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-panel)] text-[var(--text-primary)] text-sm text-center direction-ltr" 
                />
              </div>
            )}
        </div>
      </SettingsSection>

      {/* --- General Settings Section --- */}
      <SettingsSection 
        title="إعدادات عامة" 
        icon="🛠️"
        isOpen={expandedSection === 'general'} 
        onToggle={() => toggleSection('general')}
      >
         {/* Orientation */}
         <div className="mb-4">
             <h6 className="text-xs text-[var(--text-secondary)] mb-2">اتجاه الشاشة</h6>
             <div className="flex gap-2">
                <button onClick={() => setOrientation('auto')} className={`flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all border border-[var(--border-secondary)] ${orientation === 'auto' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] border-transparent' : 'opacity-80'}`}>
                    <Icon name="rotate" className="w-3 h-3" /> تلقائي
                </button>
                <button onClick={() => setOrientation('portrait')} className={`flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all border border-[var(--border-secondary)] ${orientation === 'portrait' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] border-transparent' : 'opacity-80'}`}>
                    <Icon name="lock_portrait" className="w-3 h-3" /> عمودي
                </button>
            </div>
         </div>

        <label className="flex items-center justify-between text-[var(--text-secondary)] text-sm mb-4">
          <span>الحد الأقصى للسجل:</span>
          <input type="number" value={maxHistory} onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val > 0 && val <= 500) {
                setMaxHistory(val);
              }
            }} min="1" max="500" className="w-20 p-1.5 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-panel)] text-[var(--text-primary)] text-center text-sm"
          />
        </label>
        <label className="flex items-center justify-between text-[var(--text-secondary)] text-sm mb-4">
          <span>تفعيل الاهتزاز</span>
          <input type="checkbox" checked={vibrationEnabled} onChange={(e) => setVibrationEnabled(e.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
        </label>
        <label className="flex items-center justify-between text-[var(--text-secondary)] text-sm">
          <span>تفعيل المؤثرات الصوتية</span>
          <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
        </label>
      </SettingsSection>

      <div className="mt-6 flex flex-col gap-3">
        <button onClick={onCheckForUpdates} className="w-full py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] font-bold text-base hover:brightness-95 transition-colors">✨ التحقق من التحديثات</button>
        <button onClick={onShowAbout} className="w-full py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] font-bold text-base hover:brightness-95 transition-colors">ℹ️ حول الآلة الحاسبة</button>
        <button onClick={onOpenSupport} className="w-full bg-gradient-to-br from-green-600/50 to-green-700/60 text-white border border-green-400/80 rounded-xl py-3 font-bold text-lg shadow-[0_5px_12px_rgba(0,0,0,0.35),0_0_18px_rgba(100,220,100,0.35)] mt-3 hover:from-green-600/60 transition-colors">💬 تواصل مع الدعم</button>
      </div>
    </div>
  );
};

export default SettingsPanel;