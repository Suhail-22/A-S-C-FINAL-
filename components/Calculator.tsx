import React, { useMemo } from 'react';
import { useCalculator } from '../hooks/useCalculator';
import Header from './Header';
import Display from './Display';
import ButtonGrid from './ButtonGrid';
import { parseExpression, preprocessExpression } from '../services/calculationEngine';

interface CalculatorProps {
  calculator: ReturnType<typeof useCalculator>;
  onToggleSettings: () => void;
  onToggleHistory: () => void;
  onShare: (message: string) => void;
  entryCount: number;
  todayCount: number;
}

const Calculator: React.FC<CalculatorProps> = ({ calculator, onToggleSettings, onToggleHistory, onShare, entryCount, todayCount }) => {
  const { taxSettings } = calculator.settings;
  const { input, error, aiSuggestion, actions, lastExpression } = calculator;

  const handleShare = async () => {
    const expression = calculator.isCalculationExecuted ? calculator.history[0]?.expression : input;
    let resultText = '...';
    if (calculator.isCalculationExecuted) {
        resultText = input;
    } else {
        try {
            const processedExpr = preprocessExpression(input);
            const safeExpr = processedExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/(^|\()(\+)/g, '$1');
            const liveResult = parseExpression(safeExpr);
            if (!isNaN(liveResult) && isFinite(liveResult)) {
                resultText = liveResult.toLocaleString('en-US', {maximumFractionDigits: 10, useGrouping: false});
            }
        } catch (e) { /* keep '...' */ }
    }

    const textToShare = `العملية الحسابية:\n${expression}\n\nالنتيجة:\n${resultText}`;

    if (navigator.share) {
        try {
            await navigator.share({ title: 'نتيجة من الآلة الحاسبة الذكية', text: textToShare });
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                navigator.clipboard.writeText(textToShare);
                onShare('فشلت المشاركة، تم النسخ إلى الحافظة!');
            }
        }
    } else {
        navigator.clipboard.writeText(textToShare);
        onShare('تم النسخ إلى الحافظة!');
    }
  };

  return (
    <div className="relative w-full z-10 animate-container-in mx-auto h-full">
      <div 
          className="bg-[var(--bg-calculator)] rounded-[var(--button-radius)] p-4 w-full h-full relative backdrop-blur-xl z-10 border border-[var(--border-primary)] flex flex-col landscape:flex-row landscape:gap-6"
          style={{ boxShadow: 'var(--calculator-shadow, none)' }}
        >
        {/* Left Side (in Landscape): Header + Display */}
        {/* Note: In RTL + flex-row, this comes visually on the RIGHT (Start) */}
        <div className="flex flex-col landscape:w-1/2 landscape:h-full justify-center">
            <Header
            taxSettings={taxSettings}
            onToggleSettings={onToggleSettings}
            onShare={handleShare}
            onToggleHistory={onToggleHistory}
            historyCount={todayCount}
            entryCountDisplay={entryCount}
            />
            <Display
            input={input}
            taxSettings={taxSettings}
            error={error}
            aiSuggestion={aiSuggestion}
            onApplyAiFix={actions.applyAiFix}
            isCalculationExecuted={calculator.isCalculationExecuted}
            lastExpression={lastExpression}
            onUpdateInput={actions.updateInput}
            />
        </div>

        {/* Right Side (in Landscape): Button Grid */}
        {/* Note: In RTL + flex-row, this comes visually on the LEFT (End) */}
        <div className="landscape:w-1/2 landscape:h-full landscape:flex landscape:flex-col landscape:justify-center">
            <ButtonGrid
            onAppend={actions.append}
            onClear={actions.clearAll}
            onBackspace={actions.backspace}
            onCalculate={actions.calculate}
            onToggleSign={actions.toggleSign}
            onParenthesis={actions.handleParenthesis}
            onAppendAnswer={actions.appendAnswer}
            layout={calculator.settings.buttonLayout}
            />
        </div>
      </div>
    </div>
  );
};

export default Calculator;