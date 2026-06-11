import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, TrendingUp, ChevronRight,
  X, Loader2, Search, Building2, CircleAlert
} from 'lucide-react';
import api from '../utils/api';

// ── Mock data used as fallback while backend is offline ──
const MOCK_COMPLAINTS = [
  { id: 'C001', title: 'Large Pothole', category: 'pothole', severity: 'critical', status: 'reported', address: 'SG Highway, Ward 5', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), sla_deadline: new Date(Date.now() - 86400000).toISOString(), upvote_count: 38 },
  { id: 'C002', title: 'Road Waterlogging', category: 'waterlogging', severity: 'dangerous', status: 'assigned', address: 'CG Road, Ward 2', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), sla_deadline: new Date(Date.now() + 86400000).toISOString(), upvote_count: 14 },
  { id: 'C003', title: 'Black Spot - No Light', category: 'black_spot', severity: 'dangerous', status: 'reported', address: 'Vasna Barrage Rd', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), sla_deadline: new Date(Date.now() - 86400000 * 2).toISOString(), upvote_count: 62 },
  { id: 'C004', title: 'Cracked Road Surface', category: 'road_damage', severity: 'moderate', status: 'in_progress', address: 'MG Road, Ward 4', created_at: new Date(Date.now() - 86400000 * 1).toISOString(), sla_deadline: new Date(Date.now() + 86400000 * 6).toISOString(), upvote_count: 9 },
  { id: 'C005', title: 'Missing Road Signage', category: 'missing_signage', severity: 'minor', status: 'verified', address: 'Outer Ring Road', created_at: new Date(Date.now() - 86400000 * 7).toISOString(), sla_deadline: new Date(Date.now() + 86400000 * 20).toISOString(), upvote_count: 5 },
  { id: 'C006', title: 'Collapsed Road Edge', category: 'road_damage', severity: 'critical', status: 'reported', address: 'Narol Bridge, Ward 8', created_at: new Date(Date.now() - 86400000 * 0.5).toISOString(), sla_deadline: new Date(Date.now() + 86400000 * 0.5).toISOString(), upvote_count: 21 },
];

const MOCK_CONTRACTORS = [
  { id: 1, name: 'L&T Construction' },
  { id: 2, name: 'J Kumar Infra' },
  { id: 3, name: 'Dilip Buildcon' },
  { id: 4, name: 'NCC Limited' },
];

const SEVERITY_STYLES = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  dangerous: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  minor: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const STATUS_STYLES = {
  reported: 'bg-blue-500/20 text-blue-400',
  verified: 'bg-purple-500/20 text-purple-400',
  assigned: 'bg-amber-500/20 text-amber-400',
  in_progress: 'bg-cyan-500/20 text-cyan-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-slate-500/20 text-slate-400',
};

const CATEGORY_ICONS = {
  pothole: '🕳️', waterlogging: '🌊', black_spot: '🌑',
  road_damage: '🛣️', missing_signage: '🚧', other: '📍',
};

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-bold font-heading mb-1">{value}</div>
      <div className="text-slate-400 text-sm font-medium">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function SlaCountdown({ deadline }) {
  const diff = new Date(deadline) - new Date();
  const breached = diff < 0;
  const hours = Math.abs(Math.floor(diff / 3600000));
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return (
    <span className={`text-xs font-bold ${breached ? 'text-red-400' : hours < 24 ? 'text-amber-400' : 'text-slate-400'}`}>
      {breached ? `⚠ ${days}d ${rem}h overdue` : days > 0 ? `${days}d ${rem}h left` : `${hours}h left`}
    </span>
  );
}

