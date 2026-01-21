import { type RecentEvent } from "../api/client";
import { format } from "date-fns";

interface RecentEventsProps {
    events: RecentEvent[];
    loading: boolean;
}

const eventTypeColors: Record<string, string> = {
    page_view: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    button_click: 'bg-green-500/20 text-green-400 border-green-500/30',
    api_call: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function RecentEvents({ events, loading }: RecentEventsProps){
    if (loading) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-700/50 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Events</h2>
                <div className="text-center text-gray-500 py-8">No events yet</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Recent Events</h2>
                <span className="text-xs text-gray-500">updates every 5s</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
                        <tr>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3">Event Type</th>
                            <th className="px-4 py-3">User ID</th>
                            <th className="px-4 py-3">Properties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event, idx) => (
                            <tr
                                key={event.event_id}
                                className={`${idx % 2 == 0 ? 'bg-gray-900/30' : 'bg-gray-900/10'} border-b border-gray-800 hover:bg-gray-700/20 transition-colors`}
                            >
                                <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                                    {format(new Date(event.time), 'HH:mm:ss')}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${eventTypeColors[event.event_type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                                    >
                                        {event.event_type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                                    {event.user_id}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs max-w-md truncate">
                                    {JSON.stringify(event.properties).substring(0, 80)}...
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    )
}