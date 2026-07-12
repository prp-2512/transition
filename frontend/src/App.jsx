import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  DollarSign, 
  FileText, 
  LogOut, 
  Sun, 
  Moon,
  AlertCircle,
  CheckCircle2,
  Lock,
  X,
  Shield,
  Calendar,
  Fuel
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import Drivers from './components/Drivers';
import Trips from './components/Trips';
import Maintenance from './components/Maintenance';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import SafetyPortal from './components/SafetyPortal';
import MaintenancePlanner from './components/MaintenancePlanner';
import FuelPortal from './components/FuelPortal';

export const AppContext = createContext();

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [alert, setAlert] = useState(null);
  
  // Login Modal Toggle on Landing Page
  const [showLoginModal, setShowLoginModal] = useState(false);

  // App data states
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auth Inputs
  const [email, setEmail] = useState('manager@transitops.com');
  const [password, setPassword] = useState('password123');

  // Trigger alert
  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Load backend data helper
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Vehicles
      const vRes = await fetch('/api/vehicles', { headers });
      const vData = await vRes.json();
      if (vData.success) setVehicles(vData.data);

      // Fetch Drivers
      const dRes = await fetch('/api/drivers', { headers });
      const dData = await dRes.json();
      if (dData.success) setDrivers(dData.data);

      // Fetch Trips
      const tRes = await fetch('/api/trips', { headers });
      const tData = await tRes.json();
      if (tData.success) setTrips(tData.data);

      // Fetch Maintenance
      const mRes = await fetch('/api/maintenance', { headers });
      const mData = await mRes.json();
      if (mData.success) setMaintenance(mData.data);

      // Fetch Expenses
      const eRes = await fetch('/api/expenses', { headers });
      const eData = await eRes.json();
      if (eData.success) setExpenses(eData.data);

      // Fetch Fuel
      const fRes = await fetch('/api/expenses/fuel', { headers });
      const fData = await fRes.json();
      if (fData.success) setFuelLogs(fData.data);

      // Fetch Reports Dashboard Stats
      const rRes = await fetch('/api/reports/dashboard', { headers });
      const rData = await rRes.json();
      if (rData.success) {
        setKpis(rData.data.kpis);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      triggerAlert('error', 'Failed to synchronize data with backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (token) {
      // Validate token & get profile
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.data);
          loadData();
        } else {
          // Token expired or invalid
          handleLogout();
        }
      })
      .catch(() => handleLogout());
    }
  }, [token]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        setToken(data.data.token);
        setUser({
          _id: data.data._id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role
        });
        setShowLoginModal(false);
        triggerAlert('success', `Welcome back, ${data.data.name}!`);
      } else {
        triggerAlert('error', data.error || 'Authentication failed.');
      }
    } catch (error) {
      triggerAlert('error', 'Unable to connect to auth server.');
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setVehicles([]);
    setDrivers([]);
    setTrips([]);
    setMaintenance([]);
    setExpenses([]);
    setFuelLogs([]);
    setKpis(null);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'vehicles':
        return <Vehicles />;
      case 'drivers':
        return <Drivers />;
      case 'trips':
        return <Trips />;
      case 'maintenance':
        return <Maintenance />;
      case 'service-schedules':
        return <MaintenancePlanner />;
      case 'safety':
        return <SafetyPortal />;
      case 'fuel':
        return <FuelPortal />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  // 1. If not authenticated, render Public Landing Page
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <LandingPage onSignIn={() => setShowLoginModal(true)} />

        {/* Floating/Overlay Alert on Landing Page */}
        {alert && (
          <div className={`alert-banner alert-${alert.type}`} style={{ 
            position: 'fixed', 
            top: '80px', 
            right: '20px', 
            zIndex: 110,
            boxShadow: 'var(--shadow)',
            width: '320px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {alert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{alert.message}</span>
            </div>
          </div>
        )}

        {/* Auth Sign In Modal overlay */}
        {showLoginModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '420px', padding: '36px', position: 'relative' }}>
              <button 
                onClick={() => setShowLoginModal(false)}
                style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  right: '16px', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ 
                  width: '52px', 
                  height: '52px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--primary-light)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '12px',
                  color: 'var(--primary)'
                }}>
                  <Truck size={26} />
                </div>
                <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>Console Sign In</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center' }}>
                  Access Secure TransitOps Fleet Suite
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@transitops.com"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '11px' }}
                  disabled={loading}
                >
                  <Lock size={15} />
                  {loading ? 'Authenticating...' : 'Secure Sign In'}
                </button>
              </form>

              {/* Demo users list inside the modal */}
              <div style={{ marginTop: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontSize: '11px' }}>
                <p style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Demo Users Available:</p>
                <p><strong>Fleet Manager:</strong> manager@transitops.com / password123</p>
                <p><strong>Driver:</strong> driver@transitops.com / password123</p>
                <p><strong>Safety Officer:</strong> safety@transitops.com / password123</p>
                <p><strong>Financial Analyst:</strong> finance@transitops.com / password123</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. If authenticated, render secure management Console layout
  return (
    <AppContext.Provider value={{
      user,
      token,
      vehicles,
      drivers,
      trips,
      maintenance,
      expenses,
      fuelLogs,
      kpis,
      loading,
      loadData,
      triggerAlert
    }}>
      <div className="app-container">
        {/* Navigation Sidebar */}
        <aside className="sidebar">
          <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => handleLogout()}>
            <Truck size={28} className="text-accent" />
            <span className="logo-text">TransitOps</span>
          </div>

          <nav style={{ flexGrow: 1 }}>
            <ul className="nav-links">
              <li>
                <div 
                  className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('dashboard')}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${currentPage === 'vehicles' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('vehicles')}
                >
                  <Truck size={18} />
                  <span>Vehicles</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${currentPage === 'drivers' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('drivers')}
                >
                  <Users size={18} />
                  <span>Drivers</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${currentPage === 'trips' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('trips')}
                >
                  <Map size={18} />
                  <span>Trips</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${currentPage === 'maintenance' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('maintenance')}
                >
                  <Wrench size={18} />
                  <span>Maintenance Logs</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${currentPage === 'service-schedules' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('service-schedules')}
                >
                  <Calendar size={18} />
                  <span>Service Schedules</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${currentPage === 'safety' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('safety')}
                >
                  <Shield size={18} />
                  <span>Safety Portal</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${currentPage === 'fuel' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('fuel')}
                >
                  <Fuel size={18} />
                  <span>Fuel Intelligence</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${currentPage === 'expenses' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('expenses')}
                >
                  <DollarSign size={18} />
                  <span>Expenses</span>
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${currentPage === 'reports' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('reports')}
                >
                  <FileText size={18} />
                  <span>Reports & Export</span>
                </div>
              </li>
            </ul>
          </nav>

          {/* User profile section */}
          <div style={{ 
            borderTop: '1px solid var(--border-color)', 
            paddingTop: '20px',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary-light)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: '700',
                color: 'var(--primary)',
                fontSize: '14px'
              }}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{user.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.role}</span>
              </div>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleLogout}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="main-panel">
          {/* Header Bar */}
          <header className="header-bar">
            <div>
              <h2 style={{ fontSize: '20px', textTransform: 'capitalize' }}>{currentPage}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 12px', borderRadius: '50%', width: '40px', height: '40px' }} 
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Console Port: <span className="text-accent" style={{ fontWeight: '600' }}>Secure Gateway</span>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="content-area">
            {alert && (
              <div className={`alert-banner alert-${alert.type}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {alert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{alert.message}</span>
                </div>
              </div>
            )}
            
            {loading && <div style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)', 
              marginBottom: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <span>Synchronizing ledgers...</span>
            </div>}
            
            {renderPage()}
          </div>
        </main>
      </div>
    </AppContext.Provider>
  );
}
