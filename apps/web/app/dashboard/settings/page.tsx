import { createClient } from '@/utils/supabase/server';
import { getBusinessSettings } from './actions';
import { NotificationToggle } from './notification-toggle';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Please log in</div>;

    const settings = await getBusinessSettings();
    const notificationsEnabled = settings ? settings.escalation_notifications_enabled : true; // Default true

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="mt-2 text-gray-600">Manage your account and workspace preferences.</p>
            </header>

            <div className="grid grid-cols-1 gap-6 max-w-2xl">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Notifications</h2>
                    <div className="divide-y divide-gray-100">
                        <NotificationToggle initialEnabled={notificationsEnabled} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-70 pointer-events-none">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Workspace Name</span>
                            <span className="text-gray-400">My Workspace</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
