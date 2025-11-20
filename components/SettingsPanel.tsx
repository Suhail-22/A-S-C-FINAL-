
import React from 'react';
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

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, theme, onThemeChange, fontFamily, setFontFamily, fontScale, setFontScale, buttonTextColor, setButtonTextColor, onOpenSupport, onShowAbout, onCheckForUpdates, deferredPrompt, onInstallApp }) => {
  const { vibrationEnabled, setVibrationEnabled, soundEnabled, setSoundEnabled, taxSettings, setTaxSettings, maxHistory, setMaxHistory, orientation, setOrientation } = settings;
  
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

      <div className="mb-6">
        <h4 className="text-lg font-semibold text-[var(--text-secondary)] mb-3">🎨 المظهر</h4>
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[var(--bg-inset)]">
          <button onClick={() => onThemeChange('light')} className={`py-2 rounded-lg text-sm transition-all ${theme === 'light' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] font-bold' : ''}`}>فاتح</button>
          <button onClick={() => onThemeChange('dark')} className={`py-2 rounded-lg text-sm transition-all ${theme === 'dark' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] font-bold' : ''}`}>داكن</button>
          <button onClick={() => onThemeChange('system')} className={`py-2 rounded-lg text-sm transition-all ${theme === 'system' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] font-bold' : ''}`}>حسب النظام</button>
        </div>
      </div>
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-[var(--text-secondary)] mb-3">📱 اتجاه الشاشة</h4>
        <div className="flex gap-2 p-1 rounded-xl bg-[var(--bg-inset)]">
            <button onClick={() => setOrientation('auto')} className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${orientation === 'auto' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] font-bold' : 'opacity-70'}`}>
                 <Icon name="rotate" className="w-4 h-4" /> تلقائي
            </button>
            <button onClick={() => setOrientation('portrait')} className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${orientation === 'portrait' ? 'bg-[var(--accent-color)] text-[var(--accent-color-contrast)] font-bold' : 'opacity-70'}`}>
                 <Icon name="lock_portrait" className="w-4 h-4" /> عمودي
            </button>
        </div>
      </div>
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-[var(--text-secondary)] mb-3">✒️ الخطوط</h4>
        <div className="mb-4">
            <label htmlFor="font-family-select" className="block text-[var(--text-secondary)] mb-2 text-sm">نوع الخط:</label>
            <select id="font-family-select" value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full p-2.5 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] text-base">
                <option value='Tajawal'>Tajawal (افتراضي)</option>
                <option value='Cairo'>Cairo</option>
                <option value='Almarai'>Almarai</option>
            </select>
        </div>
        <div className="mb-4">
            <label htmlFor="font-size-slider" className="block text-[var(--text-secondary)] mb-2 text-sm">{`حجم الخط: (${Math.round(fontScale * 100)}%)`}</label>
            <input id="font-size-slider" type='range' min='0.85' max='1.15' step='0.05' value={fontScale} onChange={e => setFontScale(parseFloat(e.target.value))} className='w-full h-2 bg-[var(--bg-inset)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]' />
        </div>
        <div className="mt-4">
            <label htmlFor="button-text-color-picker" className="flex justify-between items-center text-[var(--text-secondary)] text-sm mb-2">
                <span>لون خط الأزرار:</span>
                <button onClick={() => setButtonTextColor(null)} className={`text-xs text-[var(--accent-color)] hover:underline ${!buttonTextColor ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!buttonTextColor}>إعادة تعيين</button>
            </label>
            <div className="relative">
                <input id="button-text-color-picker" type="color" value={buttonTextColor || '#ffffff'} onChange={e => setButtonTextColor(e.target.value)} className="w-full h-10 p-1 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-inset)] cursor-pointer" />
            </div>
        </div>
      </div>
      <hr className="border-[var(--border-secondary)] my-4" />
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-[var(--text-secondary)] mb-3">💰 إعدادات الضريبة</h4>
        <label className="flex items-center mb-4 text-[var(--text-secondary)] font-bold">
          <input type="checkbox" name="isEnabled" checked={taxSettings.isEnabled} onChange={handleTaxChange} className="ml-3 w-5 h-5 accent-[var(--accent-color)]" />
          تفعيل حساب الضريبة
        </label>
        <div className={`transition-opacity ${taxSettings.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <label className={`flex items-center mb-4 text-[var(--text-secondary)]`}>
                <input type="checkbox" name="showTaxPerNumber" checked={taxSettings.showTaxPerNumber} onChange={handleTaxChange} disabled={!taxSettings.isEnabled} className="ml-3 w-5 h-5 accent-[var(--accent-color)]" />
                عرض الضريبة فوق كل رقم
            </label>
            <select name="mode" value={taxSettings.mode} onChange={handleTaxChange} className="w-full p-2.5 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] mb-4 text-base">
              <option value="add-15">إضافة 15%</option>
              <option value="extract-custom">استخلاص نسبة مخصصة</option>
              <option value="divide-93">القسمة على 0.93</option>
              <option value="custom">إضافة نسبة مخصصة</option>
            </select>
            {['custom', 'extract-custom'].includes(taxSettings.mode) && (
              <div className="flex items-center justify-between mb-4 animate-fade-in-down">
                <label className="text-[var(--text-secondary)]">النسبة المئوية:</label>
                <input 
                    type="text" 
                    inputMode="decimal"
                    value={taxSettings.rate} 
                    onChange={handleTaxRateChange} 
                    onBlur={() => setTaxSettings(prev => ({...prev, rate: parseFloat(String(prev.rate)) || 0 }))}
                    placeholder="%" 
                    className="w-24 p-2.5 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] text-base text-center direction-ltr" 
                />
              </div>
            )}
        </div>
      </div>
       <div className="mb-6">
        <h4 className="text-lg font-semibold text-[var(--text-secondary)] mb-3">⚙️ إعدادات عامة</h4>
        <label className="flex items-center justify-between text-[var(--text-secondary)] mb-4">
          <span>الحد الأقصى للسجل:</span>
          <input type="number" value={maxHistory} onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val > 0 && val <= 500) {
                setMaxHistory(val);
              }
            }} min="1" max="500" className="w-24 p-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] text-center"
          />
        </label>
        <label className="flex items-center justify-between text-[var(--text-secondary)] mb-4">
          <span>تفعيل الاهتزاز عند الضغط</span>
          <input type="checkbox" checked={vibrationEnabled} onChange={(e) => setVibrationEnabled(e.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
        </label>
        <label className="flex items-center justify-between text-[var(--text-secondary)]">
          <span>تفعيل المؤثرات الصوتية</span>
          <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="w-5 h-5 accent-[var(--accent-color)]" />
        </label>
      </div>
      <hr className="border-[var(--border-secondary)] my-4" />
      <div className="flex flex-col gap-3">
        <button onClick={onCheckForUpdates} className="w-full py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] font-bold text-base hover:brightness-95">✨ التحقق من التحديثات</button>
        <button onClick={onShowAbout} className="w-full py-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] font-bold text-base hover:brightness-95">ℹ️ حول الآلة الحاسبة</button>
        <button onClick={onOpenSupport} className="w-full bg-gradient-to-br from-green-600/50 to-green-700/60 text-white border border-green-400/80 rounded-xl py-3 font-bold text-lg shadow-[0_5px_12px_rgba(0,0,0,0.35),0_0_18px_rgba(100,220,100,0.35)] mt-3 hover:from-green-600/60">💬 تواصل مع الدعم</button>
      </div>
    </div>
  );
};

export default SettingsPanel;
