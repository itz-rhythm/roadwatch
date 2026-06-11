import { useState } from 'react';
import { Check, Mic, Square, CloudOff, AlertTriangle } from 'lucide-react';

export function InteractiveTimeline({ stages }) {
  // stages array: { id, name, status: 'completed'|'current'|'future', date, author, note, photos: [] }
  return (
    <div className="relative pl-6 space-y-8">
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-800"></div>
      
      {stages.map((stage, idx) => (
        <TimelineNode key={stage.id || idx} stage={stage} isLast={idx === stages.length - 1} />
      ))}
    </div>
  );
}

function TimelineNode({ stage }) {
  const [expanded, setExpanded] = useState(false);

  let icon, ringStyle;
  if (stage.status === 'completed') {
    icon = <Check className="w-3 h-3 text-white" />;
    ringStyle = 'bg-brand-green border-brand-green';
  } else if (stage.status === 'current') {
    icon = <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse"></div>;
    ringStyle = 'bg-slate-900 border-brand-orange animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.4)]';
  } else {
    icon = null;
    ringStyle = 'bg-slate-900 border-slate-700';
  }

  return (
    <div className="relative z-10 cursor-pointer group" onClick={() => setExpanded(!expanded)}>
      {/* Node Dot */}
      <div className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center -translate-x-1/2 ${ringStyle} transition-all duration-300`}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="ml-2">
        <h4 className={`font-bold text-sm ${stage.status === 'future' ? 'text-slate-500' : 'text-slate-200'}`}>
          {stage.name}
        </h4>
        {stage.date && <p className="text-xs text-slate-500 mt-0.5">{stage.date} • {stage.author}</p>}
        
        {stage.note && (
          <div className="mt-2 bg-slate-800/50 border border-slate-700 p-3 rounded-lg text-sm text-slate-300">
            {stage.note}
          </div>
        )}

        {expanded && stage.photos?.length > 0 && (
          <div className="mt-3 flex gap-2 animate-fade-in">
            {stage.photos.map((p, i) => (
              <img key={i} src={p} className="w-16 h-16 rounded object-cover border border-slate-700" alt="Proof" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  const [open, setOpen] = useState(true);
  if (!open) return <button onClick={() => setOpen(true)} className="absolute bottom-6 right-6 bg-slate-800 p-2 rounded shadow text-xs font-bold">Legend</button>;

  return (
    <div className="absolute bottom-6 right-6 bg-brand-card border border-brand-border p-4 rounded-xl shadow-2xl w-48 cursor-pointer" onClick={() => setOpen(false)}>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Complaint Density</h4>
      <div className="h-3 w-full rounded bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 mb-2"></div>
      <div className="flex justify-between text-[10px] font-bold text-slate-300">
        <span>Low (1-2)</span>
        <span>High (6+)</span>
      </div>
    </div>
  );
}

export function VoiceInputOverlay({ onClose, transcript, detectedFields }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-32 h-32 rounded-full bg-brand-orange/20 flex items-center justify-center animate-pulse-slow mb-12 relative">
        <div className="absolute inset-0 rounded-full border-4 border-brand-orange/40 animate-ping"></div>
        <Mic className="w-12 h-12 text-brand-orange" />
      </div>
      
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
        <p className="text-xl md:text-2xl text-white font-medium mb-8 min-h-[100px] leading-relaxed">
          {transcript || "Listening..."}
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          {detectedFields.map((f, i) => (
            <span key={i} className="bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-3 py-1.5 rounded-full text-sm font-bold flex gap-1">
              <span className="text-slate-300 font-normal">{f.key}:</span> {f.value}
            </span>
          ))}
        </div>

        <div className="flex gap-4 w-full">
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Square className="w-4 h-4" /> Stop
          </button>
          <button className="flex-1 bg-brand-orange hover:bg-orange-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-orange-500/30 transition-all">
            Use This Report
          </button>
        </div>
      </div>
    </div>
  );
}

export function DuplicateWarningModal({ onUpvote, onSubmitAnyway, existing }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-brand-card w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-brand-border">
        <div className="bg-brand-red/10 border-b border-brand-red/20 p-4 flex items-center gap-3">
          <AlertTriangle className="text-brand-red w-6 h-6" />
          <h3 className="font-heading font-bold text-brand-red text-lg">Potential Duplicate Detected</h3>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-slate-700 -translate-x-1/2"></div>
          
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Existing Report (20m away)</h4>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
               <img src={existing.photo} className="w-full h-40 object-cover rounded-lg mb-4" alt="Existing" />
               <h5 className="font-bold text-white mb-1">{existing.title}</h5>
               <p className="text-sm text-slate-400 mb-3">{existing.date}</p>
               <div className="text-sm font-bold text-brand-orange">▲ {existing.upvotes} Upvotes</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Your Report</h4>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 h-full flex flex-col justify-center items-center text-center">
               <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                 <Mic className="text-slate-500 w-8 h-8" />
               </div>
               <p className="text-slate-300 font-medium px-4">"Are these the same issue? Upvoting the existing one resolves problems faster."</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-end gap-4">
          <button onClick={onSubmitAnyway} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors">
            Submit Anyway (May reduce credibility)
          </button>
          <button onClick={onUpvote} className="bg-brand-orange hover:bg-orange-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-orange-500/20 transition-all">
            Upvote Existing
          </button>
        </div>
      </div>
    </div>
  );
}

export function OfflineQueueIndicator({ queueCount }) {
  if (queueCount === 0) return null;
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-800 border-t border-slate-700 text-slate-300 text-sm py-2 px-4 flex items-center justify-center gap-3 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-fade-in">
      <CloudOff className="w-4 h-4 text-slate-400" />
      <span className="font-medium">Offline — <strong className="text-white">{queueCount} reports queued</strong> for auto-submission.</span>
    </div>
  );
}
