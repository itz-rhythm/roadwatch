import { useState } from 'react';
import { Clock, CheckCircle, Award, Shield, FileText } from 'lucide-react';
import { formatRelativeTime } from '../utils/format';

export default function CitizenDashboard() {
  const [reports] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('roadwatch_complaints') || '[]');
    } catch {
      return [];
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in text-slate-100">
      <h1 className="text-4xl font-heading font-bold mb-8">My Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="glass-card p-6 border-orange-500/30">
          <h3 className="text-slate-400 font-medium flex items-center gap-2">
            <Award className="text-orange-500 w-5 h-5" /> Reputation Points
          </h3>
          <div className="text-4xl font-bold text-orange-500 mt-2">
            {(1450 + reports.length * 10).toLocaleString()}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-slate-400 font-medium flex items-center gap-2">
            <Shield className="text-purple-500 w-5 h-5" /> Badges Earned
          </h3>
          <div className="text-4xl font-bold mt-2">3</div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-slate-400 font-medium flex items-center gap-2">
            <FileText className="text-blue-500 w-5 h-5" /> Reports Submitted
          </h3>
          <div className="text-4xl font-bold mt-2">
            {12 + reports.length}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-slate-400 font-medium flex items-center gap-2">
            <CheckCircle className="text-emerald-500 w-5 h-5" /> Reports Resolved
          </h3>
          <div className="text-4xl font-bold text-emerald-400 mt-2">8</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle: My Reports List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-heading font-bold">My Recent Submissions</h2>
          {reports.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-500 italic">
              You haven't submitted any custom reports yet in this session.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="glass-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                      {report.categoryIcon || '🕳️'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 capitalize">{report.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{report.address}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{formatRelativeTime(report.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="bg-orange-500/25 text-orange-400 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                      {report.severity}
                    </span>
                    <span className="bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-blue-500/10">
                      <Clock className="w-3.5 h-3.5" /> {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Profile & Community Info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-bold">Rewards & Badges</h2>
          <div className="glass-card p-6 space-y-4">
            <div className="flex gap-4 items-center border-b border-slate-800 pb-4">
              <span className="text-3xl">🛡️</span>
              <div>
                <h4 className="font-bold text-slate-200">Road Guardian</h4>
                <p className="text-xs text-slate-400 mt-0.5">Awarded for reporting 10+ validated issues.</p>
              </div>
            </div>
            <div className="flex gap-4 items-center border-b border-slate-800 pb-4">
              <span className="text-3xl">⭐</span>
              <div>
                <h4 className="font-bold text-slate-200">Eagle Eye</h4>
                <p className="text-xs text-slate-400 mt-0.5">Given for upvoting 20 verified community issues.</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-3xl">🏗️</span>
              <div>
                <h4 className="font-bold text-slate-200">Civic Architect</h4>
                <p className="text-xs text-slate-400 mt-0.5">Awarded when your reported pothole is fully repaired.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
