import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { RealTimeMetrics } from "../api/client";
import { format } from "date-fns";

interface RealTimeChartProps {
    data: RealTimeMetrics | null;
    loading: boolean;
}

export default function RealTimeChart({ data, loading }: RealTimeChartProps){
    if (loading) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-64 bg-gray-700/50 rounded animate-pulse"></div>
            </div>
        );
    }

    if (!data || data.buckets.length === 0) {
        return (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    Real-time Activity
                </h2>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    No recent data available
                </div>
            </div>
        );
    }

    // Transform the data for charts
    const chartData = data.buckets.map(bucket => ({
        time: format(new Date(bucket.timestamp), 'HH:mm:ss'),
        'Page View': bucket.counts.page_view || 0,
        'Button Click': bucket.counts.button_click || 0,
        'API Call': bucket.counts.api_call || 0,
        'Error': bucket.counts.error || 0,
    })).reverse();

    return (
        <div className="bg-gray-800/50 backdrop-blue-sm border border-gray-700 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Real-time Activity (Last 5 Minutes)
                </h2>
                <span className="text-xs text-gray-500">updates every 5s</span>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>

                    <defs>
                        <linearGradient id="colorPageView" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorButtonClick" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorApiCall" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

                    <XAxis 
                        dataKey="time" 
                        stroke="#9ca3af" 
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                    />
                    <YAxis 
                        stroke="#9ca3af" 
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Event Count', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                    />

                    <Legend 
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{ color: '#9ca3af', marginTop: '20px' }} 
                    />

                    <Area type="monotone" dataKey="Page View" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPageView)" />
                    <Area type="monotone" dataKey="Button Click" stroke="#10b981" fillOpacity={1} fill="url(#colorButtonClick)" />
                    <Area type="monotone" dataKey="API Call" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorApiCall)" />
                    <Area type="monotone" dataKey="Error" stroke="#ef4444" fillOpacity={1} fill="url(#colorError)" />

                </AreaChart>
            </ResponsiveContainer>

        </div>
    );
}