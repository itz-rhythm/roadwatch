import { useState, useEffect, useRef } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import L from 'leaflet';

const mockRoads = [
  {
    id: 'r_mg',
    name: 'MG Road, Ward 4',
    type: 'State Highway',
    date: 'Jan 2026',
    contractor: 'L&T Construction',
    score: 8,
    budget: '₹4.2 Cr',
    center: [23.022, 72.580],
    path: [[23.015, 72.575], [23.022, 72.580], [23.030, 72.585]],
    color: '#10b981' // green
  },
  {
    id: 'r_sg',
    name: 'SG Highway',
    type: 'National Highway',
    date: 'Nov 2025',
    contractor: 'Dilip Buildcon',
    score: 4,
    budget: '₹12.5 Cr',
    center: [23.035, 72.515],
    path: [[23.020, 72.500], [23.030, 72.510], [23.040, 72.520], [23.050, 72.530]],
    color: '#ef4444' // red/orange (needs repair)
  },
  {
    id: 'r_cg',
    name: 'C.G. Road, Navrangpura',
    type: 'Urban Road',
    date: 'March 2026',
    contractor: 'J Kumar Infra',
    score: 9,
    budget: '₹2.8 Cr',
    center: [23.020, 72.565],
    path: [[23.010, 72.560], [23.020, 72.565], [23.030, 72.570]],
    color: '#10b981' // green
  },
  {
    id: 'r_vasna',
    name: 'Vasna Barrage Road',
    type: 'Major District Road',
    date: 'Oct 2025',
    contractor: 'Shady Builders Co',
    score: 3,
    budget: '₹1.5 Cr',
    center: [23.015, 72.560],
    path: [[23.008, 72.555], [23.015, 72.560], [23.022, 72.565]],
    color: '#ef4444' // red
  }
];

const cityCoordinates = {
  mumbai: [19.0760, 72.8777],
  bombay: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  newdelhi: [28.6139, 77.2090],
  ahmedabad: [23.0225, 72.5714],
  amdavad: [23.0225, 72.5714],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  pune: [18.5204, 73.8567],
  chennai: [13.0827, 80.2707],
  madras: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  calcutta: [22.5726, 88.3639],
  hyderabad: [17.3850, 78.4867],
  surat: [21.1702, 72.8311],
  jaipur: [26.9124, 75.7873],
  gandhinagar: [23.2156, 72.6369]
};

function generateRandomRoad(roadName, cityName, cityCoords) {
  // Generate random path near city center coordinates
  const randomPath = [
    [cityCoords[0] - 0.004 + Math.random() * 0.008, cityCoords[1] - 0.004 + Math.random() * 0.008],
    [cityCoords[0] - 0.001 + Math.random() * 0.002, cityCoords[1] - 0.001 + Math.random() * 0.002],
    [cityCoords[0] + 0.004 + Math.random() * 0.008, cityCoords[1] + 0.004 + Math.random() * 0.008]
  ];

  let cleanRoadName = roadName;
  // Strip city names from the query if any
  Object.keys(cityCoordinates).forEach(c => {
    cleanRoadName = cleanRoadName.replace(new RegExp(c, 'gi'), '');
  });
  cleanRoadName = cleanRoadName.replace(/in|at|near|road/gi, '').trim();
  
  // Capitalize words
  const capitalizedWord = cleanRoadName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formattedRoadName = (capitalizedWord || 'Custom') + ' Road';

  return {
    id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    name: `${formattedRoadName}, ${cityName}`,
    type: 'Urban Road',
    date: 'Just Added',
    contractor: 'Local Works Division',
    score: Math.floor(3 + Math.random() * 6), // random score 3-8
    budget: '₹' + (0.8 + Math.random() * 4).toFixed(1) + ' Cr',
    center: cityCoords,
    path: randomPath,
    color: Math.random() > 0.5 ? '#10b981' : '#f59e0b',
    formattedRoadName
  };
}

