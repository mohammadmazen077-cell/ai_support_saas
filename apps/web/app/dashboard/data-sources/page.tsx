export default function DataSourcesPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Data Sources</h1>
                <p className="mt-2 text-gray-600">Connect your knowledge base sources.</p>
            </header>

            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                <h3 className="text-lg font-medium text-gray-500">No data sources connected</h3>
                <p className="mt-2 text-gray-400">Connect Notion, Google Drive, or upload PDFs to train your AI.</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add New Source
                </button>
            </div>
        </div>
    );
}
