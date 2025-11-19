
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className = '', style = {} }) => {
  return (
    <button
      onClick={onClick}
      style={style}
      className={`border border-[var(--button-border-color)] py-4 text-2xl rounded-[var(--button-radius)] cursor-pointer transition-all duration-100 flex items-center justify-center select-none shadow-[var(--button-number-shadow)] active:transform active:translate-y-[2px] active:shadow-[var(--button-number-active-shadow)] active:brightness-95 ${className}`}
    >
      <span style={{ textShadow: 'var(--button-text-shadow, none)' }}>{children}</span>
    </button>
  );
};

export default Button;