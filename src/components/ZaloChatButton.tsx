import React, { useState, useEffect } from 'react';
import zaloLogo from '../assets/zaloLogo.png';

export const ZaloChatButton: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetch('/api/settings/social')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.zalo) {
          // Clean the phone number (remove spaces, etc.) but keep leading zero
          const cleaned = data.zalo.replace(/[^0-9+]/g, '');
          setPhoneNumber(cleaned);
        }
      })
      .catch(console.error);
  }, []);

  if (!phoneNumber) return null;

  return (
    <a
      href={`https://zalo.me/${phoneNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
      title="Chat qua Zalo"
    >
      <img 
        src={zaloLogo} 
        alt="Zalo" 
        className="w-10 h-10 object-contain"
      />
    </a>
  );
};
