import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThumbsUp, Clock, CheckCircle2, AlertCircle, Loader2, MapPin, Calendar, Hash } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_ORDER = ['reported', 'verified', 'assigned', 'in_progress', 'completed'];
const STATUS_LABELS = {
  reported: 'Reported',
  verified: 'Verified',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
};

const SEVERITY_STYLES = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  dangerous: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  minor: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const CATEGORY_ICONS = {
  pothole: '🕳️',
  waterlogging: '🌊',
  black_spot: '🌑',
  road_damage: '🛣️',
  missing_signage: '🚧',
  other: '📍',
};

export default function ComplaintTrack() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upvoting, setUpvoting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);

  const fetchComplaint = useCallback(async () => {
    if (!id || id === 'demo') {
      // Demo/mock data when no real ID
      setTimeout(() => {
        setComplaint({
          id: '8492',
          title: 'Deep Pothole on Main Road',
          description: 'Large pothole causing traffic slowdown and vehicle damage near the bus stop.',
          category: 'pothole',
          address: 'SG Highway near Maninagar crossroads, Ahmedabad',
          severity: 'critical',
          status: 'assigned',
          upvote_count: 42,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          sla_deadline: new Date(Date.now() + 86400000).toISOString(),
          timeline: [
            { status: 'reported', note: 'Complaint reported by citizen', changed_at: new Date(Date.now() - 86400000 * 2).toISOString() },
            { status: 'verified', note: 'Verified by ward engineer', changed_at: new Date(Date.now() - 86400000).toISOString() },
            { status: 'assigned', note: 'Assigned to L&T Maintenance Crew', changed_at: new Date(Date.now() - 3600000 * 6).toISOString() },
          ],
        });
        setLoading(false);
      }, 0);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/complaints/${id}`);
      setComplaint(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Complaint not found. Please check the reference number.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

  const handleUpvote = async () => {
    if (!user) { window.location.href = '/login'; return; }
    if (upvoted) return;
    setUpvoting(true);
    try {
      const res = await api.post(`/complaints/${id}/upvote`);
      setComplaint(prev => ({ ...prev, upvote_count: res.data.upvotes }));
      setUpvoted(true);
    } catch {
      // Might already be upvoted
    } finally {
      setUpvoting(false);
    }
  };

  const slaBreach = complaint?.sla_deadline && new Date(complaint.sla_deadline) < new Date();
  const activeStepIndex = STATUS_ORDER.indexOf(complaint?.status);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Complaint Not Found</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-orange-500 text-sm font-bold mb-1">
            <Hash className="w-4 h-4" />
            Reference No: RW-{complaint.id}
          </div>
          <h1 className="text-3xl font-heading font-bold capitalize">{complaint.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border ${SEVERITY_STYLES[complaint.severity] || SEVERITY_STYLES.minor}`}>
            {complaint.severity}
          </span>
          {slaBreach && (
            <span className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold uppercase">
              ⚠ SLA Breached
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Timeline — Left */}
        <div className="lg:col-span-3 glass-card p-8">
          <h2 className="text-lg font-bold mb-8 text-slate-200">Complaint Timeline</h2>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-700" />
            <div
              className="absolute left-4 top-2 w-0.5 bg-gradient-to-b from-orange-500 to-emerald-500 transition-all duration-700"
              style={{ height: activeStepIndex >= 0 ? `${(activeStepIndex / (STATUS_ORDER.length - 1)) * 100}%` : '0%' }}
            />

            <div className="space-y-8 relative">
              {STATUS_ORDER.map((step, index) => {
                const timelineEntry = complaint.timeline?.find(t => t.status === step);
                const isActive = index <= activeStepIndex;
                const isCurrent = index === activeStepIndex;
                return (
                  <div key={step} className="flex items-start gap-6">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 z-10 transition-all ${
                      isActive
                        ? isCurrent
                          ? 'bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/40'
                          : 'bg-emerald-600 border-emerald-500'
                        : 'bg-slate-800 border-slate-600'
                    }`}>
                      {isActive && !isCurrent && <CheckCircle2 className="w-4 h-4 text-white" />}
                      {isCurrent && <Clock className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-500'}`}>
                          {STATUS_LABELS[step]}
                        </h4>
                        {isCurrent && (
                          <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Current</span>
                        )}
                      </div>
                      {timelineEntry ? (
                        <>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(timelineEntry.changed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                          {timelineEntry.note && (
                            <p className="text-xs text-slate-300 mt-1.5 bg-slate-800 px-3 py-2 rounded-lg">
                              {timelineEntry.note}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-slate-600 mt-0.5">Pending</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details — Right */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-200 text-lg mb-4 capitalize">
              {CATEGORY_ICONS[complaint.category] || '📍'} {complaint.title}
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3 text-slate-400">
                <MapPin className="w-4 h-4 mt-0.5 text-orange-500 shrink-0" />
                <span>{complaint.address || 'Location not available'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Reported on {new Date(complaint.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
              </div>
              {complaint.sla_deadline && (
                <div className={`flex items-center gap-3 ${slaBreach ? 'text-red-400' : 'text-slate-400'}`}>
                  <Clock className={`w-4 h-4 shrink-0 ${slaBreach ? 'text-red-400' : 'text-emerald-500'}`} />
                  <span>
                    SLA: {new Date(complaint.sla_deadline).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    {slaBreach ? ' (BREACHED)' : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-5 pt-5 border-t border-slate-700">
              <p className="text-slate-300 text-sm leading-relaxed">{complaint.description}</p>
            </div>
          </div>

          {/* Upvote card */}
          <div className="glass-card p-6 text-center">
            <p className="text-slate-400 text-sm mb-4">Is this issue affecting you too? Upvote to escalate it faster.</p>
            <button
              onClick={handleUpvote}
              disabled={upvoting || upvoted}
              className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold transition-all ${
                upvoted
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 cursor-default'
                  : 'btn-secondary hover:border-orange-500/50 hover:text-orange-400'
              }`}
            >
              {upvoting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ThumbsUp className="w-4 h-4" />}
              {upvoted ? 'Upvoted!' : 'Upvote Issue'}
              <span className="ml-auto bg-slate-700 px-2.5 py-0.5 rounded-lg font-mono text-sm">
                ▲ {complaint.upvote_count || 0}
              </span>
            </button>
            {!user && (
              <p className="text-xs text-slate-500 mt-2">
                <Link to="/login" className="text-orange-400 hover:underline">Sign in</Link> to upvote
              </p>
            )}
          </div>

          {/* Share card */}
          <div className="glass-card p-5">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3">Share Reference</p>
            <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-4 py-3 border border-slate-700">
              <Hash className="w-4 h-4 text-orange-500 shrink-0" />
              <code className="text-orange-400 font-mono text-sm flex-1">RW-{complaint.id}</code>
              <button
                onClick={() => navigator.clipboard.writeText(`RW-${complaint.id}`)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
