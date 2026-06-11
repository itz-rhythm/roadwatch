import { useState, useEffect } from 'react';
import { AlertCircle, X, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmergencyAlert() {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss logic mock
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 30000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600/90 backdrop-blur border-b border-red-500 text-white shadow-2xl shadow-red-900/50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse-slow shrink-0" />
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm sm:text-base">
            <span className="font-bold">CRITICAL:</span> Large Pothole reported on SG Highway near Maninagar (2 mins ago)
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/map" className="bg-white text-red-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-red-50 transition-colors">
            <MapPin className="w-4 h-4" /> View Map
          </Link>
          <button onClick={() => setVisible(false)} className="text-white hover:text-red-200">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
