import React from 'react';

const MobileHeader: React.FC<{ isSidebarHidden: boolean; toggleSidebar: () => void }> = ({ isSidebarHidden, toggleSidebar }) => {
  return (
    <header className="flex items-center gap-2 px-4 bg-gray-50">
        <img 
            src="/ntwa-logo.svg" 
            alt="Notes Logo" 
            className="w-7 h-7"
        />
        <h1 className="text-xl font-semibold italic text-gray-900">Notes</h1>
        <button onClick={toggleSidebar} className="p-2 focus:outline-none background-transparent rounded-md bg-gray-200 transition ml-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        </button>
    </header>
  );
};

export default MobileHeader;
