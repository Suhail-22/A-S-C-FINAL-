
import React from 'react';

interface NotificationProps {
  message: string;
  show: boolean;
}

const Notification: React.FC<NotificationProps> = ({ message, show }) => {
  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 bottom-5 bg-green-600/95 text-white py-3 px-6 rounded-full z-[100] shadow-lg text-base text-center transition-all duration-300 ${show ? 'opacity-100 animate-bounce-in-up' : 'opacity-0 pointer-events-none'}`}
    >
      {message}
    </div>
  );
};

export default Notification;
