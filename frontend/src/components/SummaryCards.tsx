import { FaChartBar as Chart} from "react-icons/fa";
import { BsFillLightningChargeFill as Lightning} from "react-icons/bs";
import { FiUsers as Users} from "react-icons/fi";
import { GoTrophy  as Trophy} from "react-icons/go";
import type { SummaryMetrics } from "../api/client";

interface SummaryCardsProps {
    data: SummaryMetrics | null;
    loading: boolean;
}

export default function SummaryCards( { data, loading }: SummaryCardsProps) {
    if (loading) {
        return (
            <>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Key Metrics</h2>
                    <span className="text-xs text-gray-500">updates every 5s</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 animate-pulse"
                    >
                        <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
            </>
        );
    }

    if (!data) return null;

    const { total_events, unique_users, events_per_second, top_events } = data.last_hour;
    const topEvent = top_events[0]?.type || 'N/A';

    const cards = [
        {
            title: 'Total Events',
            value: total_events.toLocaleString(),
            subtitle: 'Last Hour',
            icon: <Chart />,
            iconColor: 'text-blue-400',
            color: 'from-blue-500/20 to-blue-600/20',
            borderColor: 'border-blue-500/30',
        },
        {
            title: 'Events/Second',
            value: events_per_second.toFixed(2),
            subtitle: 'Current Rate',
            icon: <Lightning />,
            iconColor: 'text-yellow-400',
            color: 'from-yellow-500/20 to-yellow-600/20',
            borderColor: 'border-yellow-500/30',
        },
        {
            title: 'Unique Users',
            value: unique_users.toLocaleString(),
            subtitle: 'Unique Users',
            icon: <Users />,
            iconColor: 'text-green-400',
            color: 'from-green-500/20 to-green-600/20',
            borderColor: 'border-green-500/30',
        },
        {
            title: 'Top Event',
            value: topEvent.replace('_', ' '),
            subtitle: `${top_events[0]?.count.toLocaleString() || 0} events`,
            icon: <Trophy />,
            iconColor: 'text-purple-400',
            color: 'from-purple-500/20 to-purple-600/20',
            borderColor: 'border-purple-500/30',
        },
    ];

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Key Metrics</h2>
                <span className="text-xs text-gray-500">updates every 5s</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className={`bg-gradient-to-br ${card.color} backdrop-blur-sm border ${card.borderColor} rounded-xl p-6 hover:scale-105 transition-transform duration-200`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-400">
                            {card.title}
                        </span>
                        <span className={`text-2xl ${card.iconColor}`}>
                            {card.icon}
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
                    <div className="text-xs text-gray-400">{card.subtitle}</div>
                </div>
            ))}
        </div>
        </>
    );
}