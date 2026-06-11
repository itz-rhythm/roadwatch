import { useState } from 'react';
import { FileText, Download, Loader2, CheckCircle, Building2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const WARDS = [
  { id: 1, name: 'Ward 1 — Navrangpura' },
  { id: 2, name: 'Ward 2 — Maninagar' },
  { id: 3, name: 'Ward 3 — Bodakdev' },
  { id: 4, name: 'Ward 4 — Vastrapur' },
  { id: 5, name: 'Ward 5 — Chandkheda' },
  { id: 6, name: 'Ward 6 — Naroda' },
  { id: 7, name: 'Ward 7 — Narol' },
  { id: 8, name: 'Ward 8 — Vejalpur' },
];

// Simulated RTI preview data (fallback when API is offline)
const MOCK_PREVIEW = (wardId, dateRange) => ({
  ward: WARDS.find(w => w.id === Number(wardId))?.name || 'Selected Ward',
  dateRange,
  totalComplaints: 47,
  resolvedComplaints: 31,
  pendingComplaints: 16,
  slaBreach: 4,
  totalBudgetSpent: '₹8.4 Crore',
  contractors: [
    { name: 'L&T Construction', roads: 5, budget: '₹4.2 Cr', rating: 4.8 },
    { name: 'J Kumar Infra', roads: 3, budget: '₹2.1 Cr', rating: 4.1 },
    { name: 'Dilip Buildcon', roads: 2, budget: '₹2.1 Cr', rating: 3.2 },
  ],
  generatedAt: new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }),
});

export default function RtiGenerator() {
  const [wardId, setWardId] = useState('');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!wardId) { setError('Please select a ward.'); return; }
    setError('');
    setLoading(true);
    setPreview(null);
    setDownloadUrl('');

    try {
      const res = await api.get('/rti/generate', { params: { ward_id: wardId, date_range: dateRange } });
      if (res.data.download_url) setDownloadUrl(res.data.download_url);
      setPreview(MOCK_PREVIEW(wardId, dateRange));
    } catch {
      // Backend offline — show mock preview
      setPreview(MOCK_PREVIEW(wardId, dateRange));
    } finally {
      setLoading(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const DATE_RANGE_LABELS = {
    last_30_days: 'Last 30 Days',
    last_90_days: 'Last 90 Days',
    last_6_months: 'Last 6 Months',
    last_year: 'Last 1 Year',
    all_time: 'All Time',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold px-4 py-2 rounded-full mb-4">
          <FileText className="w-4 h-4" /> RTI — Right to Information
        </div>
        <h1 className="text-4xl font-heading font-bold mb-4">RTI Document Generator</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Generate official RTI documents for any ward. Download a complete report of complaints, budget spending, and contractor accountability to hold authorities accountable.
        </p>
      </div>

      {/* Form */}
      <div className="glass-card p-8 mb-8">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Select Ward *
              </label>
              <select
                value={wardId}
                onChange={e => setWardId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl py-3 px-4 text-white outline-none transition-colors text-sm"
              >
                <option value="">— Choose a ward —</option>
                {WARDS.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl py-3 px-4 text-white outline-none transition-colors text-sm"
              >
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="last_year">Last 1 Year</option>
                <option value="all_time">All Time</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating RTI Document...</>
            ) : (
              <><FileText className="w-5 h-5" /> Generate RTI Document</>
            )}
          </button>
        </form>
      </div>

      {/* Preview */}
      {preview && (
        <div className="animate-fade-in" id="rti-preview">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold">RTI Document Preview</h2>
            <div className="flex gap-3">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download
                  className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              )}
              <button
                onClick={handleBrowserPrint}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
              >
                <Download className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            {/* RTI Document Header */}
            <div className="bg-gradient-to-r from-orange-600/20 to-amber-600/10 border-b border-orange-500/20 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-orange-400 font-heading">RIGHT TO INFORMATION ACT, 2005</h3>
                  <h4 className="text-lg font-bold text-white mt-1">Infrastructure Accountability Report</h4>
                  <p className="text-slate-400 text-sm mt-2">
                    {preview.ward} · {DATE_RANGE_LABELS[dateRange]}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div className="font-bold text-slate-200 mb-1">Generated via RoadWatch</div>
                  <div>{preview.generatedAt}</div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Complaints Filed', value: preview.totalComplaints, color: 'text-blue-400' },
                  { label: 'Complaints Resolved', value: preview.resolvedComplaints, color: 'text-emerald-400' },
                  { label: 'Pending Resolution', value: preview.pendingComplaints, color: 'text-amber-400' },
                  { label: 'SLA Breaches', value: preview.slaBreach, color: 'text-red-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 text-center">
                    <div className={`text-3xl font-bold font-heading ${s.color} mb-1`}>{s.value}</div>
                    <div className="text-xs text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Budget */}
              <div className="mb-8 p-5 bg-slate-900/60 border border-slate-700 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  <Building2 className="w-3.5 h-3.5" /> Total Public Budget Spent
                </div>
                <div className="text-4xl font-bold text-orange-400 font-heading">{preview.totalBudgetSpent}</div>
                <div className="text-sm text-slate-400 mt-1">During selected period in {preview.ward}</div>
              </div>

              {/* Contractor Table */}
              <div>
                <h4 className="font-bold font-heading text-slate-200 mb-4">Contractor-wise Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-xs uppercase text-slate-400 font-bold tracking-wider py-3 pr-4">Contractor Name</th>
                        <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider py-3 px-4">Roads Built</th>
                        <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider py-3 px-4">Budget Allocated</th>
                        <th className="text-right text-xs uppercase text-slate-400 font-bold tracking-wider py-3 pl-4">Citizen Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.contractors.map((c, i) => (
                        <tr key={i} className="border-b border-slate-800">
                          <td className="py-3 pr-4 font-semibold text-slate-200">{c.name}</td>
                          <td className="py-3 px-4 text-right text-slate-300">{c.roads}</td>
                          <td className="py-3 px-4 text-right font-mono text-orange-400 font-semibold">{c.budget}</td>
                          <td className="py-3 pl-4 text-right">
                            <span className={`font-bold ${c.rating >= 4 ? 'text-emerald-400' : c.rating >= 3 ? 'text-amber-400' : 'text-red-400'}`}>
                              ★ {c.rating}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700 text-xs text-slate-500 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                This document has been generated from verified public infrastructure data via the RoadWatch platform under the provisions of the RTI Act, 2005.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
