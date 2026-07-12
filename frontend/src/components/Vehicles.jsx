import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Plus, Search, FileText, Upload, Trash2, Edit } from 'lucide-react';

export default function Vehicles() {
  const { user, token, vehicles, fuelLogs, expenses, trips, loadData, triggerAlert } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  
  // Document uploads states
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState(null);

  // Form Fields
  const [regNumber, setRegNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Heavy Truck');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [region, setRegion] = useState('North');
  const [status, setStatus] = useState('Available');

  const isManager = user?.role === 'Fleet Manager';
  const isSafety = user?.role === 'Safety Officer' || user?.role === 'Fleet Manager';

  // Toggle modal for create
  const handleOpenCreate = () => {
    setEditVehicle(null);
    setRegNumber('');
    setName('');
    setType('Heavy Truck');
    setMaxCapacity('');
    setOdometer('');
    setCost('');
    setRegion('North');
    setStatus('Available');
    setModalOpen(true);
  };

  // Toggle modal for edit
  const handleOpenEdit = (v) => {
    setEditVehicle(v);
    setRegNumber(v.registrationNumber);
    setName(v.name);
    setType(v.type);
    setMaxCapacity(v.maxLoadCapacity);
    setOdometer(v.odometer);
    setCost(v.acquisitionCost);
    setRegion(v.region);
    setStatus(v.status);
    setModalOpen(true);
  };

  // Document upload modal toggle
  const handleOpenDoc = (v) => {
    setSelectedVehicle(v);
    setDocName('');
    setDocFile(null);
    setDocModalOpen(true);
  };

  // Submit vehicle create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editVehicle ? `/api/vehicles/${editVehicle._id}` : '/api/vehicles';
    const method = editVehicle ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          registrationNumber: regNumber,
          name,
          type,
          maxLoadCapacity: Number(maxCapacity),
          odometer: Number(odometer),
          acquisitionCost: Number(cost),
          region,
          status
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert('success', `Vehicle ${editVehicle ? 'updated' : 'registered'} successfully.`);
        setModalOpen(false);
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Error sending request to server.');
    }
  };

  // Submit doc upload
  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile) {
      triggerAlert('error', 'Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('document', docFile);
    formData.append('name', docName);

    try {
      const res = await fetch(`/api/vehicles/${selectedVehicle._id}/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Document uploaded successfully.');
        setDocModalOpen(false);
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'File upload request failed.');
    }
  };

  // Delete vehicle
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Vehicle deleted.');
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Delete request failed.');
    }
  };

  // Calculations helper for operational cost & ROI per vehicle
  const getVehicleFinancials = (v) => {
    // 1. Fuel cost
    const fuelCost = fuelLogs
      .filter(f => f.vehicle?._id === v._id)
      .reduce((sum, f) => sum + (f.cost || 0), 0);

    // 2. Other expenses
    const expCost = expenses
      .filter(e => e.vehicle?._id === v._id)
      .reduce((sum, e) => sum + (e.cost || 0), 0);

    const operationalCost = fuelCost + expCost;

    // 3. Revenue from completed trips
    const revenue = trips
      .filter(t => t.vehicle?._id === v._id && t.status === 'Completed')
      .reduce((sum, t) => sum + (t.revenue || 0), 0);

    // 4. ROI
    const roi = v.acquisitionCost > 0 ? (revenue - operationalCost) / v.acquisitionCost : 0;

    return {
      operationalCost,
      revenue,
      roi: roi * 100
    };
  };

  // Filtered list
  const filteredList = vehicles.filter(v => 
    v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, maxWidth: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '40px' }}
              placeholder="Search vehicles by name or plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isManager && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Grid listing */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {filteredList.map(v => {
          const financials = getVehicleFinancials(v);
          return (
            <div key={v._id} className="glass-card" style={{ padding: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <div>
                  <span className={`badge badge-${v.status.toLowerCase().replace(' ', '')}`}>
                    {v.status}
                  </span>
                  <h3 style={{ fontSize: '18px', marginTop: '8px' }}>{v.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {v.registrationNumber} • {v.type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {isSafety && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '8px', borderRadius: '50%' }}
                      onClick={() => handleOpenDoc(v)}
                      title="Upload Documents"
                    >
                      <Upload size={14} />
                    </button>
                  )}
                  {isManager && (
                    <>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '8px', borderRadius: '50%' }}
                        onClick={() => handleOpenEdit(v)}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '8px', borderRadius: '50%', color: 'var(--danger)' }}
                        onClick={() => handleDelete(v._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Vehicle parameters */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '14px 0', margin: '14px 0', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Region:</span>
                  <p style={{ fontWeight: '600' }}>{v.region}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Odometer:</span>
                  <p style={{ fontWeight: '600' }}>{v.odometer} km</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Max Payload:</span>
                  <p style={{ fontWeight: '600' }}>{v.maxLoadCapacity} kg</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Acq. Cost:</span>
                  <p style={{ fontWeight: '600' }}>₹{v.acquisitionCost.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Financial calculations */}
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Total Revenue:</span>
                  <span style={{ fontWeight: '600', color: 'var(--accent)' }}>₹{financials.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Operational Costs:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{financials.operationalCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex-between" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                  <span style={{ fontWeight: '600' }}>Vehicle ROI:</span>
                  <span style={{ fontWeight: '700', color: financials.roi >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                    {financials.roi.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Documents list */}
              {v.documents && v.documents.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>ATTACHED DOCUMENTS:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {v.documents.map(doc => (
                      <a 
                        key={doc._id} 
                        href={doc.filePath} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', textDecoration: 'none' }}
                      >
                        <FileText size={12} />
                        <span>{doc.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vehicle Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>
              {editVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Registration Plate Number (Unique)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={regNumber} 
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="TRK-9812"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Name / Model</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Volvo FH16 Semi"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select 
                    className="form-input" 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Cargo Van">Cargo Van</option>
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Operating Region</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={region} 
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Midwest"
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Max Capacity (kg)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={maxCapacity} 
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    placeholder="25000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Odometer (km)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={odometer} 
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Acquisition Cost (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={cost} 
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="3500000"
                    required
                  />
                </div>
                {editVehicle && (
                  <div className="form-group">
                    <label className="form-label">Vehicle Status</label>
                    <select 
                      className="form-input" 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="In Shop">In Shop</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {docModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Upload Vehicle Document</h2>
            <form onSubmit={handleUploadDoc}>
              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={docName} 
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Insurance Certificate / Registration License"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Select File (PDF, PNG, JPG)</label>
                <input 
                  type="file" 
                  className="form-input" 
                  onChange={(e) => setDocFile(e.target.files[0])}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setDocModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent">Upload Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
