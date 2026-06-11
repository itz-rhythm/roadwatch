import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, Navigate, useLocation } from 'react-router-dom';
import { MapPin, Menu, Mic, X, LogIn, LogOut, User, ChevronDown } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import EmergencyAlert from './components/EmergencyAlert';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ComplaintSubmit from './pages/ComplaintSubmit';
import ComplaintTrack from './pages/ComplaintTrack';
import MapHeatmap from './pages/MapHeatmap';
import RoadTransparency from './pages/RoadTransparency';
import ContractorAccountability from './pages/ContractorAccountability';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import AdminPanel from './pages/AdminPanel';
import RtiGenerator from './pages/RtiGenerator';

// ── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-600/20 group-hover:shadow-orange-500/40 transition-all">
              <MapPin className="text-white w-7 h-7" />
            </div>
            <span className="text-2xl font-heading font-extrabold tracking-tight">
              Road<span className="text-orange-500">Watch</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLink to="/map">Map &amp; Heatmap</NavLink>
            <NavLink to="/roads">Road Transparency</NavLink>
            <NavLink to="/contractors">Contractors</NavLink>
            <NavLink to="/rti">RTI Generator</NavLink>
            {user && (user.role === 'authority' || user.role === 'admin') && (
              <NavLink to={user.role === 'admin' ? '/admin' : '/authority'}>
                {user.role === 'admin' ? 'Admin' : 'Authority Panel'}
              </NavLink>
            )}
            {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          </div>

          {/* Right side: Auth + CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/report" className="btn-primary text-sm py-2 px-5">
              Report Issue
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-xl transition-all text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-slate-200 font-medium max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user.email || user.phone}</p>
                      <p className="text-xs text-orange-400 capitalize mt-0.5">{user.role}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" /> My Dashboard
                    </Link>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold text-slate-200 transition-all"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-slate-300 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-1 animate-fade-in">
          <MobileNavLink to="/map" onClick={() => setMobileOpen(false)}>Map &amp; Heatmap</MobileNavLink>
          <MobileNavLink to="/roads" onClick={() => setMobileOpen(false)}>Road Transparency</MobileNavLink>
          <MobileNavLink to="/contractors" onClick={() => setMobileOpen(false)}>Contractors</MobileNavLink>
          <MobileNavLink to="/rti" onClick={() => setMobileOpen(false)}>RTI Generator</MobileNavLink>
          {user && <MobileNavLink to="/dashboard" onClick={() => setMobileOpen(false)}>My Dashboard</MobileNavLink>}
          {user && (user.role === 'authority' || user.role === 'admin') && (
            <MobileNavLink to={user.role === 'admin' ? '/admin' : '/authority'} onClick={() => setMobileOpen(false)}>
              {user.role === 'admin' ? 'Admin Panel' : 'Authority Panel'}
            </MobileNavLink>
          )}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link to="/report" className="btn-primary text-center text-sm" onClick={() => setMobileOpen(false)}>
              Report Issue
            </Link>
            {user ? (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="btn-secondary text-sm text-red-400 border-red-500/20 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <Link to="/login" className="btn-secondary text-sm text-center" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium text-sm"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium text-sm"
    >
      {children}
    </Link>
  );
}

function VoiceReporterFloat() {
  return (
    <button className="fixed bottom-6 right-6 w-16 h-16 bg-orange-600 text-white rounded-full shadow-[0_0_30px_rgba(234,88,12,0.4)] flex items-center justify-center hover:bg-orange-500 hover:scale-110 transition-all z-50 group">
      <Mic className="w-8 h-8 group-hover:animate-pulse" />
      <span className="absolute -top-10 bg-slate-800 text-xs px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Voice Report
      </span>
    </button>
  );
}

function Layout() {
  return (
    <div className="min-h-screen flex flex-col pt-12 sm:pt-0">
      <EmergencyAlert />
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="bg-slate-950 border-t border-slate-800 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center sm:text-left grid grid-cols-1 sm:grid-cols-4 gap-8 text-sm text-slate-400">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
              <MapPin className="text-orange-500 w-5 h-5" />
              <span className="text-lg font-heading font-bold text-white tracking-tight">RoadWatch</span>
            </div>
            <p>Radical transparency for public infrastructure.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold font-heading mb-2">Platform</h4>
            <Link to="/rti" className="hover:text-orange-400">RTI Generator</Link>
            <Link to="/roads" className="hover:text-orange-400">Road Transparency</Link>
            <Link to="/map" className="hover:text-orange-400">Heatmap</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold font-heading mb-2">Legal</h4>
            <Link to="#" className="hover:text-orange-400">Privacy Policy</Link>
            <Link to="#" className="hover:text-orange-400">Terms of Service</Link>
          </div>
          <div>
            <h4 className="text-white font-semibold font-heading mb-2">Language</h4>
            <select className="bg-slate-900 border border-slate-700 text-white rounded p-2 w-full sm:w-auto">
              <option>English</option>
              <option>हिन्दी (Hindi)</option>
              <option>ગુજરાતી (Gujarati)</option>
            </select>
          </div>
        </div>
      </footer>
      <VoiceReporterFloat />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login — standalone page without Layout */}
          <Route path="/login" element={<Login />} />

          {/* All other pages inside Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/report" element={<ComplaintSubmit />} />
            <Route path="/track/:id" element={<ComplaintTrack />} />
            <Route path="/map" element={<MapHeatmap />} />
            <Route path="/roads" element={<RoadTransparency />} />
            <Route path="/contractors" element={<ContractorAccountability />} />
            <Route path="/rti" element={<RtiGenerator />} />

            {/* Auth-protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority"
              element={
                <ProtectedRoute allowedRoles={['authority', 'admin']}>
                  <AuthorityDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