export default function AuthorityDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [assignModal, setAssignModal] = useState(null); // complaint object
  const [selectedContractor, setSelectedContractor] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, contractorRes] = await Promise.all([
          api.get('/complaints?status=reported&status=verified&status=assigned&status=in_progress'),
          api.get('/contractors'),
        ]);
        setComplaints(cRes.data);
        setContractors(contractorRes.data);
      } catch {
        // Backend offline — use mock data for demo
        setComplaints(MOCK_COMPLAINTS);
        setContractors(MOCK_CONTRACTORS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = complaints
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .filter(c => filterSeverity === 'all' || c.severity === filterSeverity)
    .filter(c =>
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.id).includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'severity') {
        const order = { critical: 0, dangerous: 1, moderate: 2, minor: 3 };
        return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
      }
      if (sortBy === 'upvotes') return (b.upvote_count || 0) - (a.upvote_count || 0);
      if (sortBy === 'sla') return new Date(a.sla_deadline) - new Date(b.sla_deadline);
      return 0;
    });

  const stats = {
    open: complaints.filter(c => c.status !== 'completed' && c.status !== 'rejected').length,
    slaBreach: complaints.filter(c => c.sla_deadline && new Date(c.sla_deadline) < new Date() && c.status !== 'completed').length,
    critical: complaints.filter(c => c.severity === 'critical').length,
    assigned: complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length,
  };

  const handleAssign = async () => {
    if (!selectedContractor || !assignModal) return;
    setAssigning(true);
    try {
      await api.patch(`/complaints/${assignModal.id}/status`, {
        new_status: 'assigned',
        note: `Assigned to ${contractors.find(c => String(c.id) === selectedContractor)?.name}`,
      });
      setComplaints(prev => prev.map(c =>
        c.id === assignModal.id ? { ...c, status: 'assigned' } : c
      ));
      setSuccessMsg(`Complaint #RW-${assignModal.id} assigned successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      // Update locally for demo
      setComplaints(prev => prev.map(c =>
        c.id === assignModal.id ? { ...c, status: 'assigned' } : c
      ));
      setSuccessMsg(`Complaint #RW-${assignModal.id} assigned (demo mode).`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setAssigning(false);
      setAssignModal(null);
      setSelectedContractor('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-heading font-bold text-blue-400">Authority Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage complaints, assign contractors, and track SLA compliance.</p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
          🟢 Live · {new Date().toLocaleTimeString('en-IN', { timeStyle: 'short' })}
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Open Complaints" value={stats.open} icon={AlertTriangle} color="bg-blue-500/20 text-blue-400" />
            <StatCard label="SLA Breached" value={stats.slaBreach} sub="Needs immediate action" icon={CircleAlert} color="bg-red-500/20 text-red-400" />
            <StatCard label="Critical Issues" value={stats.critical} icon={TrendingUp} color="bg-orange-500/20 text-orange-400" />
            <StatCard label="In Progress" value={stats.assigned} icon={CheckCircle} color="bg-emerald-500/20 text-emerald-400" />
          </div>

          {/* Success toast */}
          {successMsg && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-4 mb-6 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
            </div>
          )}

          {/* Filters */}
          <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, address, or ref no..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 outline-none text-sm transition-colors"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors flex-1"
              >
                <option value="all">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="verified">Verified</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
              </select>
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors flex-1"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="dangerous">Dangerous</option>
                <option value="moderate">Moderate</option>
                <option value="minor">Minor</option>
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition-colors flex-1"
              >
                <option value="newest">Newest First</option>
                <option value="severity">By Severity</option>
                <option value="upvotes">Most Upvoted</option>
                <option value="sla">SLA Deadline</option>
              </select>
            </div>
          </div>

          {/* Complaint Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-xs uppercase text-slate-400 font-bold tracking-wider px-6 py-4">Ref / Issue</th>
                    <th className="text-left text-xs uppercase text-slate-400 font-bold tracking-wider px-4 py-4">Location</th>
                    <th className="text-left text-xs uppercase text-slate-400 font-bold tracking-wider px-4 py-4">Severity</th>
                    <th className="text-left text-xs uppercase text-slate-400 font-bold tracking-wider px-4 py-4">Status</th>
                    <th className="text-left text-xs uppercase text-slate-400 font-bold tracking-wider px-4 py-4">SLA</th>
                    <th className="text-left text-xs uppercase text-slate-400 font-bold tracking-wider px-4 py-4">Upvotes</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-500">No complaints match your filters.</td></tr>
                  ) : filtered.map(c => {
                    const slaBreach = c.sla_deadline && new Date(c.sla_deadline) < new Date() && c.status !== 'completed';
                    return (
                      <tr key={c.id} className={`border-b border-slate-800 hover:bg-slate-800/40 transition-colors ${slaBreach ? 'bg-red-500/5' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{CATEGORY_ICONS[c.category] || '📍'}</span>
                            <div>
                              <div className="font-semibold text-white capitalize">{c.title}</div>
                              <div className="text-xs text-orange-400 font-mono">RW-{c.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-400 text-xs max-w-[160px] truncate">{c.address}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.minor}`}>
                            {c.severity}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${STATUS_STYLES[c.status] || ''}`}>
                            {c.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {c.sla_deadline ? <SlaCountdown deadline={c.sla_deadline} /> : <span className="text-slate-600 text-xs">N/A</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-400 text-sm font-mono">▲ {c.upvote_count || 0}</td>
                        <td className="px-4 py-4">
                          {c.status !== 'completed' && c.status !== 'rejected' && (
                            <button
                              onClick={() => setAssignModal(c)}
                              className="text-xs font-bold text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap border border-orange-500/20 hover:border-orange-500/40"
                            >
                              Assign <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-800 text-xs text-slate-500">
              Showing {filtered.length} of {complaints.length} complaints
            </div>
          </div>
        </>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="glass-card w-full max-w-md p-8 animate-fade-in">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold font-heading">Assign Contractor</h3>
                <p className="text-slate-400 text-sm mt-1">
                  For: <span className="text-white capitalize">{assignModal.title}</span>
                  <span className="text-orange-400 font-mono ml-2 text-xs">#RW-{assignModal.id}</span>
                </p>
              </div>
              <button onClick={() => setAssignModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block mb-3">
                Select Contractor
              </label>
              <div className="space-y-2">
                {contractors.map(con => (
                  <button
                    key={con.id}
                    onClick={() => setSelectedContractor(String(con.id))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedContractor === String(con.id)
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium">{con.name}</span>
                    {selectedContractor === String(con.id) && (
                      <CheckCircle className="w-4 h-4 text-orange-400 ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAssignModal(null)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button
                onClick={handleAssign}
                disabled={!selectedContractor || assigning}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
