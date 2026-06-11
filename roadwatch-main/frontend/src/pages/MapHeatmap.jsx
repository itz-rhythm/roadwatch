import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { Layers, Sun, Moon, Satellite, MapPin, Filter } from 'lucide-react';

// ── Mock seed data (replaced by API call when backend is live) ──────────────
const SEED_DATA = [
  { id: 'p1', category: 'potholes', title: 'Severe Pothole / Road Crack', address: 'SG Highway near Maninagar, Ahmedabad', severity: 'critical', upvotes: 42, coords: [23.025, 72.573] },
  { id: 'p2', category: 'potholes', title: 'Multiple Mid-sized Potholes', address: 'C.G. Road, opp. Municipal Market', severity: 'dangerous', upvotes: 18, coords: [23.018, 72.565] },
  { id: 'p3', category: 'potholes', title: 'Crumbling Road Edge', address: 'Vastrapur Lake Road', severity: 'moderate', upvotes: 7, coords: [23.040, 72.530] },
  { id: 'w1', category: 'waterlogging', title: 'Underpass Waterlogging', address: 'Subhash Bridge subway underpass', severity: 'dangerous', upvotes: 31, coords: [23.030, 72.580] },
  { id: 'w2', category: 'waterlogging', title: 'Clogged Drainage Flood', address: 'Vasna Barrage Road near circles', severity: 'moderate', upvotes: 12, coords: [23.015, 72.560] },
  { id: 'b1', category: 'blackspots', title: 'Blind Turn Accident Blackspot', address: 'Income Tax Circle intersection', severity: 'critical', upvotes: 56, coords: [23.035, 72.568] },
  { id: 'b2', category: 'blackspots', title: 'Unmarked Speed Breaker Hazard', address: 'Maninagar Railway Crossing', severity: 'critical', upvotes: 34, coords: [23.010, 72.575] },
  { id: 'b3', category: 'blackspots', title: 'No Street Lighting at Night', address: 'Sarkhej-Gandhinagar Hwy, KH0 junction', severity: 'dangerous', upvotes: 22, coords: [23.008, 72.555] },
  { id: 'r1', category: 'repairs', title: 'Ongoing Asphalt Resurfacing', address: 'Sarkhej-Gandhinagar Highway', severity: 'moderate', upvotes: 9, coords: [23.0225, 72.5714] },
  { id: 'r2', category: 'repairs', title: 'Divider Installation Work', address: 'Drive In Road near mall', severity: 'minor', upvotes: 4, coords: [23.028, 72.558] },
];

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  potholes:     { color: '#ef4444', glow: '#ef444480', emoji: '🕳️', label: 'Potholes' },
  waterlogging: { color: '#3b82f6', glow: '#3b82f680', emoji: '💧', label: 'Waterlogging' },
  blackspots:   { color: '#a855f7', glow: '#a855f780', emoji: '⚠️', label: 'Black Spots' },
  repairs:      { color: '#f97316', glow: '#f9731680', emoji: '🔧', label: 'Ongoing Repairs' },
};

const SEVERITY_ORDER = ['critical', 'dangerous', 'moderate', 'minor'];

// ── Tile layer definitions ───────────────────────────────────────────────────
const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: 'Dark',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: 'Light',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    label: 'Satellite',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: 'Street',
  },
};

