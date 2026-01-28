import Link from 'next/link';

const Sidebar = () => {
    return (
        <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col border-r border-gray-800">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight">AI Support</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                >
                    Overview
                </Link>
                <Link
                    href="/dashboard/conversations"
                    className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                >
                    Conversations
                </Link>
                <Link
                    href="/dashboard/data-sources"
                    className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                >
                    Data Sources
                </Link>
                <Link
                    href="/dashboard/settings"
                    className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                >
                    Settings
                </Link>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="px-4 py-2">
                    <p className="text-xs text-gray-500">v0.1.0 Beta</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
