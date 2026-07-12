import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { 
  Shield, 
  AlertTriangle, 
  History, 
  PlusCircle, 
  FileText,
  User,
  CheckCircle,
  XCircle,
  TrendingDown,
  Search
} from 'lucide-react';

export default function SafetyPortal() {
  const { drivers, token, triggerAlert } = useContext(AppContext);
  const [incidents, setIncidents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('drivers'); // drivers, incidents, audits
  const [filterRisk, setFilterRisk] = useState('All');
  const [search, setSearch] = useState('');
  
  // Incident Form state
  const [showModal, setShowModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [incidentType, setIncidentType] = useState('Violation');
  const [reason, setReason] = useState('');
  const [scoreImpact, setScoreImpact] = useState('');

  // Fetch Incidents and Audits on mount/tab change
  const fetchSafetyData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const incRes = await fetch('/api/safety/incidents', { headers });
      const incData = await incRes.json();
      if (incData.success) setIncidents(incData.data);

      const audRes = await fetch('/api/safety/audits', { headers });
      const audData = await audRes.json();
      if (audData.success) setAuditLogs(audData.data);
    } catch (err) {
      console.error('Error fetching safety data:', err);
    }
  };

  useEffect(() => {
    fetchSafetyData();
  }, [token]);

  // Handle Log Incident
  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/safety/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          driverId: selectedDriver,
          type: incidentType,
          reason,
          scoreImpact: scoreImpact ? parseInt(scoreImpact) : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('success', `Safety incident logged successfully for driver!`);
        setShowModal(false);
        setReason('');
        setScoreImpact('');
        fetchSafetyData();
        // Trigger page refresh in main context
        window.location.reload();
      } else {
        triggerAlert('error', data.error || 'Failed to log incident');
      }
    } catch (err) {
      triggerAlert('error', 'Network error logging incident');
    }
  };

  // Filter Drivers
  const filteredDrivers = drivers.filter(d => {
    if (filterRisk !== 'All' && d.riskLevel !== filterRisk) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.licenseNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Calculate quick safety KPIs
  const totalScoreSum = drivers.reduce((sum, d) => sum + (d.safetyScore || 100), 0);
  const avgSafetyScore = drivers.length > 0 ? (totalScoreSum / drivers.length).toFixed(1) : 100;
  const criticalCount = drivers.filter(d => d.safetyScore < 50).length;
  const warningCount = drivers.filter(d => d.safetyScore >= 50 && d.safetyScore < 80).length;
  const safeCount = drivers.filter(d => d.safetyScore >= 80).length;

  return (
    <div className="animated-entry">
      <div className="flex-between" style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em' }}>Driver Safety Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Monitor compliance ratings, accident logs, and risk profiles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <PlusCircle size={16} />
          <span>Log Safety Incident</span>
        </button>
      </div>

      {/* Safety Score KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(0, 113, 227, 0.1)', color: 'var(--primary)' }}>
            <Shield size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Average Safety Score</span>
            <span className="kpi-value">{avgSafetyScore} / 100</span>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(48, 209, 88, 0.1)', color: 'var(--accent)' }}>
            <CheckCircle size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Safe Drivers (Score &gt;= 80)</span>
            <span className="kpi-value">{safeCount}</span>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(255, 149, 0, 0.1)', color: 'var(--warning)' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Medium Risk (50-79)</span>
            <span className="kpi-value">{warningCount}</span>
          </div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)' }}>
            <XCircle size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Critical Risk (&lt; 50)</span>
            <span className="kpi-value" style={{ color: 'var(--danger)' }}>{criticalCount}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'drivers' ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setActiveTab('drivers')}
        >
          <User size={16} />
          <span>Driver Rankings</span>
        </button>
        <button 
          className={`btn ${activeTab === 'incidents' ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setActiveTab('incidents')}
        >
          <FileText size={16} />
          <span>Incident History Logs</span>
        </button>
        <button 
          className={`btn ${activeTab === 'audits' ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setActiveTab('audits')}
        >
          <History size={16} />
          <span>Safety Audit Trail</span>
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
              activeTab === 'drivers' ? "Search rankings by driver..." :
              activeTab === 'incidents' ? "Search incident details or type..." :
              "Search audit logs by driver or reason..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Driver Rankings View */}
      {activeTab === 'drivers' && (
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Active Fleet Drivers safety Ledger</h3>
            <select 
              className="form-input" 
              style={{ width: '160px', padding: '6px 12px' }}
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
            >
              <option value="All">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical Risk</option>
            </select>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>License Number</th>
                  <th>Safety Score</th>
                  <th>Grade</th>
                  <th>Risk Level</th>
                  <th>Violations</th>
                  <th>Accidents</th>
                  <th>Eligibility</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map(d => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: '600' }}>{d.name}</td>
                    <td>{d.licenseNumber}</td>
                    <td style={{ fontWeight: '700', color: d.safetyScore >= 80 ? 'var(--accent)' : d.safetyScore >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      {d.safetyScore || 100} / 100
                    </td>
                    <td>
                      <span className={`badge`} style={{
                        backgroundColor: d.safetyGrade === 'A' ? 'rgba(48, 209, 88, 0.1)' : d.safetyGrade === 'B' ? 'rgba(0, 113, 227, 0.1)' : 'rgba(255, 69, 58, 0.1)',
                        color: d.safetyGrade === 'A' ? 'var(--accent)' : d.safetyGrade === 'B' ? 'var(--primary)' : 'var(--danger)'
                      }}>
                        {d.safetyGrade || 'A'}
                      </span>
                    </td>
                    <td>{d.riskLevel || 'Low'}</td>
                    <td>{d.violationCount || 0}</td>
                    <td>{d.accidentCount || 0}</td>
                    <td>
                      {d.driverEligible ? (
                        <span className="text-accent" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span className="text-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <XCircle size={14} /> Blocked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incident History Logs View */}
      {activeTab === 'incidents' && (
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Safety Incidents & Citations</h3>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Driver</th>
                  <th>Incident Type</th>
                  <th>Vehicle Involved</th>
                  <th>Deduction</th>
                  <th>Description / Reason</th>
                </tr>
              </thead>
              <tbody>
                {incidents.filter(inc => 
                  inc.driver?.name?.toLowerCase().includes(search.toLowerCase()) || 
                  inc.type.toLowerCase().includes(search.toLowerCase()) || 
                  inc.reason?.toLowerCase().includes(search.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No matching incidents logged</td>
                  </tr>
                ) : (
                  incidents.filter(inc => 
                    inc.driver?.name?.toLowerCase().includes(search.toLowerCase()) || 
                    inc.type.toLowerCase().includes(search.toLowerCase()) || 
                    inc.reason?.toLowerCase().includes(search.toLowerCase())
                  ).map(inc => (
                    <tr key={inc._id}>
                      <td>{new Date(inc.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '500' }}>{inc.driver?.name || 'Unknown'}</td>
                      <td>
                        <span className="badge badge-retired" style={{ backgroundColor: inc.type === 'Accident' ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 149, 0, 0.12)', color: inc.type === 'Accident' ? 'var(--danger)' : 'var(--warning)' }}>
                          {inc.type}
                        </span>
                      </td>
                      <td>{inc.vehicle?.registrationNumber || '-'}</td>
                      <td style={{ fontWeight: '600', color: 'var(--danger)' }}>-{inc.scoreImpact} pts</td>
                      <td>{inc.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Audit Trail View */}
      {activeTab === 'audits' && (
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Compliance Score Audit Log</h3>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Audit Date</th>
                  <th>Driver Profile</th>
                  <th>Old Score</th>
                  <th>New Score</th>
                  <th>Trigger / Action</th>
                  <th>Deduction Description</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.filter(aud => 
                  aud.driver?.name?.toLowerCase().includes(search.toLowerCase()) || 
                  aud.triggerEvent?.toLowerCase().includes(search.toLowerCase()) || 
                  aud.reason?.toLowerCase().includes(search.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No matching audits found</td>
                  </tr>
                ) : (
                  auditLogs.filter(aud => 
                    aud.driver?.name?.toLowerCase().includes(search.toLowerCase()) || 
                    aud.triggerEvent?.toLowerCase().includes(search.toLowerCase()) || 
                    aud.reason?.toLowerCase().includes(search.toLowerCase())
                  ).map(aud => (
                    <tr key={aud._id}>
                      <td>{new Date(aud.date).toLocaleString()}</td>
                      <td style={{ fontWeight: '500' }}>{aud.driver?.name || 'Unknown'}</td>
                      <td>{aud.previousScore}</td>
                      <td style={{ fontWeight: '600', color: aud.currentScore < 50 ? 'var(--danger)' : 'var(--text-primary)' }}>{aud.currentScore}</td>
                      <td style={{ fontStyle: 'italic' }}>{aud.triggerEvent}</td>
                      <td>{aud.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Incident Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', fontWeight: '700' }}>Log Driver Safety Incident</h2>
            <form onSubmit={handleSubmitIncident}>
              
              <div className="form-group">
                <label className="form-label">Select Driver</label>
                <select 
                  className="form-input"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  required
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.licenseNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Incident Type</label>
                <select 
                  className="form-input"
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  required
                >
                  <option value="Violation">Traffic Violation (15 pts deduction)</option>
                  <option value="Accident">Accident / Collision (30 pts deduction)</option>
                  <option value="Customer Complaint">Customer Complaint (10 pts deduction)</option>
                  <option value="Overload Attempt">Cargo Overload (5 pts deduction)</option>
                  <option value="Late Completion">Late Trip (5 pts deduction)</option>
                  <option value="Cancelled Trip">Cancelled Trip (2 pts deduction)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Deduction Points Override (Optional)</label>
                <input 
                  type="number"
                  className="form-input"
                  value={scoreImpact}
                  onChange={(e) => setScoreImpact(e.target.value)}
                  placeholder="Leave blank for standard default points"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Incident Reason / Details</label>
                <textarea 
                  className="form-input"
                  rows="4"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide precise location, police reference or cargo details..."
                  required
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Incident
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
