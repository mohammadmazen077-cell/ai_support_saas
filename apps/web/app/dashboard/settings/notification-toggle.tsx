'use client';

import { useState } from 'react';
import { updateBusinessSettings } from './actions';

export function NotificationToggle({ initialEnabled }: { initialEnabled: boolean }) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        const newState = !enabled;
        try {
            // Optimistic update
            setEnabled(newState);
            await updateBusinessSettings(newState);
        } catch (error) {
            console.error(error);
            setEnabled(!newState); // Revert
            alert('Failed to update setting');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex flex-col">
                <span className="text-gray-900 font-medium">Email Notifications</span>
                <span className="text-gray-500 text-sm">Receive emails when a chat needs human attention</span>
            </div>
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${enabled ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                role="switch"
                aria-checked={enabled}
            >
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}
