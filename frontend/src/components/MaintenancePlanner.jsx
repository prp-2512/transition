import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { 
  Wrench, 
  Settings, 
  Calendar, 
  TrendingUp, 
  PlusCircle, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  Search
} from 'lucide-react';

export default function MaintenancePlanner() {
  const { vehicles, token, triggerAlert } = useContext(AppContext);
  const [types, setTypes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('schedules'); // schedules, types
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [maintenanceTypeId, setMaintenanceTypeId] = useState('');
  const [lastServiceOdometer, setLastServiceOdometer] = useState('');
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState('');

  // Maintenance Type Form states
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [typeCat, setTypeCat] = useState('Preventive');
  const [intervalKM, setIntervalKM] = useState('');
  const [intervalMonths, setIntervalMonths] = useState('');
  const [estDuration, setEstDuration] = useState('');
  const [estCost, setEstCost] = useState('');

  // Complete Service states
  const [actualCost, setActualCost] = useState('');
  const [currentOdom, setCurrentOdom] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');

  const fetchMaintenanceData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const typeRes = await fetch('/api/maintenance-schedules/types', { headers });
      const typeData = await typeRes.json();
      if (typeData.success) setTypes(typeData.data);

      const schRes = await fetch('/api/maintenance-schedules/schedules', { headers });
      const schData = await schRes.json();
      if (schData.success) setSchedules(schData.data);
    } catch (err) {
      console.error('Error fetching maintenance records:', err);
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, [token]);

  // Handle Schedule submission
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance-schedules/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId,
          maintenanceTypeId,
          lastServiceOdometer: lastServiceOdometer ? parseInt(lastServiceOdometer) : undefined,
          technician,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Maintenance schedule registered successfully!');
        setShowScheduleModal(false);
        setVehicleId('');
        setMaintenanceTypeId('');
        setLastServiceOdometer('');
        setTechnician('');
        setNotes('');
        fetchMaintenanceData();
        window.location.reload();
      } else {
        triggerAlert('error', data.error || 'Failed to create schedule');
      }
    } catch (err) {
      triggerAlert('error', 'Network error registering schedule');
    }
  };

  // Handle Maintenance Type submission
  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance-schedules/types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: typeName,
          description: typeDesc,
          category: typeCat,
          intervalKM: parseInt(intervalKM),
          intervalMonths: parseInt(intervalMonths),
          estimatedDuration: parseFloat(estDuration),
          estimatedCost: parseInt(estCost)
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Maintenance type cataloged successfully!');
        setShowTypeModal(false);
        setTypeName('');
        setTypeDesc('');
        setIntervalKM('');
        setIntervalMonths('');
        setEstDuration('');
        setEstCost('');
        fetchMaintenanceData();
      } else {
        triggerAlert('error', data.error || 'Failed to create maintenance type');
      }
    } catch (err) {
      triggerAlert('error', 'Network error registering type');
    }
  };

  // Handle Service Completion (Close Schedule)
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/maintenance-schedules/schedules/${selectedSchedule._id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cost: actualCost ? parseInt(actualCost) : undefined,
          odometer: currentOdom ? parseInt(currentOdom) : undefined,
          notes: completeNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Maintenance service marked completed!');
        setShowCompleteModal(false);
        setActualCost('');
        setCurrentOdom('');
        setCompleteNotes('');
        setSelectedSchedule(null);
        fetchMaintenanceData();
        window.location.reload();
      } else {
        triggerAlert('error', data.error || 'Failed to complete service');
      }
    } catch (err) {
      triggerAlert('error', 'Network error closing service');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Overdue') return 'var(--danger)';
    if (status === 'Due') return 'var(--danger)';
    if (status === 'Due Soon') return 'var(--warning)';
    if (status === 'Completed') return 'var(--accent)';
    return 'var(--text-secondary)';
  };

  return (
    <div className="animated-entry">
      <div className="flex-between" style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em' }}>Preventive Maintenance Planner</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Automated odometer checks and periodic service intervals</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowTypeModal(true)}>
            <Settings size={16} />
            <span>Create Service Type</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
            <PlusCircle size={16} />
            <span>Register Schedule</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'schedules' ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setActiveTab('schedules')}
        >
          <Calendar size={16} />
          <span>Active Schedules</span>
        </button>
        <button 
          className={`btn ${activeTab === 'types' ? 'btn-accent' : 'btn-secondary'}`}
          onClick={() => setActiveTab('types')}
        >
          <Briefcase size={16} />
          <span>Service Catalogue</span>
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', maxWidth: '400px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '40px' }}
            placeholder={activeTab === 'schedules' ? "Search schedules by vehicle or type..." : "Search catalogue by name or category..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Schedules list */}
      {activeTab === 'schedules' && (
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Vehicle Maintenance Schedules</h3>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service Type</th>
                  <th>Last Service Odometer</th>
                  <th>Next Service Odometer</th>
                  <th>Next Service Date</th>
                  <th>Status</th>
                  <th>Est. Cost</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {schedules.filter(sch => 
                  sch.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) || 
                  sch.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) || 
                  sch.maintenanceType?.name?.toLowerCase().includes(search.toLowerCase()) || 
                  sch.status?.toLowerCase().includes(search.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No matching maintenance schedules found</td>
                  </tr>
                ) : (
                  schedules.filter(sch => 
                    sch.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) || 
                    sch.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) || 
                    sch.maintenanceType?.name?.toLowerCase().includes(search.toLowerCase()) || 
                    sch.status?.toLowerCase().includes(search.toLowerCase())
                  ).map(sch => (
                    <tr key={sch._id}>
                      <td style={{ fontWeight: '600' }}>
                        {sch.vehicle?.name} <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '400' }}>({sch.vehicle?.registrationNumber})</span>
                      </td>
                      <td>{sch.maintenanceType?.name}</td>
                      <td>{sch.lastServiceOdometer?.toLocaleString('en-IN')} km</td>
                      <td style={{ fontWeight: '500' }}>{sch.nextServiceOdometer?.toLocaleString('en-IN')} km</td>
                      <td>{sch.nextServiceDate ? new Date(sch.nextServiceDate).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className={`badge`} style={{
                          backgroundColor: sch.status === 'Overdue' || sch.status === 'Due' ? 'rgba(255, 69, 58, 0.12)' : sch.status === 'Due Soon' ? 'rgba(255, 159, 10, 0.12)' : 'rgba(48, 209, 88, 0.12)',
                          color: getStatusColor(sch.status)
                        }}>
                          {sch.status}
                        </span>
                      </td>
                      <td>₹{sch.estimatedCost?.toLocaleString('en-IN')}</td>
                      <td>
                        {sch.status !== 'Completed' ? (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => {
                              setSelectedSchedule(sch);
                              setShowCompleteModal(true);
                            }}
                          >
                            Close Service
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service catalogue list */}
      {activeTab === 'types' && (
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Configured Maintenance Services</h3>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: '0px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Distance Interval</th>
                  <th>Time Interval</th>
                  <th>Est. Duration</th>
                  <th>Est. Cost</th>
                  <th>Priority</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {types.filter(t => 
                  t.name.toLowerCase().includes(search.toLowerCase()) || 
                  t.category.toLowerCase().includes(search.toLowerCase()) || 
                  t.description?.toLowerCase().includes(search.toLowerCase())
                ).map(t => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: '600' }}>{t.name}</td>
                    <td>{t.category}</td>
                    <td>{t.intervalKM?.toLocaleString('en-IN')} km</td>
                    <td>{t.intervalMonths} Months</td>
                    <td>{t.estimatedDuration} hrs</td>
                    <td>₹{t.estimatedCost?.toLocaleString('en-IN')}</td>
                    <td>
                      <span className="badge badge-inshop">
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', fontWeight: '700' }}>Register Maintenance Schedule</h2>
            <form onSubmit={handleScheduleSubmit}>
              
              <div className="form-group">
                <label className="form-label">Select Vehicle</label>
                <select 
                  className="form-input"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Service Type</label>
                <select 
                  className="form-input"
                  value={maintenanceTypeId}
                  onChange={(e) => setMaintenanceTypeId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Service Type --</option>
                  {types.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.intervalKM} KM / {t.intervalMonths} Months)</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Last Service Odometer (Optional)</label>
                <input 
                  type="number"
                  className="form-input"
                  value={lastServiceOdometer}
                  onChange={(e) => setLastServiceOdometer(e.target.value)}
                  placeholder="Defaults to vehicle's current odometer"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Technician / Shop</label>
                <input 
                  type="text"
                  className="form-input"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="e.g. Tata Motors Service Center"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Service Directives</label>
                <textarea 
                  className="form-input"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mention filters, gaskets or diagnostics details..."
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Schedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Create Maintenance Type Modal */}
      {showTypeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', fontWeight: '700' }}>Add Service Configuration</h2>
            <form onSubmit={handleTypeSubmit}>
              
              <div className="form-group">
                <label className="form-label">Service Type Name</label>
                <input 
                  type="text"
                  className="form-input"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Spark Plug Change"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-input"
                  value={typeCat}
                  onChange={(e) => setTypeCat(e.target.value)}
                >
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                  <option value="Regulatory">Regulatory</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Interval (KM)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={intervalKM}
                    onChange={(e) => setIntervalKM(e.target.value)}
                    placeholder="10000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Interval (Months)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={intervalMonths}
                    onChange={(e) => setIntervalMonths(e.target.value)}
                    placeholder="12"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Est. Duration (Hours)</label>
                  <input 
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={estDuration}
                    onChange={(e) => setEstDuration(e.target.value)}
                    placeholder="2.5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Est. Cost (₹)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={estCost}
                    onChange={(e) => setEstCost(e.target.value)}
                    placeholder="4500"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text"
                  className="form-input"
                  value={typeDesc}
                  onChange={(e) => setTypeDesc(e.target.value)}
                  placeholder="Short description of task criteria"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTypeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Service
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Close Service Modal */}
      {showCompleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', fontWeight: '700' }}>Close Maintenance Service</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Service: <strong>{selectedSchedule?.maintenanceType?.name}</strong> for vehicle <strong>{selectedSchedule?.vehicle?.registrationNumber}</strong>.
            </p>
            <form onSubmit={handleCompleteSubmit}>
              
              <div className="form-group">
                <label className="form-label">Actual Odometer Reading (KM)</label>
                <input 
                  type="number"
                  className="form-input"
                  value={currentOdom}
                  onChange={(e) => setCurrentOdom(e.target.value)}
                  placeholder={selectedSchedule?.vehicle?.odometer}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actual Invoice Cost (₹)</label>
                <input 
                  type="number"
                  className="form-input"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder={selectedSchedule?.estimatedCost}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technician Notes / Parts Replaced</label>
                <textarea 
                  className="form-input"
                  rows="3"
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Engine oil replaced, air filters cleaned..."
                  required
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedSchedule(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Complete Service
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
