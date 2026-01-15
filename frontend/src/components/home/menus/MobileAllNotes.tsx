export default function MobileAllNotes() {
    return (
        <section className="w-full h-full bg-white dark:bg-gray-900 p-4 overflow-auto">
            <h2 className="text-xl font-semibold mb-4">All Notes</h2>
            
            {/* Notes list */}
            <ul className="space-y-3">
                <li className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <h3 className="font-medium">Note Title 1</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        Preview of note content...
                    </p>
                </li>
                <li className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <h3 className="font-medium">Note Title 2</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        Preview of note content...
                    </p>
                </li>
                <li className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <h3 className="font-medium">Note Title 3</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        Preview of note content...
                    </p>
                </li>
            </ul>
        </section>
    );
}
