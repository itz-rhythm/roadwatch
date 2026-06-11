import { useState, useEffect } from 'react';
import {
  BarChart2, Road, HardHat, Users, Settings, Loader2,
  Ban, ShieldCheck, ChevronRight
} from 'lucide-react';
import api from '../utils/api';

// Mock fallback data
const MOCK_WARDS = [
  { id: 1, name: 'Ward 1 - Navrangpura', open_complaints: 8, complaints_per_km: 1.2, road_length: 12 },
  { id: 2, name: 'Ward 2 - Maninagar', open_complaints: 22, complaints_per_km: 4.5, road_length: 8 },
  { id: 3, name: 'Ward 3 - Bodakdev', open_complaints: 5, complaints_per_km: 0.8, road_length: 14 },
  { id: 4, name: 'Ward 4 - Vastrapur', open_complaints: 14, complaints_per_km: 2.3, road_length: 11 },
  { id: 5, name: 'Ward 5 - Chandkheda', open_complaints: 31, complaints_per_km: 6.2, road_length: 9 },
];
const MOCK_CONTRACTORS = [
  { id: 1, name: 'L&T Construction', average_rating: 4.8, total_roads_built: 120, total_roads_failed: 2, blacklisted: false },
  { id: 2, name: 'J Kumar Infra', average_rating: 4.1, total_roads_built: 45, total_roads_failed: 4, blacklisted: false },
  { id: 3, name: 'Dilip Buildcon', average_rating: 3.2, total_roads_built: 78, total_roads_failed: 9, blacklisted: false },
  { id: 4, name: 'Shady Builders Co', average_rating: 1.2, total_roads_built: 15, total_roads_failed: 12, blacklisted: true },
  { id: 5, name: 'NCC Limited', average_rating: 3.8, total_roads_built: 35, total_roads_failed: 3, blacklisted: false },
];
const MOCK_CATEGORY_DATA = [
  { label: 'Pothole', value: 45, color: '#f97316' },
  { label: 'Waterlogging', value: 20, color: '#3b82f6' },
  { label: 'Black Spot', value: 15, color: '#8b5cf6' },
  { label: 'Road Damage', value: 12, color: '#ef4444' },
  { label: 'Signage', value: 8, color: '#6b7280' },
];

const TABS = [
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
  { key: 'roads', label: 'Roads Manager', icon: Road },
  { key: 'contractors', label: 'Contractors', icon: HardHat },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'settings', label: 'System Settings', icon: Settings },
];

