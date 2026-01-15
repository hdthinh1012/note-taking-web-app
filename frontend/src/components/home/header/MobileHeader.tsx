import React from 'react';

const MobileHeader: React.FC = () => {
  return (
    <header className="flex items-center gap-2 px-4 py-3 bg-gray-50">
      <img 
        src="/ntwa-logo.svg" 
        alt="Notes Logo" 
        className="w-7 h-7"
      />
      <h1 className="text-xl font-semibold italic text-gray-900">Notes</h1>
    </header>
  );
};

export default MobileHeader;
