
import React from 'react';
import Button from './Button';
import Icon from './Icon';
import { ButtonConfig } from '../types';

interface ButtonGridProps {
  onAppend: (value: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onCalculate: () => void;
  onToggleSign: () => void;
  onParenthesis: () => void;
  onAppendAnswer: () => void;
  layout: ButtonConfig[];
}

const ButtonGrid: React.FC<ButtonGridProps> = ({ onAppend, onClear, onBackspace, onCalculate, onToggleSign, onParenthesis, onAppendAnswer, layout }) => {
  return (
    <div className="grid grid-cols-5 gap-3">
      {layout.map((btn) => {
        const handleClick = () => {
          if (btn.action === 'clear') onClear();
          else if (btn.action === 'backspace') onBackspace();
          else if (btn.action === 'calculate') onCalculate();
          else if (btn.action === 'toggleSign') onToggleSign();
          else if (btn.action === 'parenthesis') onParenthesis();
          else if (btn.action === 'appendAnswer') onAppendAnswer();
          else if (btn.value) onAppend(btn.value);
        };

        let style: React.CSSProperties = {};
        let className = '';

        if (btn.type === 'number') {
            style.background = 'var(--button-number-bg)';
            style.color = 'var(--button-text-color-custom, var(--text-primary))';
        }
        if (btn.type === 'operator' || btn.type === 'function') {
            style.background = 'var(--button-function-bg)';
            style.color = 'var(--button-text-color-custom, var(--button-function-text-color, var(--accent-color)))';
        }
        if (btn.type === 'equals') {
            style.background = 'var(--accent-equals-bg)';
            style.color = 'var(--accent-equals-text)';
            className += ' animate-pulse-special';
        }
        if (btn.span === 2) className += ' col-span-2';

        return (
          <Button
            key={btn.id}
            onClick={handleClick}
            className={className}
            style={style}
          >
            {btn.icon ? <Icon name={btn.icon} className='w-7 h-7' /> : btn.label}
          </Button>
        );
      })}
    </div>
  );
};

export default ButtonGrid;
