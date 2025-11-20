import React from 'react';

interface OverlayProps {
  show: boolean;
  onClick: () => void;
  zIndex?: string;
}

const Overlay: React.FC<OverlayProps> = ({ show, onClick, zIndex = 'z-40' }) => {
  return (
    <div
      onClick={onClick}
      className={`fixed inset-0 bg-black/70 transition-opacity duration-300 ${show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} ${zIndex}`}
    />
  );
};

export default Overlay;