export default function MobileSidebar({isHidden = false, toggleSidebar}: {isHidden?: boolean, toggleSidebar?: () => void}) {
    return (
        <aside 
            className={`fixed inset-0 z-50 bg-gray-100 dark:bg-gray-800 p-4 overflow-auto
                ${isHidden ? 'animate-slide-out' : 'animate-slide-in'}`}
        >
            {/* Sidebar content goes here */}
            <button className="mb-4 p-2 bg-gray-200 dark:bg-gray-700 rounded" onClick={toggleSidebar}>
                {/*Back icon*/}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <nav>
                <ul className="space-y-2">
                    <li className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition duration-300 ease-in-out translate-x-0 hover:translate-x-1">
                        Home
                    </li>
                    <li className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                        Notes
                    </li>
                    <li className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                        Categories
                    </li>
                    <li className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                        Settings
                    </li>
                </ul>
            </nav>
        </aside>
    );
}
