export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="mt-2 text-gray-600">Manage your account and workspace preferences.</p>
            </header>

            <div className="grid grid-cols-1 gap-6 max-w-2xl">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Workspace Name</span>
                            <span className="text-gray-400">My Workspace</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Theme</span>
                            <span className="text-gray-400">Light</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