// Build a rich SVG div-icon per category + severity
function buildIcon(category, severity) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.potholes;
  const size = severity === 'critical' ? 36 : severity === 'dangerous' ? 30 : 24;
  const pulse = severity === 'critical' ? `
    <div style="
      position:absolute; inset:0;
      border-radius:50%;
      background:${cfg.color};
      opacity:0.3;
      animation: rw-ping 1.4s cubic-bezier(0,0,0.2,1) infinite;
    "></div>` : '';
  return L.divIcon({
    className: 'rw-map-icon',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${pulse}
        <div style="
          position:relative;
          width:${size}px; height:${size}px;
          border-radius:50%;
          background:${cfg.color};
          border:2px solid rgba(255,255,255,0.9);
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 0 12px ${cfg.glow}, 0 2px 8px rgba(0,0,0,0.4);
          font-size:${size * 0.45}px;
          cursor:pointer;
        ">${cfg.emoji}</div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

function buildPopupHTML(item, isDark) {
  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.potholes;
  const bg = isDark ? '#0f172a' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#1e293b';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  const sev = item.severity || 'moderate';
  const sevColor = sev === 'critical' ? '#ef4444' : sev === 'dangerous' ? '#f97316' : sev === 'moderate' ? '#eab308' : '#22c55e';

  return `
    <div style="font-family:Inter,system-ui,sans-serif;background:${bg};color:${text};padding:14px;border-radius:12px;min-width:220px;max-width:280px;border:1px solid ${border};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:20px;">${cfg.emoji}</span>
        <span style="font-weight:700;font-size:13px;line-height:1.3;">${item.title}</span>
      </div>
      <p style="font-size:11px;color:${sub};margin:0 0 10px 0;line-height:1.4;">${item.address}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid ${border};">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${sevColor};background:${sevColor}18;padding:2px 8px;border-radius:999px;">${sev}</span>
        <span style="font-size:11px;color:${sub};font-weight:600;">▲ ${item.upvotes || 0} upvotes</span>
      </div>
      <div style="margin-top:8px;">
        <span style="font-size:10px;font-weight:600;color:${cfg.color};background:${cfg.color}20;padding:2px 8px;border-radius:999px;">${cfg.label}</span>
      </div>
    </div>
  `;
}

export default function MapHeatmap() {
  const [mapStyle, setMapStyle] = useState('dark');
  const [activeLayers, setActiveLayers] = useState({ potholes: true, waterlogging: true, blackspots: true, repairs: true });
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ potholes: 0, waterlogging: 0, blackspots: 0, repairs: 0, total: 0 });

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);

  const isDark = mapStyle === 'dark' || mapStyle === 'satellite';

  // Initialise map once
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([23.0225, 72.5714], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    // Initial tile layer
    const cfg = TILE_LAYERS['dark'];
    tileLayerRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 21 }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Swap tile layer when mapStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = TILE_LAYERS[mapStyle];
    tileLayerRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 21 }).addTo(map);
  }, [mapStyle]);

  // Render markers
  const renderMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const userComplaints = JSON.parse(localStorage.getItem('roadwatch_complaints') || '[]').map(item => {
      const mapping = { pothole: 'potholes', road_crack: 'potholes', waterlogging: 'waterlogging', streetlight_failure: 'blackspots', missing_manhole: 'blackspots', broken_divider: 'repairs', illegal_digging: 'repairs', faded_markings: 'repairs' };
      const cat = mapping[item.category] || 'potholes';
      return { ...item, category: cat, severity: item.severity || 'moderate', upvotes: item.upvote_count || 0 };
    });

    const allData = [...SEED_DATA, ...userComplaints];

    // Update stats
    const s = { potholes: 0, waterlogging: 0, blackspots: 0, repairs: 0, total: 0 };
    allData.forEach(i => { if (s[i.category] !== undefined) s[i.category]++; s.total++; });
    setStats(s);

    allData.forEach(item => {
      if (!activeLayers[item.category]) return;
      if (!item.coords || item.coords.length < 2) return;
      if (severityFilter !== 'all' && item.severity !== severityFilter) return;

      const icon = buildIcon(item.category, item.severity);
      const marker = L.marker(item.coords, { icon })
        .addTo(map)
        .bindPopup(buildPopupHTML(item, isDark), {
          className: 'rw-popup',
          maxWidth: 300,
        });

      markersRef.current.push(marker);
    });
  }, [activeLayers, severityFilter, isDark]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  const toggleLayer = key => setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const popupBg = isDark ? '#0f172a' : '#ffffff';
  const popupBorder = isDark ? '#334155' : '#e2e8f0';
  const popupTip = isDark ? '#0f172a' : '#ffffff';

  return (
    <div className="relative flex" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Global CSS for map */}
      <style>{`
        @keyframes rw-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .rw-map-icon { background: transparent !important; border: none !important; }
        .rw-popup .leaflet-popup-content-wrapper {
          background: ${popupBg} !important;
          color: inherit !important;
          border: 1px solid ${popupBorder} !important;
          border-radius: 14px !important;
          padding: 0 !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important;
        }
        .rw-popup .leaflet-popup-content { margin: 0 !important; }
        .rw-popup .leaflet-popup-tip { background: ${popupTip} !important; }
        .rw-popup .leaflet-popup-close-button { color: #64748b !important; top: 8px !important; right: 8px !important; font-size: 18px !important; }
        .leaflet-container { background: #020617; }
        .leaflet-control-attribution { font-size: 9px !important; background: rgba(0,0,0,0.5) !important; color: #94a3b8 !important; }
        .leaflet-control-attribution a { color: #f97316 !important; }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className={`
        flex flex-col gap-5 z-10 shrink-0 overflow-y-auto transition-all duration-300
        ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'}
        border-r backdrop-blur-xl
        ${sidebarOpen ? 'w-72 p-5' : 'w-14 p-2 items-center'}
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between">
          {sidebarOpen && (
            <h2 className={`text-lg font-heading font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <MapPin className="inline w-5 h-5 text-orange-500 mr-1 -mt-0.5" />
              Road Heatmap
            </h2>
          )}
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>

        {sidebarOpen && (
          <>
            {/* Stats strip */}
            <div className={`rounded-xl p-3 grid grid-cols-2 gap-2 ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <span style={{ color: cfg.color }} className="text-lg">{cfg.emoji}</span>
                  <div>
                    <div className="text-xs font-bold" style={{ color: cfg.color }}>{stats[key]}</div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cfg.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Style switcher */}
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Map Style</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TILE_LAYERS).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setMapStyle(key)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      mapStyle === key
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : isDark
                          ? 'border-slate-700 text-slate-400 hover:border-slate-500'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {key === 'dark' && <Moon className="w-4 h-4" />}
                    {key === 'light' && <Sun className="w-4 h-4" />}
                    {key === 'satellite' && <Satellite className="w-4 h-4" />}
                    {key === 'street' && <MapPin className="w-4 h-4" />}
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer toggles */}
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Layers</h3>
              <div className="space-y-2">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      activeLayers[key]
                        ? 'border-transparent text-white'
                        : isDark
                          ? 'border-slate-700 text-slate-400 bg-transparent hover:border-slate-600'
                          : 'border-slate-200 text-slate-500 bg-transparent hover:border-slate-400'
                    }`}
                    style={activeLayers[key] ? { background: cfg.color + '22', border: `1px solid ${cfg.color}66`, color: cfg.color } : {}}
                  >
                    <span className="text-lg">{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                    <span className="ml-auto text-xs opacity-70">{stats[key]}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${activeLayers[key] ? '' : 'opacity-30'}`} style={{ background: cfg.color }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Severity filter */}
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Filter className="w-3.5 h-3.5" /> Severity
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {['all', ...SEVERITY_ORDER].map(s => {
                  const col = s === 'critical' ? '#ef4444' : s === 'dangerous' ? '#f97316' : s === 'moderate' ? '#eab308' : s === 'minor' ? '#22c55e' : null;
                  return (
                    <button
                      key={s}
                      onClick={() => setSeverityFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all capitalize ${
                        severityFilter === s
                          ? 'text-white border-transparent'
                          : isDark ? 'border-slate-700 text-slate-400 hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                      }`}
                      style={severityFilter === s && col ? { background: col, borderColor: col } :
                             severityFilter === s ? { background: '#f97316', borderColor: '#f97316' } : {}}
                    >
                      {s === 'all' ? '● All' : s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className={`rounded-xl p-3 text-xs ${isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <div className="font-bold uppercase tracking-widest mb-2">Legend</div>
              <div className="flex flex-col gap-1">
                {[
                  { label: 'Critical', color: '#ef4444' },
                  { label: 'Dangerous', color: '#f97316' },
                  { label: 'Moderate', color: '#eab308' },
                  { label: 'Minor', color: '#22c55e' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <div ref={mapRef} className="flex-1 h-full z-0" />

      {/* Floating total badge */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/90 border border-slate-700 backdrop-blur-xl rounded-xl px-4 py-2 text-sm font-bold text-white shadow-xl">
        <MapPin className="inline w-4 h-4 text-orange-500 mr-1.5 -mt-0.5" />
        {stats.total} Active Reports
      </div>
    </div>
  );
}
