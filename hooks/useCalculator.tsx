import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { parseExpression, preprocessExpression } from '../services/calculationEngine';
import { getLocalFix, findErrorDetails } from '../services/localErrorFixer';
import { HistoryItem, TaxSettings, ErrorState, AISuggestion } from '../types';
import { defaultButtonLayout } from '../constants';

interface UseCalculatorProps {
  showNotification: (message: string) => void;
}

let audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch(e) {
            console.error("Web Audio API is not supported in this browser.");
        }
    }
    return audioContext;
};

export const useCalculator = ({ showNotification }: UseCalculatorProps) => {
  const [input, setInput] = useState('0');
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('calcHistory_v2', []);
  const [lastAnswer, setLastAnswer] = useLocalStorage<string>('calcLastAnswer', '0');
  const [vibrationEnabled, setVibrationEnabled] = useLocalStorage<boolean>('calcVibration', true);
  const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>('calcSoundEnabled', false);
  const [orientation, setOrientation] = useLocalStorage<'auto' | 'portrait'>('calcOrientation', 'auto');
  const [taxSettings, setTaxSettings] = useLocalStorage<TaxSettings>('calcTaxSettings_v2', { isEnabled: false, mode: 'add-15', rate: 15, showTaxPerNumber: false });
  const [maxHistory, setMaxHistory] = useLocalStorage<number>('calcMaxHistory', 50);
  const [buttonLayout] = useLocalStorage('calcButtonLayout_v10', defaultButtonLayout);
  const [calculationExecuted, setCalculationExecuted] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [lastExpression, setLastExpression] = useState<string | null>(null);

  const entryCount = useMemo(() => {
      if (calculationExecuted) return 1;
      if (input === '0' || !input) return 0;
      const numbers = input.match(/\d+(\.\d+)?/g);
      return numbers ? numbers.length : 0;
  }, [input, calculationExecuted]);
  
  const vibrate = (duration = 30) => {
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const playSound = useCallback((type: 'number' | 'operator' | 'function' | 'equals' | 'clear' | 'backspace') => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    let frequency = 440;
    let waveType: OscillatorType = 'sine';
    let duration = 0.1;
    let volume = 0.2;

    switch (type) {
        case 'number':      frequency = 650 + Math.random() * 100; waveType = 'sine'; volume = 0.15; break;
        case 'operator':    frequency = 440; waveType = 'sine'; break;
        case 'function':    frequency = 523; waveType = 'triangle'; break;
        case 'equals':      frequency = 880; waveType = 'sine'; volume = 0.3; duration = 0.2; break;
        case 'backspace':   frequency = 380; waveType = 'triangle'; volume = 0.1; duration=0.08; break;
        case 'clear':       frequency = 220; waveType = 'sawtooth'; volume = 0.25; duration = 0.15; break;
    }

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = waveType;
    oscillator.start(ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
  }, [soundEnabled]);

  const clearAll = useCallback(() => {
    playSound('clear');
    vibrate(50);
    setInput('0');
    setCalculationExecuted(false);
    setError(null);
    setAiSuggestion(null);
    setLastExpression(null);
  }, [vibrationEnabled, playSound]);

  const backspace = useCallback(() => {
    playSound('backspace');
    vibrate(30);
    setError(null);
    setAiSuggestion(null);
    setLastExpression(null);
    setInput(prev => {
      const newStr = prev.slice(0, -1);
      return newStr === '' || newStr === '0' ? '0' : newStr;
    });
    setCalculationExecuted(false);
  }, [vibrationEnabled, playSound]);

  const append = useCallback((value: string) => {
    // Feedback
    if (['+', '-', '×', '÷'].includes(value)) {
        playSound('operator');
    } else {
        playSound('number');
    }
    vibrate(20);

    // Reset states
    if (error) {
        setError(null);
        setAiSuggestion(null);
        setLastExpression(null);
        const forbiddenStarters = ['+', '-', '×', '÷', '%', ')'];
        setInput(forbiddenStarters.includes(value) ? '0' : value);
        setCalculationExecuted(false);
        return;
    }

    setError(null);
    setAiSuggestion(null);
    setLastExpression(null);

    if (calculationExecuted) {
      const isOperator = ['+', '-', '×', '÷'].includes(value);
      setInput(isOperator ? input + value : value);
      setCalculationExecuted(false);
      return;
    }

    setInput(prev => {
      // --- Logic for Start of Input ---
      if (prev === '0') {
        if (['0', '00', '000'].includes(value)) return '0'; // Ignore multiple zeros at start
        if (value === '.') return '0.';
        if (['+', '-', '×', '÷'].includes(value)) return '0' + value; // Allow 0+
        if (['%', ')'].includes(value)) return '0'; // Ignore invalid starters
        return value; // Replace 0 with the new number/paren
      }

      const lastChar = prev.slice(-1);
      const operators = ['+', '-', '×', '÷'];
      const isLastOperator = operators.includes(lastChar);
      const isInputOperator = operators.includes(value);

      // --- Logic 1: Operator Replacement ---
      // If last was operator and new is operator, replace it.
      if (isLastOperator && isInputOperator) {
          return prev.slice(0, -1) + value;
      }

      // --- Logic 2: Prevent Invalid Sequences ---
      // Prevent % right after an operator (e.g., +%)
      if (isLastOperator && value === '%') {
          return prev;
      }

      // Prevent double %
      if (lastChar === '%' && value === '%') {
          return prev;
      }

      // Prevent operators right after open parenthesis
      if (lastChar === '(' && (isInputOperator || value === '%' || value === ')')) {
          return prev;
      }

      // --- Logic 3: Handle "Zero Segments" (e.g. 5+0 -> 5+00) ---
      // Split by operators or parens to get the current number segment being typed
      const parts = prev.split(/([+\-×÷()])/);
      const currentSegment = parts[parts.length - 1];

      // If the current segment is exactly "0"
      if (currentSegment === '0') {
          // If user types 0, 00, 000 -> Ignore
          if (['0', '00', '000'].includes(value)) {
              return prev;
          }
          // If user types a digit (1-9) or open paren -> Replace the 0
          // e.g., 5+0 + 5 -> 5+5
          if (!isInputOperator && value !== '.' && value !== '%' && value !== ')') {
              return prev.slice(0, -1) + value;
          }
      }

      // --- Logic 4: Implicit Multiplication ---
      // Auto-insert × if typing number/paren after closing paren: )5 -> )×5
      if (lastChar === ')' && !isInputOperator && value !== ')' && value !== '%' && value !== '.') {
          return prev + '×' + value;
      }
      
      return prev + value;
    });
  }, [calculationExecuted, input, vibrationEnabled, playSound, error]);

   const toggleSign = useCallback(() => {
    playSound('function');
    vibrate(30);
    setLastExpression(null);
    const isSimpleNumber = /^-?\d+(\.\d+)?$/.test(input);
    if (calculationExecuted || isSimpleNumber) {
        setInput(prev => {
            if (prev === '0') return '0';
            return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
        });
        setCalculationExecuted(false);
    }
  }, [vibrationEnabled, calculationExecuted, input, playSound]);

  const handleParenthesis = useCallback(() => {
    playSound('function');
    vibrate(20);
    setError(null);
    setAiSuggestion(null);
    setLastExpression(null);
    if (calculationExecuted) {
        setInput('(');
        setCalculationExecuted(false);
        return;
    }
    setInput(prev => {
        const openParenCount = (prev.match(/\(/g) || []).length;
        const closeParenCount = (prev.match(/\)/g) || []).length;
        const lastChar = prev.slice(-1);
        if (openParenCount > closeParenCount && !['(', '+', '-', '×', '÷'].includes(lastChar)) {
            return prev + ')';
        } else {
            if (prev === '0') return '(';
            if (!isNaN(parseInt(lastChar, 10)) || lastChar === ')') {
                return prev + '×(';
            }
            return prev + '(';
        }
    });
  }, [calculationExecuted, vibrationEnabled, playSound]);

   const appendAnswer = useCallback(() => {
    playSound('function');
    vibrate(20);
    setError(null);
    setAiSuggestion(null);
    setLastExpression(null);
    if (calculationExecuted) {
        setInput(lastAnswer);
        setCalculationExecuted(false);
        return;
    }
    setInput(prev => {
        if (prev === '0') return lastAnswer;
        const lastChar = prev.slice(-1);
         if (!isNaN(parseInt(lastChar, 10)) || lastChar === ')') {
            return prev + '×' + lastAnswer;
        }
        return prev + lastAnswer;
    });
  }, [lastAnswer, calculationExecuted, vibrationEnabled, playSound]);

  const calculate = useCallback(async () => {
    if (calculationExecuted) {
      return;
    }
    playSound('equals');
    vibrate(70);
    setError(null);
    setAiSuggestion(null);
    const expression = input;
    if (expression === '0') return;
    try {
      const processedExpr = preprocessExpression(expression);
      const safeExpr = processedExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/(^|\()(\+)/g, '$1');
      let result = parseExpression(safeExpr);

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        throw new Error('تعبير غير صالح رياضيًا.');
      }
      const resultStr = result.toLocaleString('en-US', {maximumFractionDigits: 10, useGrouping: false});
      setLastAnswer(resultStr);
      
      let taxResultValue: number | null = null;
      let effectiveTaxRate = taxSettings.rate || 0;
      
      if (taxSettings.isEnabled) {
          switch(taxSettings.mode) {
              case 'add-15':
                  taxResultValue = result * 1.15;
                  effectiveTaxRate = 15;
                  break;
              case 'custom':
                  taxResultValue = result * (1 + effectiveTaxRate / 100);
                  break;
              case 'extract-custom':
                  taxResultValue = result / (1 + effectiveTaxRate / 100);
                  break;
              case 'divide-93':
                  taxResultValue = result / 0.93;
                  break;
          }
      }

      const taxResult = taxResultValue ? taxResultValue.toLocaleString('en-US', {maximumFractionDigits: 3, useGrouping: false}) : null;
      const taxLabel = taxSettings.mode === 'extract-custom' ? 'الأصل بدون ضريبة' : 'الإجمالي مع الضريبة';
      const now = new Date();
      
      const newItem: HistoryItem = {
        id: Date.now(),
        expression: expression,
        result: resultStr,
        taxResult: taxResult,
        taxMode: taxSettings.isEnabled ? taxSettings.mode : null,
        taxRate: taxSettings.isEnabled ? effectiveTaxRate : null,
        taxLabel: taxSettings.isEnabled ? taxLabel : null,
        date: now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        notes: ''
      };
      setHistory(prev => [newItem, ...prev].slice(0, maxHistory));
      setInput(resultStr);
      setCalculationExecuted(true);
      setLastExpression(expression);
    } catch (e: any) {
        let errorMessage = e.message || 'خطأ غير معروف';
        if (errorMessage === 'رمز غير معروف' && expression.includes('%')) {
            errorMessage = 'تنسيق النسبة المئوية غير صالح.';
        }
        setError({ message: errorMessage, details: findErrorDetails(expression, errorMessage) });
        setCalculationExecuted(false);
        setLastExpression(null);
        
        const localFix = getLocalFix(expression);
        if (localFix && localFix.fix) {
            setAiSuggestion({ ...localFix });
        } else {
            setAiSuggestion(null);
        }
    }
  }, [input, taxSettings, setHistory, vibrationEnabled, maxHistory, setLastAnswer, calculationExecuted, playSound]);
  
  const applyAiFix = useCallback(() => {
    if (aiSuggestion?.fix) {
        setInput(aiSuggestion.fix);
        setError(null);
        setAiSuggestion(null);
        setLastExpression(null);
        setCalculationExecuted(false);
    }
  }, [aiSuggestion]);

  const clearHistory = useCallback(() => {
    vibrate(50);
    setHistory([]);
  }, [setHistory, vibrationEnabled]);

  const deleteHistoryItem = useCallback((id: number) => {
    setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
  }, [setHistory]);

  const loadFromHistory = useCallback((item: HistoryItem | string) => {
    if (!item) return;
    const expression = typeof item === 'string' ? item : (item.expression || '0');
    setInput(expression);
    setCalculationExecuted(false);
    setError(null);
    setAiSuggestion(null);
    setLastExpression(null);
  }, []);

  const updateInput = useCallback((value: string) => {
    setError(null);
    setAiSuggestion(null);
    setLastExpression(null);
    if (calculationExecuted) {
        setCalculationExecuted(false);
    }
    setInput(value === '' ? '0' : value);
  }, [calculationExecuted]);

  const updateHistoryItemNote = useCallback((id: number, note: string) => {
      setHistory(prevHistory => 
          prevHistory.map(item =>
              item.id === id ? { ...item, notes: note } : item
          )
      );
  }, [setHistory]);
  
  const actions = useMemo(() => ({
    append, clearAll, backspace, calculate, toggleSign, handleParenthesis, appendAnswer, applyAiFix, clearHistory, deleteHistoryItem, loadFromHistory, updateInput, updateHistoryItemNote
  }), [append, clearAll, backspace, calculate, toggleSign, handleParenthesis, appendAnswer, applyAiFix, clearHistory, deleteHistoryItem, loadFromHistory, updateInput, updateHistoryItemNote]);

  return {
    input, history, error, aiSuggestion, isCalculationExecuted: calculationExecuted, entryCount, lastExpression,
    settings: {
      vibrationEnabled, setVibrationEnabled,
      soundEnabled, setSoundEnabled,
      taxSettings, setTaxSettings, maxHistory, setMaxHistory, buttonLayout,
      orientation, setOrientation
    },
    actions
  };
};