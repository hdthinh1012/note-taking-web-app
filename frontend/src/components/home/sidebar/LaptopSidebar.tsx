export default function LaptopSidebar() {
    return (
        <aside className="w-full h-full bg-gray-100 dark:bg-gray-800 p-4 overflow-auto">
            {/* Sidebar content goes here */}
            <nav>
                <ul className="space-y-2">
                    <li className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
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
