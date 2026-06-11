import { ThumbsUp, ArrowRight, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { ComplaintStatusBadge, SeverityBadge, RoadTypeBadge } from './Badges';
import { formatRelativeTime } from '../../utils/format';

export function ComplaintCard({ complaint }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5 w-full flex flex-col gap-4 shadow-lg hover:border-brand-orange/50 transition-colors">
      <div className="flex gap-4">
        {complaint.thumbnail ? (
          <img src={complaint.thumbnail} alt="Issue" className="w-20 h-20 rounded-lg object-cover bg-slate-800 shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center text-3xl shrink-0">
            {complaint.categoryIcon || '⚠️'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-heading font-bold text-slate-100 truncate">{complaint.title}</h4>
            <ComplaintStatusBadge status={complaint.status} />
          </div>
          <p className="text-sm text-slate-400 truncate mt-1">{complaint.address}</p>
          <div className="flex items-center gap-3 mt-3">
            <SeverityBadge severity={complaint.severity} />
            <span className="text-xs text-slate-500">{formatRelativeTime(complaint.created_at)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
        <button className="flex items-center gap-1.5 text-slate-400 hover:text-brand-orange transition-colors text-sm font-semibold">
          <ThumbsUp className="w-4 h-4" /> {complaint.upvote_count}
        </button>
        <button className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-1.5 px-4 rounded transition-colors flex items-center gap-1.5">
          Track <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function RoadTransparencyCard({ road }) {
  // Condition Bar Color
  let conditionColor = 'bg-brand-green';
  if (road.condition_score <= 3) conditionColor = 'bg-brand-red';
  else if (road.condition_score <= 6) conditionColor = 'bg-brand-yellow';

  // Date Color
  const yearsAgo = (new Date() - new Date(road.last_repair_date)) / (1000 * 60 * 60 * 24 * 365);
  let dateColor = 'text-brand-green';
  if (yearsAgo > 2) dateColor = 'text-brand-red';
  else if (yearsAgo > 1) dateColor = 'text-brand-yellow';

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-xl">
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-xl font-heading font-bold text-white">{road.name}</h3>
        <RoadTypeBadge type={road.road_type} />
      </div>
      <p className="text-sm text-slate-400 mb-5">{road.contractor_name}</p>
      
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1 uppercase tracking-wider text-slate-400">
            <span>Condition Score</span>
            <span>{road.condition_score}/10</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className={`h-full ${conditionColor}`} style={{ width: `${road.condition_score * 10}%` }}></div>
          </div>
        </div>
        
        <div className="flex justify-between items-end border-t border-slate-700/50 pt-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Last Repaired</p>
            <p className={`font-bold ${dateColor}`}>{new Date(road.last_repair_date).getFullYear()}</p>
          </div>
          <div>
             <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${road.in_warranty ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
               {road.in_warranty ? 'Active Warranty' : 'Expired'}
             </span>
          </div>
        </div>
      </div>
      <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
        View Full Record <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ContractorCard({ contractor }) {
  const failureDanger = contractor.failure_rate > 30;
  return (
    <div className={`bg-brand-card border rounded-xl p-6 relative ${contractor.flagged ? 'border-brand-red shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-brand-border'}`}>
      {contractor.flagged && (
        <div className="absolute -top-3 -right-3 bg-brand-red text-white p-2 rounded-full shadow-lg" title="Corruption Risk Flagged">
          <ShieldAlert className="w-5 h-5" />
        </div>
      )}
      <h3 className="font-heading font-bold text-lg text-white mb-1">{contractor.name}</h3>
      <p className="text-xs text-slate-500 mb-4 font-mono">{contractor.license}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900/50 p-3 rounded-lg text-center">
          <div className="text-yellow-500 font-bold text-xl flex justify-center items-center gap-1">
            {contractor.rating} <span className="text-sm">★</span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase mt-1">Rating</div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-lg text-center">
          <div className={`font-bold text-xl ${failureDanger ? 'text-brand-red' : 'text-slate-200'}`}>
            {contractor.failure_rate}%
          </div>
          <div className="text-[10px] text-slate-400 uppercase mt-1">Failure Rate</div>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, trendPct, upIsGood = true, icon }) {
  const isUp = trendPct > 0;
  const isGood = (isUp && upIsGood) || (!isUp && !upIsGood);
  const trendColor = isGood ? 'text-brand-green' : 'text-brand-red';
  const bgTrend = isGood ? 'hover:bg-green-500/5' : 'hover:bg-red-500/5';

  return (
    <div className={`bg-brand-card border border-brand-border rounded-xl p-6 transition-colors ${bgTrend}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="text-3xl font-heading font-bold text-white">{value}</div>
        <div className="text-slate-500">{icon}</div>
      </div>
      <div className="text-sm font-medium text-slate-400 mb-4">{label}</div>
      <div className={`flex items-center gap-1 text-sm font-bold ${trendColor}`}>
        {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(trendPct)}% <span className="text-slate-500 font-normal text-xs ml-1">vs last month</span>
      </div>
    </div>
  );
}

export function LeaderboardRow({ rank, user, isMe }) {
  const getMedal = (r) => {
    if (r === 1) return '🥇';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return <span className="text-slate-500 font-bold w-6 text-center inline-block">{r}</span>;
  };

  return (
    <div className={`flex items-center gap-4 p-4 border-b border-slate-800 last:border-0 ${isMe ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'} transition-colors`}>
      <div className="text-2xl w-8 text-center shrink-0">{getMedal(rank)}</div>
      
      <div className="w-10 h-10 rounded-full bg-slate-700 flex flex-col items-center justify-center shrink-0 text-slate-300 font-bold overflow-hidden border border-slate-600">
        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.initials}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-white truncate">{user.name}</h4>
          {isMe && <span className="bg-brand-orange/20 text-brand-orange text-[10px] px-2 py-0.5 rounded font-bold uppercase">You</span>}
        </div>
        <p className="text-xs text-slate-400 truncate">{user.ward}</p>
      </div>

      <div className="text-right">
        <div className="font-bold text-brand-orange text-lg">{user.points}</div>
        <div className="text-[10px] text-slate-500 uppercase font-semibold">Points</div>
      </div>
    </div>
  );
}
