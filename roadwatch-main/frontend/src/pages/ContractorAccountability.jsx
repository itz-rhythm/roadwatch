import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Ban, Flag, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import api from '../utils/api';

const MOCK_CONTRACTORS = [
  { id: 1, name: 'L&T Construction', average_rating: 4.8, total_roads_built: 120, total_roads_failed: 2, blacklisted: false, failure_frequency_score: 0.8, corruption_flagged: false },
  { id: 2, name: 'NCC Limited', average_rating: 4.3, total_roads_built: 88, total_roads_failed: 3, blacklisted: false, failure_frequency_score: 1.2, corruption_flagged: false },
  { id: 3, name: 'J Kumar Infra', average_rating: 4.1, total_roads_built: 45, total_roads_failed: 4, blacklisted: false, failure_frequency_score: 2.1, corruption_flagged: false },
  { id: 4, name: 'Dilip Buildcon', average_rating: 3.2, total_roads_built: 78, total_roads_failed: 9, blacklisted: false, failure_frequency_score: 4.8, corruption_flagged: false },
  { id: 5, name: 'Apex Road Works', average_rating: 2.8, total_roads_built: 33, total_roads_failed: 8, blacklisted: false, failure_frequency_score: 5.9, corruption_flagged: true },
  { id: 6, name: 'Shady Builders Co', average_rating: 1.2, total_roads_built: 15, total_roads_failed: 12, blacklisted: true, failure_frequency_score: 9.4, corruption_flagged: true },
];

function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`text-sm ${star <= Math.round(rating) ? 'text-amber-400' : 'text-slate-700'}`}
        >★</span>
      ))}
    </div>
  );
}

function ContractorCard({ contractor, onFlag }) {
  const [expanded, setExpanded] = useState(false);
  const { name, average_rating, total_roads_built, total_roads_failed, blacklisted, failure_frequency_score, corruption_flagged, id } = contractor;

  const tier =
    average_rating >= 4.5 ? { label: 'Excellent', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' } :
    average_rating >= 3.5 ? { label: 'Good', cls: 'bg-teal-500/20 text-teal-400 border-teal-500/30' } :
    average_rating >= 2.5 ? { label: 'Average', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' } :
    blacklisted ? { label: 'Blacklisted', cls: 'bg-red-500/20 text-red-400 border-red-500/30' } :
    { label: 'Poor', cls: 'bg-red-500/20 text-red-400 border-red-500/30' };

  const failureRate = total_roads_built > 0 ? ((total_roads_failed / total_roads_built) * 100).toFixed(1) : 0;

  return (
    <div className={`glass-card p-6 transition-all hover:border-slate-600 ${blacklisted ? 'border-red-500/40 shadow-red-900/10' : ''} ${corruption_flagged && !blacklisted ? 'border-amber-500/30' : ''}`}>
      {/* Flag */}
      {corruption_flagged && (
        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Flag className="w-3.5 h-3.5" /> Corruption Risk Flagged
        </div>
      )}
      {blacklisted && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Ban className="w-3.5 h-3.5" /> Blacklisted — Banned from New Projects
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold font-heading text-slate-100">{name}</h3>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${tier.cls}`}>
            {tier.label}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-amber-400">{average_rating?.toFixed(1)}</div>
          <RatingStars rating={average_rating} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-slate-700 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-slate-200">{total_roads_built}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Roads Built</div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-bold ${total_roads_failed > 8 ? 'text-red-400' : total_roads_failed > 3 ? 'text-amber-400' : 'text-slate-200'}`}>{total_roads_failed}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Failed</div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-bold ${failureRate > 30 ? 'text-red-400' : failureRate > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{failureRate}%</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Fail Rate</div>
        </div>
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white transition-colors py-1"
      >
        {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide Details</> : <><ChevronDown className="w-3.5 h-3.5" /> View Details</>}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-4 animate-fade-in">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Failure Frequency Score</span>
              <span className={`font-bold ${failure_frequency_score > 6 ? 'text-red-400' : failure_frequency_score > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {failure_frequency_score?.toFixed(1)} / 10
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${failure_frequency_score > 6 ? 'bg-red-500' : failure_frequency_score > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${(failure_frequency_score / 10) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Recent Project History</p>
            <div className="space-y-1.5">
              {[
                { road: 'MG Road, Ward 4', year: '2025', status: 'completed' },
                { road: 'SV Road Widening', year: '2024', status: 'completed' },
                { road: 'Outer Ring Road Ext.', year: '2024', status: total_roads_failed > 5 ? 'failed' : 'completed' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{p.road} ({p.year})</span>
                  <span className={`font-bold ${p.status === 'completed' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {p.status === 'completed' ? '✓' : '✗'} {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!blacklisted && (
            <button
              onClick={() => onFlag(id)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all ${
                corruption_flagged
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 cursor-default'
                  : 'border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30'
              }`}
              disabled={corruption_flagged}
            >
              <Flag className="w-3.5 h-3.5" />
              {corruption_flagged ? 'Already Flagged for Corruption Risk' : 'Flag Corruption Risk'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContractorAccountability() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('best'); // 'best' | 'worst'
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/contractors/leaderboard');
        setContractors(res.data);
      } catch {
        setContractors(MOCK_CONTRACTORS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFlag = async (id) => {
    try {
      await api.post(`/contractors/${id}/flag`);
    } catch { /* demo */ }
    setContractors(prev => prev.map(c => c.id === id ? { ...c, corruption_flagged: true } : c));
  };

  const filtered = contractors
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => tab === 'best'
      ? b.average_rating - a.average_rating
      : b.failure_frequency_score - a.failure_frequency_score
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-heading font-bold mb-2">Contractor Leaderboard</h1>
          <p className="text-slate-400">Public accountability for road construction firms. Ranked by performance.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contractors..."
            className="bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 outline-none text-sm transition-colors w-64"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 mb-8">
        <button
          onClick={() => setTab('best')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
            tab === 'best' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Best Performers
        </button>
        <button
          onClick={() => setTab('worst')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
            tab === 'worst' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" /> Worst / Flagged
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 mb-6 text-sm text-slate-400">
        <span><span className="text-white font-bold">{contractors.length}</span> contractors registered</span>
        <span><span className="text-emerald-400 font-bold">{contractors.filter(c => c.average_rating >= 4).length}</span> rated excellent</span>
        <span><span className="text-red-400 font-bold">{contractors.filter(c => c.blacklisted).length}</span> blacklisted</span>
        <span><span className="text-amber-400 font-bold">{contractors.filter(c => c.corruption_flagged).length}</span> flagged</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center text-slate-500 py-12">No contractors match your search.</div>
          ) : (
            filtered.map(c => (
              <ContractorCard key={c.id} contractor={c} onFlag={handleFlag} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
