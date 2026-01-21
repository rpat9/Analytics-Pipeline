import { useState, useEffect } from "react";
import { api } from "./api/client";
import type { SummaryMetrics, RealTimeMetrics, RecentEvent } from "./api/client";
import SummaryCards from "./components/SummaryCards";
import RealTimeChart from "./components/RealtimeChart";
import RecentEvents from "./components/RecentEvents";

export default function App() {

    const [summary, setSummary] = useState<SummaryMetrics | null>(null);
    const [realtime, setRealtime] = useState<RealTimeMetrics | null>(null);
    const [events, setEvents] = useState<RecentEvent[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchData = async () => {
        try {
            setError(null);
            const [summaryData, realtimeData, eventsData] = await Promise.all([
                api.getSummary(),
                api.getRealTime(),
                api.getRecentEvents(20),
            ]);

            setSummary(summaryData);
            setRealtime(realtimeData);
            setEvents(eventsData.events);
            setLastUpdate(new Date());

        } catch(error){
            setError(error instanceof Error ? error.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();

        // Set up auto-refresh every 5 seconds
        const interval = setInterval(fetchData, 5000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900">
            
            <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                Analytics Dashboard
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Real-time event tracking and monitoring
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Last Updated</div>
                            <div className="text-sm text-gray-300 font-mono">
                                {lastUpdate.toLocaleTimeString()}
                            </div>
                            <div className="flex items-center gap-2 mt-1 justify-end">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-xs text-green-400">Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-red-400 font-medium">Connection Error:</div>
                            <div className="text-red-300 text-sm">{error}</div>
                        </div>
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <SummaryCards data={summary} loading={loading} />
                <RealTimeChart data={realtime} loading={loading} />
                <RecentEvents events={events} loading={loading} />

            </div>
        </div>
    );

}