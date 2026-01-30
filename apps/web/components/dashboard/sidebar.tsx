'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'Conversations', href: '/dashboard/conversations' },
    { name: 'Customer Chats', href: '/dashboard/customer-chats' },
    { name: 'Knowledge Base', href: '/dashboard/knowledge' },
    { name: 'Settings', href: '/dashboard/settings' },
];

const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col border-r border-gray-800">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight">AI Support</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
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
