export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="mt-2 text-gray-600">Welcome back to your support command center.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Placeholder Stats Cards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Total Conversations</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Active Data Sources</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Pending Actions</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
                </div>
            </div>
        </div>
    );
}