// Simple SVG donut chart for category breakdown
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = 70;
  const cx = 100, cy = 100;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <svg width="200" height="200" className="shrink-0">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1e293b" strokeWidth="20" />
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const offset = data.slice(0, i).reduce((s, item) => s + item.value, 0);
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="20"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circumference / total * radius * 2 * Math.PI / circumference}
              style={{ transform: `rotate(${(offset / total) * 360 - 90}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            />
          );
          return el;
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-white" style={{ fontSize: 22, fontWeight: 700 }}>
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fill: '#94a3b8' }}>
          Complaints
        </text>
      </svg>
      <div className="space-y-2 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-sm text-slate-300">{d.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 rounded-full bg-slate-700 w-20 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(d.value / total) * 100}%`, background: d.color }} />
              </div>
              <span className="text-sm font-bold text-slate-200 w-8 text-right">{d.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Ward performance bar chart
function WardChart({ wards }) {
  const max = Math.max(...wards.map(w => w.complaints_per_km));
  return (
    <div className="space-y-3">
      {wards.sort((a, b) => b.complaints_per_km - a.complaints_per_km).map(w => (
        <div key={w.id}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 font-medium">{w.name}</span>
            <span className={`font-bold ${w.complaints_per_km > 4 ? 'text-red-400' : w.complaints_per_km > 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {w.complaints_per_km.toFixed(1)}/km
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${w.complaints_per_km > 4 ? 'bg-red-500' : w.complaints_per_km > 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${(w.complaints_per_km / max) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{w.open_complaints} open complaints</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [wards, setWards] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wardRes, contractorRes] = await Promise.all([
          api.get('/dashboard/ward-rankings'),
          api.get('/contractors'),
        ]);
        setWards(wardRes.data);
        setContractors(contractorRes.data);
      } catch {
        setWards(MOCK_WARDS);
        setContractors(MOCK_CONTRACTORS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleBlacklist = async (id, currentState) => {
    try {
      await api.patch(`/contractors/${id}`, { blacklisted: !currentState });
    } catch { /* demo mode */ }
    setContractors(prev => prev.map(c =>
      c.id === id ? { ...c, blacklisted: !currentState } : c
    ));
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden animate-fade-in">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Admin Control</h2>
        </div>
        <nav className="p-3 flex-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-semibold transition-all text-left ${
                activeTab === tab.key
                  ? 'bg-orange-600/20 text-orange-400 border border-orange-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
              {activeTab === tab.key && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-950/40">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /></div>
        ) : (
          <>
            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-heading font-bold mb-2">City Analytics</h1>
                <p className="text-slate-400 text-sm mb-8">Real-time infrastructure health across all wards.</p>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="glass-card p-6">
                    <h3 className="font-bold font-heading mb-1">Complaint Breakdown by Category</h3>
                    <p className="text-slate-400 text-xs mb-6">Distribution across reported issue types</p>
                    <DonutChart data={MOCK_CATEGORY_DATA} />
                  </div>
                  <div className="glass-card p-6">
                    <h3 className="font-bold font-heading mb-1">Ward Performance Index</h3>
                    <p className="text-slate-400 text-xs mb-6">Complaints per km of road — lower is better</p>
                    <WardChart wards={wards} />
                  </div>
                  <div className="glass-card p-6 xl:col-span-2">
                    <h3 className="font-bold font-heading mb-6">Top Wards Summary</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left text-xs uppercase text-slate-400 font-bold tracking-wider py-3 pr-4">Ward</th>
                            <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider py-3 px-4">Road Length</th>
                            <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider py-3 px-4">Open Complaints</th>
                            <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider py-3 px-4">Complaints/km</th>
                            <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider py-3 pl-4">Health</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wards.map(w => (
                            <tr key={w.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 pr-4 font-medium text-slate-200">{w.name}</td>
                              <td className="py-3 px-4 text-right text-slate-400">{w.road_length} km</td>
                              <td className="py-3 px-4 text-right font-mono text-slate-300">{w.open_complaints}</td>
                              <td className="py-3 px-4 text-right">
                                <span className={`font-bold font-mono ${w.complaints_per_km > 4 ? 'text-red-400' : w.complaints_per_km > 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {w.complaints_per_km.toFixed(1)}
                                </span>
                              </td>
                              <td className="py-3 pl-4 text-right">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${w.complaints_per_km > 4 ? 'bg-red-500/20 text-red-400' : w.complaints_per_km > 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                  {w.complaints_per_km > 4 ? 'Critical' : w.complaints_per_km > 2 ? 'Average' : 'Good'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTRACTORS TAB */}
            {activeTab === 'contractors' && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-heading font-bold mb-2">Contractors Manager</h1>
                <p className="text-slate-400 text-sm mb-8">Manage contractor status and track performance.</p>
                <div className="glass-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-xs uppercase text-slate-400 font-bold tracking-wider px-6 py-4">Contractor</th>
                        <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider px-4 py-4">Rating</th>
                        <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider px-4 py-4">Roads Built</th>
                        <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider px-4 py-4">Failed</th>
                        <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider px-4 py-4">Status</th>
                        <th className="px-4 py-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractors.map(c => (
                        <tr key={c.id} className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${c.blacklisted ? 'bg-red-500/5' : ''}`}>
                          <td className="px-6 py-4 font-semibold text-slate-200 flex items-center gap-2">
                            <HardHat className="w-4 h-4 text-slate-500" />
                            {c.name}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`font-bold ${c.average_rating >= 4 ? 'text-emerald-400' : c.average_rating >= 3 ? 'text-amber-400' : 'text-red-400'}`}>
                              ★ {c.average_rating?.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-slate-300 font-mono">{c.total_roads_built}</td>
                          <td className="px-4 py-4 text-right">
                            <span className={`font-mono font-bold ${c.total_roads_failed > 5 ? 'text-red-400' : 'text-slate-300'}`}>{c.total_roads_failed}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {c.blacklisted
                              ? <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold">Blacklisted</span>
                              : <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">Active</span>}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => toggleBlacklist(c.id, c.blacklisted)}
                              className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                                c.blacklisted
                                  ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                                  : 'text-red-400 border-red-500/30 hover:bg-red-500/10'
                              }`}
                            >
                              {c.blacklisted ? <><ShieldCheck className="w-3 h-3" /> Restore</> : <><Ban className="w-3 h-3" /> Blacklist</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ROADS TAB */}
            {activeTab === 'roads' && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-heading font-bold mb-2">Roads Manager</h1>
                <p className="text-slate-400 text-sm mb-8">View and manage registered road infrastructure data.</p>
                <div className="glass-card p-8 text-center text-slate-400">
                  <Road className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                  <p className="font-semibold">Road records are managed via the Road Transparency page.</p>
                  <p className="text-sm mt-1">Visit <span className="text-orange-400">/roads</span> to search, view, and update road records.</p>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-heading font-bold mb-2">Users Manager</h1>
                <p className="text-slate-400 text-sm mb-8">Manage citizen and authority accounts.</p>
                <div className="glass-card p-8 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                  <p className="font-semibold">User management API coming soon.</p>
                  <p className="text-sm mt-1">This feature requires a <code className="text-orange-400">/users</code> admin endpoint to be enabled.</p>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="animate-fade-in">
                <h1 className="text-3xl font-heading font-bold mb-2">System Settings</h1>
                <p className="text-slate-400 text-sm mb-8">Platform configuration and environment info.</p>
                <div className="glass-card p-6 space-y-4">
                  {[
                    { label: 'API Base URL', value: import.meta.env.VITE_API_URL || 'http://localhost:5000', mono: true },
                    { label: 'Platform Version', value: 'RoadWatch v1.0.0 (Beta)', mono: false },
                    { label: 'Environment', value: import.meta.env.MODE || 'development', mono: true },
                    { label: 'Default SLA — Critical', value: '24 hours', mono: true },
                    { label: 'Default SLA — Dangerous', value: '48 hours', mono: true },
                    { label: 'Default SLA — Moderate', value: '7 days', mono: true },
                    { label: 'Default SLA — Minor', value: '30 days', mono: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                      <span className="text-slate-400 text-sm">{item.label}</span>
                      <span className={`text-sm ${item.mono ? 'font-mono text-orange-400' : 'text-slate-200 font-semibold'}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
