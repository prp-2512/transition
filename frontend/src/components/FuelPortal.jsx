import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { 
  Fuel, 
  AlertOctagon, 
  PlusCircle, 
  TrendingUp, 
  Award,
  History,
  CheckCircle,
  Truck,
  Search
} from 'lucide-react';

export default function FuelPortal() {
  const { vehicles, drivers, trips, token, triggerAlert } = useContext(AppContext);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('logs'); // logs, anomalies, rankings
  const [search, setSearch] = useState('');
  
  // Refuel Form state
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');
  const [odometer, setOdometer] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchFuelData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const logsRes = await fetch('/api/fuel/logs', { headers });
      const logsData = await logsRes.json();
      if (logsData.success) setFuelLogs(logsData.data);

      const anomRes = await fetch('/api/fuel/anomalies', { headers });
      const anomData = await anomRes.json();
      if (anomData.success) setAnomalies(anomData.data);

      const audRes = await fetch('/api/fuel/audits', { headers });
      const audData = await audRes.json();
      if (audData.success) setAuditLogs(audData.data);
    } catch (err) {
      console.error('Error fetching fuel data:', err);
    }
  };

  useEffect(() => {
    fetchFuelData();
  }, [token]);

  // Log refuel submit
  const handleSubmitRefuel = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/fuel/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          tripId: selectedTrip || undefined,
          driverId: selectedDriver || undefined,
          liters: parseFloat(liters),
          cost: parseFloat(cost),
          fuelType,
          odometer: odometer ? parseInt(odometer) : undefined,
          fuelStation,
          remarks
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('success', `Fuel refuel entry logged successfully!`);
        setShowModal(false);
        setLiters('');
        setCost('');
        setOdometer('');
        setFuelStation('');
        setRemarks('');
        setSelectedTrip('');
        setSelectedDriver('');
        fetchFuelData();
        window.location.reload();
      } else {
        triggerAlert('error', data.error || 'Failed to record refuel');
      }
    } catch (err) {
      triggerAlert('error', 'Network error logging refuel');
    }
  };

  // KPIs
  const totalLiters = fuelLogs.reduce((sum, l) => sum + (l.liters || 0), 0);
  const totalCost = fuelLogs.reduce((sum, l) => sum + (l.cost || 0), 0);
  
  // Fleet Avg efficiency (excluding retired)
  const activeVehicles = vehicles.filter(v => v.status !== 'Retired');
  const totalDistance = activeVehicles.reduce((sum, v) => sum + (v.totalDistanceTravelled || 0), 0);
  const totalFuel = activeVehicles.reduce((sum, v) => sum + (v.totalFuelConsumed || 0), 0);
  const avgEfficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(2) : 0;

  // Active Anomalies count
  const activeAnomalies = anomalies.filter(a => !a.resolved).length;

  return (
    <div className="animated-entry">
      <div className="flex-between" style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em' }}>Fuel Analytics & Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Monitor fuel efficiency rankings, refuels, and leak alerts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <PlusCircle size={16} />
          <span>Log Fuel Refill</span>
        </button>
      </div>

      {/* Fuel KPIs Grid */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            <Fuel size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Fuel Consumed</span>
            <span className="kpi-value">{totalLiters?.toLocaleString('en-IN')} Liters</span>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Fleet Avg Efficiency</span>
            <span className="kpi-value">{avgEfficiency} km / L</span>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(0, 113, 227, 0.1)', color: 'var(--primary)' }}>
            <Award size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Fuel Cost</span>
            <span className="kpi-value">₹{totalCost?.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)' }}>
            <AlertOctagon size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Active Fuel Anomalies</span>
            <span className="kpi-value" style={{ color: activeAnomalies > 0 ? 'var(--danger)' : 'inherit' }}>{activeAnomalies} Flagged</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'logs' ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setActiveTab('logs')}
        >
          <History size={16} />
          <span>Refuel Logs</span>
        </button>
        <button 
          className={`btn ${activeTab === 'anomalies' ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setActiveTab('anomalies')}
        >
          <AlertOctagon size={16} />
          <span>Fuel Anomalies</span>
        </button>
        <button 
          className={`btn ${activeTab === 'rankings' ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setActiveTab('rankings')}
        >
          <Award size={16} />
          <span>Vehicle Rankings</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', maxWidth: '400px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '40px' }}
            placeholder={
              activeTab === 'logs' ? "Search refuels by vehicle, driver or station..." :
              activeTab === 'anomalies' ? "Search anomalies by type or vehicle..." :
              "Search rankings by vehicle..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Refuel Logs View */}
      {activeTab === 'logs' && (
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Refuel Ledger</h3>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Quantity (L)</th>
                  <th>Total Cost</th>
                  <th>Price / L</th>
                  <th>Odometer</th>
                  <th>Fuel Station</th>
                  <th>Driver</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.filter(l => 
                  l.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
                  l.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
                  l.fuelStation?.toLowerCase().includes(search.toLowerCase()) ||
                  l.driver?.name?.toLowerCase().includes(search.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No matching refuel logs found</td>
                  </tr>
                ) : (
                  fuelLogs.filter(l => 
                    l.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
                    l.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
                    l.fuelStation?.toLowerCase().includes(search.toLowerCase()) ||
                    l.driver?.name?.toLowerCase().includes(search.toLowerCase())
                  ).map(l => (
                    <tr key={l._id}>
                      <td>{new Date(l.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '600' }}>
                        {l.vehicle?.name} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({l.vehicle?.registrationNumber})</span>
                      </td>
                      <td>{l.liters} L</td>
                      <td style={{ fontWeight: '500' }}>₹{l.cost?.toLocaleString('en-IN')}</td>
                      <td>₹{l.pricePerLiter?.toFixed(2)}</td>
                      <td>{l.odometer?.toLocaleString('en-IN')} km</td>
                      <td>{l.fuelStation}</td>
                      <td>{l.driver?.name || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fuel Anomalies View */}
      {activeTab === 'anomalies' && (
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>System Flagged Fuel Anomalies</h3>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date Flagged</th>
                  <th>Vehicle</th>
                  <th>Anomaly Type</th>
                  <th>Severity</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.filter(a => 
                  a.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
                  a.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
                  a.type.toLowerCase().includes(search.toLowerCase()) ||
                  a.description.toLowerCase().includes(search.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--accent)' }}>No matching anomalies found</td>
                  </tr>
                ) : (
                  anomalies.filter(a => 
                    a.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
                    a.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
                    a.type.toLowerCase().includes(search.toLowerCase()) ||
                    a.description.toLowerCase().includes(search.toLowerCase())
                  ).map(anom => (
                    <tr key={anom._id}>
                      <td>{new Date(anom.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '600' }}>
                        {anom.vehicle?.name} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({anom.vehicle?.registrationNumber})</span>
                      </td>
                      <td>
                        <span className="badge badge-retired" style={{ 
                          backgroundColor: anom.severity === 'High' ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 149, 0, 0.12)', 
                          color: anom.severity === 'High' ? 'var(--danger)' : 'var(--warning)' 
                        }}>
                          {anom.type}
                        </span>
                      </td>
                      <td>{anom.severity}</td>
                      <td>{anom.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle Rankings View */}
      {activeTab === 'rankings' && (
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Vehicle Fuel Efficiency Rankings</h3>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Vehicle</th>
                  <th>Total Distance</th>
                  <th>Fuel Consumed</th>
                  <th>Avg Efficiency</th>
                  <th>Cost per KM</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {vehicles
                  .filter(v => 
                    v.status !== 'Retired' && 
                    v.totalFuelConsumed > 0 &&
                    (v.name.toLowerCase().includes(search.toLowerCase()) || v.registrationNumber.toLowerCase().includes(search.toLowerCase()))
                  )
                  .sort((a, b) => b.averageFuelEfficiency - a.averageFuelEfficiency)
                  .map((v, idx) => (
                    <tr key={v._id}>
                      <td style={{ fontWeight: '700' }}>#{idx + 1}</td>
                      <td style={{ fontWeight: '600' }}>{v.name} ({v.registrationNumber})</td>
                      <td>{v.totalDistanceTravelled?.toLocaleString('en-IN')} km</td>
                      <td>{v.totalFuelConsumed?.toLocaleString('en-IN')} L</td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                        {v.averageFuelEfficiency?.toFixed(2)} km/L
                      </td>
                      <td>₹{v.fuelCostPerKM?.toFixed(2)} / km</td>
                      <td>
                        <span className={`badge`} style={{
                          backgroundColor: v.fuelEfficiencyRating === 'Excellent' || v.fuelEfficiencyRating === 'Good' ? 'rgba(48, 209, 88, 0.12)' : v.fuelEfficiencyRating === 'Average' ? 'rgba(0, 113, 227, 0.12)' : 'rgba(255, 69, 58, 0.12)',
                          color: v.fuelEfficiencyRating === 'Excellent' || v.fuelEfficiencyRating === 'Good' ? 'var(--accent)' : v.fuelEfficiencyRating === 'Average' ? 'var(--primary)' : 'var(--danger)'
                        }}>
                          {v.fuelEfficiencyRating}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Refuel Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', fontWeight: '700' }}>Log Fuel Refill</h2>
            <form onSubmit={handleSubmitRefuel}>
              
              <div className="form-group">
                <label className="form-label">Select Vehicle</label>
                <select 
                  className="form-input"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  required
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Fuel Quantity (Liters)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    placeholder="45"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Cost (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="4410"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Current Odometer (KM)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="e.g. 15400"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select 
                    className="form-input"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fuel Station / Location</label>
                <input 
                  type="text"
                  className="form-input"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  placeholder="e.g. Indian Oil Pump, Pune Bypass"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Link to Driver (Optional)</label>
                <select 
                  className="form-input"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  <option value="">-- Associate Driver --</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Link to Trip (Optional)</label>
                <select 
                  className="form-input"
                  value={selectedTrip}
                  onChange={(e) => setSelectedTrip(e.target.value)}
                >
                  <option value="">-- Associate Trip --</option>
                  {trips.filter(t => t.status === 'Completed').map(t => (
                    <option key={t._id} value={t._id}>{t.source} to {t.destination} ({t.cargoWeight} kg)</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input 
                  type="text"
                  className="form-input"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Refuel after expressway run"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Refill
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
