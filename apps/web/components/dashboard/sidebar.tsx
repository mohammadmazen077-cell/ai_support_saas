'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const SIDEBAR_STORAGE_KEY = 'dashboard-sidebar-collapsed';

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: IconOverview },
    { name: 'AI Testing', href: '/dashboard/conversations', icon: IconChat },
    { name: 'Customer Chats', href: '/dashboard/customer-chats', icon: IconUsers },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: IconBook },
    { name: 'Settings', href: '/dashboard/settings', icon: IconSettings },
];

function IconOverview({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}
function IconChat({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    );
}
function IconUsers({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );
}
function IconBook({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    );
}
function IconSettings({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}
function IconChevronLeft({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    );
}
function IconChevronRight({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

const Sidebar = () => {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            setCollapsed(stored === 'true');
        } catch {
            // ignore
        }
    }, []);

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    return (
        <aside
            className={`flex-shrink-0 h-screen flex flex-col bg-gray-900 text-white border-r border-gray-800 transition-[width] duration-200 ease-in-out ${collapsed ? 'w-[4.25rem]' : 'w-64'}`}
            aria-label="Dashboard navigation"
        >
            <div className={`flex items-center border-b border-gray-800 ${collapsed ? 'justify-center py-4' : 'px-6 py-5'}`}>
                {!collapsed && <h1 className="text-xl font-bold tracking-tight">AI Support</h1>}
                {collapsed && (
                    <span className="text-lg font-bold tracking-tight" title="AI Support">
                        A
                    </span>
                )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    const linkContent = (
                        <>
                            <Icon className="flex-shrink-0 w-6 h-6" />
                            {!collapsed && <span className="ml-3 truncate">{item.name}</span>}
                        </>
                    );
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={collapsed ? item.name : undefined}
                            className={`flex items-center w-full rounded-lg py-2.5 text-sm font-medium transition-colors ${
                                collapsed ? 'justify-center px-0' : 'px-3'
                            } ${isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                        >
                            {linkContent}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-gray-800 flex flex-col items-center gap-2">
                {!collapsed && <p className="text-xs text-gray-500 w-full px-3">v0.1.0 Beta</p>}
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <IconChevronRight className="w-5 h-5" /> : <IconChevronLeft className="w-5 h-5" />}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
