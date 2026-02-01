'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ListWatcher() {
    const router = useRouter();

    useEffect(() => {
        // Poll for list updates (e.g. new "Needs Attention" items) every 4 seconds
        // This is a simple way to keep the list fresh without complex realtime list management
        const interval = setInterval(() => {
            router.refresh();
        }, 4000);

        return () => clearInterval(interval);
    }, [router]);

    return null;
}
