import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mic, Image as ImageIcon, AlertTriangle, CheckCircle, UploadCloud } from 'lucide-react';
import L from 'leaflet';

export default function ComplaintSubmit() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  // Pinpointing coordinates & address state
  const [coords, setCoords] = useState({ lat: 23.0225, lng: 72.5714 });
  const [address, setAddress] = useState('Sarkhej - Gandhinagar Highway, Ahmedabad, Gujarat');
  const [searchQuery, setSearchQuery] = useState('');

  // Previews, modals, submission
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateUpvotes, setDuplicateUpvotes] = useState(42);
  const [hasUpvotedDuplicate, setHasUpvotedDuplicate] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');

  const submitMapRef = useRef(null);
  const submitMapInstanceRef = useRef(null);
  const submitMarkerRef = useRef(null);
  const fileInputRef = useRef(null);

  const categories = [
    { id: 'pothole', name: 'Pothole', icon: '🕳️' },
    { id: 'waterlogging', name: 'Waterlogging', icon: '🌊' },
    { id: 'broken_divider', name: 'Broken Divider', icon: '🚧' },
    { id: 'missing_manhole', name: 'Missing Manhole', icon: '⚠️' },
    { id: 'road_crack', name: 'Road Crack', icon: '⚡' },
    { id: 'illegal_digging', name: 'Illegal Digging', icon: '⛏️' },
    { id: 'faded_markings', name: 'Faded Markings', icon: '🛣️' },
    { id: 'streetlight_failure', name: 'Streetlight', icon: '💡' },
  ];

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTranscript("Listening... (Simulating Whisper API transcript: 'There is a massive pothole in the middle of the road here.')");
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Trigger duplicate warning
    setTimeout(() => {
      setDuplicateWarning(true);
    }, 1000);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Helper to update pinpoint marker, map, coordinates & geocoded address
  const updatePinpoint = (lat, lng) => {
    setCoords({ lat, lng });

    // Update marker on map if it exists
    if (submitMarkerRef.current) {
      submitMarkerRef.current.setLatLng([lat, lng]);
    }

    // Update map view if map exists
    if (submitMapInstanceRef.current) {
      submitMapInstanceRef.current.setView([lat, lng], 15);
    }

    // Mock reverse geocode based on coordinates
    const mockAddresses = [
      'Near Sarkhej - Gandhinagar Highway, Ahmedabad, Gujarat',
      'C.G. Road, opposite Municipal Market, Ahmedabad, Gujarat',
      'Subhash Bridge Underpass Road, Ahmedabad, Gujarat',
      'Drive In Road, near Gurukul Road, Ahmedabad, Gujarat'
    ];

    const idx = Math.floor(Math.abs(lat + lng) * 1000) % mockAddresses.length;
    const finalAddress = mockAddresses[idx] + ` (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setAddress(finalAddress);
  };

  // Locate Me using navigator geolocation
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updatePinpoint(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocation error, using fallback coordinates...', error);
          const randomLat = 23.01 + Math.random() * 0.03;
          const randomLng = 72.55 + Math.random() * 0.03;
          updatePinpoint(randomLat, randomLng);
        }
      );
    } else {
      const randomLat = 23.01 + Math.random() * 0.03;
      const randomLng = 72.55 + Math.random() * 0.03;
      updatePinpoint(randomLat, randomLng);
    }
  };

  // Mock search coordinates mapping
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const searchMap = {
        'maninagar': { lat: 23.0045, lng: 72.6025, addr: 'Maninagar, Ahmedabad, Gujarat' },
        'sg highway': { lat: 23.0250, lng: 72.5730, addr: 'Sarkhej - Gandhinagar Highway, Ahmedabad, Gujarat' },
        'cg road': { lat: 23.0180, lng: 72.5650, addr: 'C.G. Road, Navrangpura, Ahmedabad, Gujarat' },
        'subhash bridge': { lat: 23.0300, lng: 72.5800, addr: 'Subhash Bridge, Ahmedabad, Gujarat' },
        'vasna': { lat: 23.0150, lng: 72.5600, addr: 'Vasna, Ahmedabad, Gujarat' },
        'gurukul': { lat: 23.0280, lng: 72.5580, addr: 'Drive In Road, Gurukul, Ahmedabad, Gujarat' }
      };

      const queryLower = searchQuery.toLowerCase();
      let matched = null;
      for (let key in searchMap) {
        if (queryLower.includes(key)) {
          matched = searchMap[key];
          break;
        }
      }

      if (matched) {
        updatePinpoint(matched.lat, matched.lng);
        setAddress(matched.addr);
      } else {
        const searchLat = 23.01 + Math.random() * 0.03;
        const searchLng = 72.55 + Math.random() * 0.03;
        updatePinpoint(searchLat, searchLng);
        setAddress(`${searchQuery}, Ahmedabad, Gujarat`);
      }
    }
  };

  // Handle Submit
  const handleSubmit = () => {
    const id = 'RW-' + Math.floor(1000 + Math.random() * 9000);
    
    // Construct new complaint
    const newComplaint = {
      id: id,
      category: category === 'streetlight_failure' ? 'streetlight_failure' : category || 'pothole',
      title: (category ? category.replace('_', ' ') : 'Pothole') + ' reported by citizen',
      description: transcript || 'Pothole reported near selected location.',
      severity: severity,
      address: address,
      upvote_count: 0,
      created_at: new Date().toISOString(),
      status: 'reported',
      coords: [coords.lat, coords.lng],
      thumbnail: uploadedFiles.length > 0 ? uploadedFiles[0].url : null,
      categoryIcon: categories.find(c => c.id === category)?.icon || '🕳️'
    };

    // Save to localStorage
    const existingComplaints = JSON.parse(localStorage.getItem('roadwatch_complaints') || '[]');
    localStorage.setItem('roadwatch_complaints', JSON.stringify([...existingComplaints, newComplaint]));

    setSubmittedId(id);
    setIsSubmitted(true);
  };

  // Initialize/cleanup Leaflet map when Step 1 mounts/unmounts
  useEffect(() => {
    if (step !== 1 || !submitMapRef.current) return;

    const map = L.map(submitMapRef.current).setView([coords.lat, coords.lng], 14);
    submitMapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'pinpoint-marker',
      html: `<div class="relative flex items-center justify-center w-8 h-8">
               <div class="absolute w-8 h-8 rounded-full bg-orange-500/20 animate-ping"></div>
               <div class="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-xl animate-bounce-slow"></div>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([coords.lat, coords.lng], { icon: pinIcon }).addTo(map);
    submitMarkerRef.current = marker;

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updatePinpoint(lat, lng);
    });

    return () => {
      if (submitMapInstanceRef.current) {
        submitMapInstanceRef.current.remove();
        submitMapInstanceRef.current = null;
        submitMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Display success page after submission
  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in text-slate-100">
        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 animate-bounce-slow">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-slate-100 mb-4 font-bold">Report Submitted Successfully!</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Your report <strong className="text-white">#{submittedId}</strong> has been uploaded to the public register. Geospatial routing is assigning it to your ward engineer.
        </p>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 text-left space-y-4">
          <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-3">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Reference ID</span>
            <span className="text-white font-mono font-bold">#{submittedId}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-3">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Address</span>
            <span className="text-slate-300 font-medium truncate max-w-[240px]" title={address}>{address}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Reputation Points</span>
            <span className="text-orange-500 font-bold font-mono">+10 Points</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/map" className="btn-primary w-full py-4 text-center font-bold">
            View on Heatmap
          </Link>
          <Link to="/dashboard" className="btn-secondary w-full py-4 text-center font-bold">
            My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in relative">
      <style>{`
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2s infinite ease-in-out;
        }
        .leaflet-container {
          background-color: #020617 !important;
        }
      `}</style>

      {/* Duplicate Check Detail Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-slate-100">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center gap-3">
              <AlertTriangle className="text-red-500 w-6 h-6 animate-pulse animate-bounce-slow" />
              <h3 className="font-heading font-bold text-red-500 text-lg">Potential Duplicate Details</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">Our computer vision system has matched your location and upload with this existing report:</p>
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="h-48 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden relative border border-slate-700">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600')] bg-cover bg-center"></div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Large Deep Pothole (Category: Pothole)</h4>
                  <p className="text-xs text-slate-500 mt-1">Reported 2 hours ago • Near SG Highway, Ahmedabad</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
                  <span className="text-red-400 font-bold uppercase text-xs px-2 py-0.5 bg-red-500/10 rounded">Critical</span>
                  <span className="text-slate-300 font-semibold font-mono">▲ {duplicateUpvotes} Upvotes</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  if (!hasUpvotedDuplicate) {
                    setDuplicateUpvotes(prev => prev + 1);
                    setHasUpvotedDuplicate(true);
                  }
                }}
                disabled={hasUpvotedDuplicate}
                className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {hasUpvotedDuplicate ? 'Upvoted ✓' : 'Upvote Existing'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Report an Issue</h1>
        <p className="text-slate-400">Your report helps hold authorities accountable.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-800 -z-10 -translate-y-1/2"></div>
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= num ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500 border-2 border-slate-700'}`}>
            {step > num ? <CheckCircle className="w-5 h-5" /> : num}
          </div>
        ))}
      </div>

      <div className="glass-card p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-heading font-bold flex items-center gap-2 text-slate-100">
              <MapPin className="text-orange-500" /> Step 1: Pinpoint Location
            </h2>
            
            <div ref={submitMapRef} className="h-64 md:h-96 rounded-xl border border-slate-700 shadow-xl overflow-hidden z-0"></div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row justify-between gap-3 text-sm">
              <div>
                <span className="text-slate-500 font-bold block uppercase tracking-wider text-xs">Selected Location</span>
                <span className="text-slate-200 font-medium">{address}</span>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-slate-500 font-bold block uppercase tracking-wider text-xs">Coordinates</span>
                <span className="text-slate-300 font-mono font-medium">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleLocateMe} className="btn-secondary w-full sm:w-1/3 flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500 animate-pulse" /> Locate Me (GPS)
              </button>
              <input 
                type="text" 
                placeholder="Search address (e.g. C.G. Road)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors shadow-inner" 
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-heading font-bold flex items-center gap-2 text-slate-100">
              <AlertTriangle className="text-orange-500" /> Step 2: Issue Details
            </h2>
            
            <div>
              <label className="block text-slate-300 font-medium mb-4">Select Category</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${category === cat.id ? 'bg-orange-600/20 border-orange-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                  >
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-4">Severity</label>
              <input 
                type="range" min="1" max="4" 
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                onChange={(e) => {
                  const vals = ['minor', 'moderate', 'dangerous', 'critical'];
                  setSeverity(vals[e.target.value - 1]);
                }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">
                <span>Minor</span><span>Moderate</span><span>Dangerous</span><span className="text-red-400">Critical</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-4">Description (Voice Supported)</label>
              <div className="relative">
                <textarea 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-orange-500 text-white placeholder-slate-500"
                  placeholder="Describe the issue in detail..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                ></textarea>
                <button 
                  onClick={handleMicClick}
                  className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  <Mic className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-slate-100">
            <h2 className="text-2xl font-heading font-bold flex items-center gap-2 text-slate-100">
              <ImageIcon className="text-orange-500" /> Step 3: Media Upload
            </h2>

            {duplicateWarning && (
              <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4 flex items-start gap-4">
                <AlertTriangle className="text-orange-500 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-orange-400">Potential Duplicate Found</h4>
                  <p className="text-sm text-slate-300 mt-1 mb-3">Our AI detected a similar pothole reported 20m from here.</p>
                  <button 
                    onClick={() => setShowDuplicateModal(true)}
                    className="bg-orange-600/20 text-orange-400 text-sm font-semibold px-4 py-2 rounded hover:bg-orange-600/30 transition-colors"
                  >
                    View Existing Complaint & Upvote
                  </button>
                </div>
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              accept="image/*,video/*" 
              className="hidden" 
            />

            <div 
              className="border-2 border-dashed border-slate-600 rounded-2xl p-12 text-center hover:border-orange-500 transition-colors cursor-pointer bg-slate-900/50"
              onClick={handleUploadClick}
            >
              <UploadCloud className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-lg font-medium text-white mb-1">Drag & drop photos/videos here</p>
              <p className="text-sm text-slate-400">or click to browse (up to 5 photos, 1 video)</p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-square">
                    {file.type === 'video' ? (
                      <video src={file.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={file.url} className="w-full h-full object-cover" alt="Upload preview" />
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="absolute top-2 right-2 bg-red-600/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-md text-xs font-bold w-6 h-6 flex items-center justify-center"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-0 left-0 w-full bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 truncate font-mono">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
             <h2 className="text-2xl font-heading font-bold flex items-center gap-2 mb-6 text-slate-100">
              <CheckCircle className="text-emerald-500" /> Step 4: Review
            </h2>
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
               <div className="grid grid-cols-2 gap-y-4 text-sm">
                 <div className="text-slate-400">Location Address</div>
                 <div className="font-medium text-right text-slate-200 truncate max-w-[200px] sm:max-w-md" title={address}>{address}</div>
                 
                 <div className="text-slate-400">Coordinates</div>
                 <div className="font-mono text-xs text-right font-medium text-slate-300">{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</div>

                 <div className="text-slate-400">Category</div>
                 <div className="font-medium text-right capitalize text-slate-200">{category || 'Pothole'}</div>
                 
                 <div className="text-slate-400">Severity</div>
                 <div className="text-right">
                   <span className="bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded font-bold uppercase text-xs">{severity}</span>
                 </div>

                 <div className="text-slate-400 col-span-2 mt-4 border-t border-slate-800 pt-4">Description</div>
                 <div className="col-span-2 text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 font-medium leading-relaxed">{transcript || 'No description provided.'}</div>

                 <div className="text-slate-400 col-span-2 mt-4 border-t border-slate-800 pt-4">Uploaded Media</div>
                 <div className="col-span-2">
                   {uploadedFiles.length > 0 ? (
                     <div className="flex flex-wrap gap-2 mt-2">
                       {uploadedFiles.map((file, idx) => (
                         <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                           {file.type === 'video' ? (
                             <video src={file.url} className="w-full h-full object-cover" />
                           ) : (
                             <img src={file.url} className="w-full h-full object-cover" alt="Review thumbnail" />
                           )}
                         </div>
                       ))}
                     </div>
                   ) : (
                     <span className="text-slate-500 italic text-sm">No media files uploaded.</span>
                   )}
                 </div>
               </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between">
          <button 
            onClick={() => setStep(s => Math.max(1, s - 1))}
            className={`btn-secondary ${step === 1 ? 'invisible' : ''}`}
          >
            Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={() => setStep(s => Math.min(4, s + 1))}
              className="btn-primary"
            >
              Next Step
            </button>
          ) : (
             <button 
               onClick={handleSubmit}
               className="btn-primary flex items-center gap-2 px-10"
             >
               <CheckCircle className="w-5 h-5" /> Submit Report
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
