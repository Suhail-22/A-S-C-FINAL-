
import React, { useState, useEffect, useRef } from 'react';
import { TaxSettings, ErrorState, AISuggestion } from '../types';
import { parseExpression, preprocessExpression } from '../services/calculationEngine';

interface DisplayProps {
  input: string;
  taxSettings: TaxSettings;
  error: ErrorState | null;
  aiSuggestion: AISuggestion | null;
  onApplyAiFix: () => void;
  isCalculationExecuted: boolean;
  lastExpression: string | null;
  onUpdateInput: (value: string) => void;
}

const calculateTaxForNumber = (numStr: string, settings: TaxSettings) => {
    const num = parseFloat(numStr);
    if (isNaN(num)) return '';
    let taxValue = 0;
    const { mode, rate } = settings;
    switch(mode) {
        case 'add-15': taxValue = num * 0.15; break;
        case 'custom': taxValue = num * (rate / 100); break;
        case 'divide-93': taxValue = (num / 0.93) - num; break;
        default: return '';
    }
    return taxValue.toLocaleString('en-US', { maximumFractionDigits: 2, useGrouping: false });
};

const renderPreviewWithTax = (text: string, settings: TaxSettings) => {
  if (!settings.isEnabled || !settings.showTaxPerNumber || !text) return text;
  const parts = text.split(/([0-9.]+)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (/[0-9.]+/.test(part) && !isNaN(parseFloat(part))) {
          const tax = calculateTaxForNumber(part, settings);
          return (
            <span key={index} className="relative inline-block mx-px pt-5">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-yellow-400 bg-gray-900/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                {tax}
              </span>
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

const Display: React.FC<DisplayProps> = ({ input, taxSettings, error, aiSuggestion, onApplyAiFix, isCalculationExecuted, lastExpression, onUpdateInput }) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditing, input]);

  let liveResult = '0';
  let taxAmount = '';
  let totalWithTax = '';
  let preview = isCalculationExecuted ? lastExpression : input;
  
  if (error) {
    liveResult = '...';
  } else if (isCalculationExecuted) {
    liveResult = input;
  } else {
    try {
      const processedExpr = preprocessExpression(input);
      // Replaced lookbehind `(?<=^|\()(\+)` with compatible version `(^|\()(\+)`
      const safeExpr = processedExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/(^|\()(\+)/g, '$1');
      const result = parseExpression(safeExpr);
      if (!isNaN(result) && isFinite(result)) {
        liveResult = result.toLocaleString('en-US', {maximumFractionDigits: 10, useGrouping: false});
      }
    } catch (e) {
      liveResult = '...';
    }
  }
  
  if (taxSettings.isEnabled && !isNaN(parseFloat(liveResult))) {
      const numResult = parseFloat(liveResult);
      let taxValue = 0;
      let secondaryValue = 0;
      let secondaryLabel = 'الإجمالي';
      const { mode, rate } = taxSettings;

      switch(mode) {
          case 'add-15':
              taxValue = numResult * 0.15;
              secondaryValue = numResult + taxValue;
              break;
          case 'custom':
              taxValue = numResult * (rate / 100);
              secondaryValue = numResult + taxValue;
              break;
          case 'extract-custom':
              secondaryValue = numResult / (1 + (rate / 100));
              taxValue = numResult - secondaryValue;
              secondaryLabel = 'الأصل';
              break;
          case 'divide-93':
              secondaryValue = numResult / 0.93;
              taxValue = secondaryValue - numResult;
              break;
      }
      const taxLabel = 'الضريبة';
      taxAmount = `${taxLabel}: ${taxValue.toLocaleString('en-US', {maximumFractionDigits: 2, useGrouping: false})}`;
      // Fixed: Removed duplicate label
      totalWithTax = `${secondaryLabel}: ${secondaryValue.toLocaleString('en-US', {maximumFractionDigits: 2, useGrouping: false})}`;
  }

  const displayBorderClass = error || aiSuggestion ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 shadow-[0_0_20px_rgba(255,61,0,0.7)]' : '';
  
  const renderHighlightedExpression = () => {
    let content;
    if (error?.details) {
        const { pre, highlight, post } = error.details;
        content = <>{pre}<span className='text-red-500 bg-red-500/20 rounded-md px-1 error-highlight'>{highlight}</span>{post}</>;
    } else if (taxSettings.showTaxPerNumber && preview) {
        content = renderPreviewWithTax(preview, taxSettings);
    } else {
        content = preview || ' ';
    }

    if (aiSuggestion?.fix) {
        return <span className='ai-suggestion-highlight'>{content}</span>;
    }
    
    return content;
  };

  // Calculate Dynamic Font Size based on length
  const getFontSize = (text: string) => {
      const len = text.length;
      if (len > 20) return 'text-2xl'; // Very small for huge numbers
      if (len > 15) return 'text-3xl';
      if (len > 11) return 'text-4xl';
      if (len > 9) return 'text-5xl';
      return 'text-6xl'; // Default large size
  };

  const fontSizeClass = getFontSize(liveResult);
  
  return (
    <div className="relative p-4 bg-[var(--bg-display)] rounded-[25px] mb-4 border border-[var(--border-primary)] shadow-[inset_0_4px_10px_rgba(0,0,0,0.08)] min-h-[220px] flex flex-col justify-between">
      <div className={`absolute inset-0 -z-10 rounded-[22px] transition-all duration-300 ${displayBorderClass}`} />
      <div className="px-1.5 flex flex-col justify-end flex-grow">
        <div className="text-xl text-[var(--text-secondary)] mb-1 text-left direction-ltr break-all min-h-[30px]" onClick={() => !isCalculationExecuted && setIsEditing(true)}>
            {isEditing ? (
                 <textarea
                    ref={textareaRef}
                    value={preview || ''}
                    onChange={(e) => onUpdateInput(e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    className="w-full bg-transparent border-none outline-none resize-none text-xl opacity-70 text-left direction-ltr p-0 m-0 leading-normal text-[var(--text-display)]"
                    rows={1}
                />
            ) : (
                renderHighlightedExpression()
            )}
        </div>
        <div key={liveResult} className={`${fontSizeClass} mt-auto font-bold text-center direction-ltr overflow-x-auto whitespace-nowrap text-[var(--text-display)] scrollbar-hide leading-tight transition-all duration-200`} style={{ textShadow: 'var(--display-text-shadow, none)' }}>
          <span className="inline-block animate-pop-in">{liveResult}</span>
        </div>
      </div>
      <div className="relative h-12"> 
        <div key={taxAmount + totalWithTax} className="absolute bottom-8 left-0 right-0 text-sm text-cyan-400 flex justify-between px-2">
          <span className="inline-block animate-pop-in">{taxAmount}</span>
          <span className="inline-block animate-pop-in">{totalWithTax}</span>
        </div>
        {(aiSuggestion || error) && (
          <div className="absolute bottom-0 left-0 right-0 text-center text-sm text-[#ff3d00] bg-[rgba(255,61,0,0.15)] p-2 rounded-xl border border-[rgba(255,61,0,0.7)] z-10 flex justify-between items-center">
            <>
              <span className="flex-grow text-right px-2">
                {aiSuggestion?.message || error?.message}
              </span>
              {aiSuggestion?.fix && (
                  <button onClick={onApplyAiFix} className="bg-none border-none text-sky-500 dark:text-[#4fc3f7] font-bold cursor-pointer mr-1 whitespace-nowrap">[✨ تصحيح آلي]</button>
              )}
            </>
          </div>
        )}
      </div>
    </div>
  );
};

export default Display;