export default function RoadTransparency() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customRoads, setCustomRoads] = useState(() => {
    try {
      const stored = localStorage.getItem('roadwatch_custom_roads');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [searchErrorState, setSearchErrorState] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const highlightPolylineRef = useRef(null);

  const combinedRoads = [...mockRoads, ...customRoads];

  useEffect(() => {
    localStorage.setItem('roadwatch_custom_roads', JSON.stringify(customRoads));
  }, [customRoads]);

  const highlightRoad = (road) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old polyline
    if (highlightPolylineRef.current) {
      highlightPolylineRef.current.remove();
    }

    // Draw polyline path
    const polyline = L.polyline(road.path, {
      color: road.color,
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    polyline.bindTooltip(`<div class="bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1 rounded font-bold">${road.name} (${road.score}/10)</div>`, {
      permanent: true,
      direction: 'top',
      className: 'custom-polyline-tooltip'
    }).openTooltip();

    highlightPolylineRef.current = polyline;

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
  };

  // Initialize Map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([23.0225, 72.5714], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    // Initial highlight of SG Highway
    highlightRoad(mockRoads[1]);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        highlightPolylineRef.current = null;
      }
    };
  }, []);

  const triggerSearch = (searchVal = searchQuery) => {
    const query = searchVal.toLowerCase().trim().replace(/[.\s-]/g, '');
    if (!query) return;

    // 1. Check if query contains city keyword directly
    if (cityCoordinates[query]) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(cityCoordinates[query], 12);
        setSearchErrorState(null);
      }
      return;
    }

    // 2. Check if query matches a road in combinedRoads
    const matchedRoad = combinedRoads.find(r => {
      const cleanName = r.name.toLowerCase().replace(/[.\s-]/g, '');
      return cleanName.includes(query) || query.includes(cleanName);
    });

    if (matchedRoad) {
      highlightRoad(matchedRoad);
      setSearchErrorState(null);
      return;
    }

    // 3. Fallback: Ask user which city they want to map this road in
    setSearchErrorState({ type: 'ask_city', roadName: searchVal });
  };

  const handleCitySelected = (cityName) => {
    if (!searchErrorState) return;

    const cityKey = cityName.toLowerCase();
    const cityCoords = cityCoordinates[cityKey];
    if (!cityCoords) return;

    const newRoad = generateRandomRoad(searchErrorState.roadName, cityName, cityCoords);

    setCustomRoads(prev => [...prev, newRoad]);
    setSearchErrorState(null);
    setSearchQuery(newRoad.formattedRoadName); // Set search query to show this card as the filtered match

    // Trigger map highlight on next frame
    setTimeout(() => {
      highlightRoad(newRoad);
    }, 100);
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    // If query is small or typed, check instant highlight without panning map constantly
    const query = val.toLowerCase().trim().replace(/[.\s-]/g, '');
    if (!query) return;

    const matchedRoad = combinedRoads.find(r => {
      const cleanName = r.name.toLowerCase().replace(/[.\s-]/g, '');
      return cleanName.includes(query);
    });

    if (matchedRoad) {
      highlightRoad(matchedRoad);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
    }
  };

  const filteredRoads = combinedRoads.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.contractor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showFallbackSuggested = searchQuery.trim() !== '' && filteredRoads.length === 0;
  const displayRoads = showFallbackSuggested ? combinedRoads : filteredRoads;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in text-slate-100">
      <style>{`
        .custom-polyline-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-container {
          background-color: #020617 !important;
        }
      `}</style>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-heading font-bold mb-4 text-slate-100">Road Transparency Record</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Search any road or city to view budget, repair history, and contractor performance on the map.</p>
      </div>

      <div className="max-w-3xl mx-auto relative mb-6">
        <input 
          type="text" 
          placeholder="Search any road name (e.g. SG Highway) or city (e.g. Mumbai)..." 
          value={searchQuery}
          onChange={handleQueryChange}
          onKeyDown={handleSearchSubmit}
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-5 px-6 pl-14 text-lg focus:outline-none focus:border-orange-500 shadow-2xl text-white transition-colors"
        />
        <button 
          onClick={() => triggerSearch()}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors w-6 h-6 flex items-center justify-center cursor-pointer"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* City Ask Prompt Card */}
      {searchErrorState && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-orange-500/30 rounded-2xl p-6 mb-8 animate-fade-in text-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl shadow-orange-950/10">
          <div>
            <h4 className="font-bold text-orange-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> City Required
            </h4>
            <p className="text-sm text-slate-400 mt-1">To locate <strong className="text-white">"{searchErrorState.roadName}"</strong>, please select the city it is located in:</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {['Mumbai', 'Delhi', 'Bangalore', 'Ahmedabad'].map(city => (
              <button 
                key={city}
                onClick={() => handleCitySelected(city)}
                className="bg-slate-800 hover:bg-orange-600 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-colors border border-slate-700 cursor-pointer"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="h-96 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden mb-12 z-0"
      ></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
        <h2 className="text-2xl font-heading font-bold">
          {showFallbackSuggested ? 'Suggested Road Records' : 'Registered Road Records'}
        </h2>
        {showFallbackSuggested && (
          <span className="text-amber-500/95 text-sm font-semibold bg-amber-950/30 px-3 py-1 rounded-lg border border-amber-500/20">
            No matches found for "{searchQuery}". Select a city above to register and map it.
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {displayRoads.map(road => (
          <RoadCard 
            key={road.id} 
            road={road} 
            onClick={() => highlightRoad(road)} 
          />
        ))}
      </div>
    </div>
  );
}

function RoadCard({ road, onClick }) {
  const { name, type, date, contractor, score, budget, color } = road;
  
  return (
    <div 
      onClick={onClick}
      className="glass-card p-6 flex flex-col justify-between hover:border-slate-600 cursor-pointer transition-all hover:scale-[1.01] active:scale-100"
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold font-heading text-slate-100">{name}</h3>
          <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-xs font-semibold">{type}</span>
        </div>
        <p className="text-slate-400 mb-6">Last repaired: <span className="text-slate-200 font-medium">{date}</span></p>
      </div>
      
      <div className="flex justify-between items-end border-t border-slate-800 pt-4">
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Contractor</div>
          <div className="font-semibold text-slate-200">{contractor}</div>
          <div className="text-xs text-orange-500 font-bold mt-1">Budget: {budget}</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold font-mono" style={{ color: color }}>{score}/10</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Condition</div>
        </div>
      </div>
    </div>
  );
}
