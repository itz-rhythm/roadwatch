import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Map, CheckCircle, ArrowRight, Activity, MapPin } from 'lucide-react';

export default function Landing() {
  const [stats, setStats] = useState({ complaints: 0, resolved: 0, budget: 0, contractors: 0 });

  useEffect(() => {
    // Animate stats mock
    const interval = setInterval(() => {
      setStats({
        complaints: Math.floor(Math.random() * 500) + 1240,
        resolved: Math.floor(Math.random() * 300) + 850,
        budget: 450,
        contractors: 112
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Mock Map Background */}
        <div className="absolute inset-0 z-0 bg-slate-900">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-slate-950"></div>
           {/* Mock Pulsing Dots */}
           <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
           <div className="absolute top-1/2 left-2/3 w-4 h-4 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
           <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-red-600 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-heading font-extrabold mb-6 tracking-tighter">
            Road<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Watch</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Every road has a history. Every public rupee must be tracked. Hold authorities accountable with radical transparency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/report" className="btn-primary w-full sm:w-auto text-lg px-8 py-4 flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" /> Report an Issue
            </Link>
            <Link to="/roads" className="btn-secondary w-full sm:w-auto text-lg px-8 py-4 flex items-center justify-center gap-2">
              <Map className="w-5 h-5" /> View Your Road
            </Link>
            <Link to="/track/demo" className="bg-transparent border-2 border-slate-700 hover:border-slate-500 text-white font-semibold py-4 px-8 rounded-lg transition-all w-full sm:w-auto text-lg">
              Track Complaint
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Ticker */}
      <section className="border-y border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800">
            <StatBox label="Reports Today" value={stats.complaints.toLocaleString()} />
            <StatBox label="Resolved This Month" value={stats.resolved.toLocaleString()} />
            <StatBox label="Public Money Tracked" value={`₹${stats.budget} Cr`} />
            <StatBox label="Contractors Rated" value={stats.contractors} />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading font-bold mb-4">How It Works</h2>
          <p className="text-slate-400 text-lg">Four simple steps to civic accountability.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10 -translate-y-1/2"></div>
          
          <StepCard number="1" title="Report" desc="Snap a photo or use voice reporting. AI detects severity instantly." icon={<Camera className="w-8 h-8 text-orange-500" />} />
          <StepCard number="2" title="Verify" desc="Community upvotes duplicate checks ensure absolute accuracy." icon={<CheckCircle className="w-8 h-8 text-emerald-500" />} />
          <StepCard number="3" title="Assign" desc="Auto-assigned to the correct ward engineer via geospatial routing." icon={<MapPin className="w-8 h-8 text-blue-500" />} />
          <StepCard number="4" title="Resolve" desc="Track progress live. SLAs trigger automatic escalations if breached." icon={<Activity className="w-8 h-8 text-purple-500" />} />
        </div>
      </section>

      {/* Featured Transparency */}
      <section className="bg-slate-800/30 py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-heading font-bold mb-4">Featured Transparency</h2>
              <p className="text-slate-400 text-lg">Public records of recently repaired roads.</p>
            </div>
            <Link to="/roads" className="hidden sm:flex text-orange-500 hover:text-orange-400 font-semibold items-center gap-2">
              View All Data <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeaturedRoadCard name="MG Road, Ward 4" spent="4.2" contractor="L&T Construction" rating="4.8" />
            <FeaturedRoadCard name="Outer Ring Road" spent="12.5" contractor="Dilip Buildcon" rating="3.2" overspent />
            <FeaturedRoadCard name="SV Road, Andheri" spent="1.8" contractor="J Kumar Infra" rating="4.1" />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="text-center px-4">
      <div className="text-4xl font-heading font-bold text-white mb-2 tracking-tight">{value}</div>
      <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function StepCard({ number, title, desc, icon }) {
  return (
    <div className="glass-card p-8 text-center relative mt-8 md:mt-0">
      <div className="w-16 h-16 bg-slate-900 border-4 border-slate-800 rounded-full flex items-center justify-center absolute -top-8 left-1/2 -translate-x-1/2 shadow-lg">
        <span className="text-xl font-bold text-slate-300">{number}</span>
      </div>
      <div className="mt-6 mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-heading mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function FeaturedRoadCard({ name, spent, contractor, rating, overspent }) {
  return (
    <div className="glass-card p-6 hover:border-orange-500/50 transition-colors group cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-heading font-bold text-lg">{name}</h4>
        <span className="bg-slate-700 text-xs px-2 py-1 rounded font-medium text-slate-300">SH</span>
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-slate-400 mb-1">Amount Spent</div>
          <div className={`text-2xl font-bold ${overspent ? 'text-red-400' : 'text-emerald-400'}`}>₹{spent} Cr</div>
        </div>
        <div className="pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Contractor</div>
          <div className="font-medium text-slate-200">{contractor}</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="font-bold">{rating}</span>
          </div>
          <span className="text-orange-500 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Full Record <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
