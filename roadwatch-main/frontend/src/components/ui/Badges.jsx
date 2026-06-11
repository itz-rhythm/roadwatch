import { Info, AlertCircle, AlertTriangle } from 'lucide-react';

export function ComplaintStatusBadge({ status }) {
  const config = {
    reported: 'bg-slate-700 text-slate-300',
    verified: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    assigned: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    in_progress: 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse',
    completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border border-red-500/30 line-through'
  };

  const style = config[status?.toLowerCase()] || config.reported;

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${style}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const config = {
    minor: { style: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30', icon: <Info className="w-3 h-3" /> },
    moderate: { style: 'bg-orange-500/20 text-orange-500 border border-orange-500/30', icon: <AlertCircle className="w-3 h-3" /> },
    dangerous: { style: 'bg-red-500/20 text-red-500 border border-red-500/30', icon: <AlertTriangle className="w-3 h-3" /> },
    critical: { style: 'bg-red-600 text-white border-2 border-red-500 animate-flash-border shadow-[0_0_15px_rgba(239,68,68,0.5)]', icon: <AlertTriangle className="w-3 h-3" /> }
  };

  const { style, icon } = config[severity?.toLowerCase()] || config.minor;

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${style}`}>
      {icon} {severity}
    </span>
  );
}

export function RoadTypeBadge({ type }) {
  const config = {
    NH: 'bg-blue-900 text-blue-200 border-blue-700',
    SH: 'bg-teal-900 text-teal-200 border-teal-700',
    MDR: 'bg-purple-900 text-purple-200 border-purple-700',
    ODR: 'bg-slate-800 text-slate-300 border-slate-600',
    VR: 'bg-amber-900 text-amber-200 border-amber-700',
    Urban: 'bg-gray-800 text-gray-300 border-gray-600'
  };

  const style = config[type] || config.Urban;

  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${style}`}>
      {type}
    </span>
  );
}
