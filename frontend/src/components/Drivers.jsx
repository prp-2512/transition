import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Plus, Search, Trash2, Edit, AlertTriangle } from 'lucide-react';

export default function Drivers() {
  const { user, token, drivers, loadData, triggerAlert } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('Commercial Class A');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [safetyScore, setSafetyScore] = useState(100);
  const [status, setStatus] = useState('Available');

  const isSafety = user?.role === 'Safety Officer' || user?.role === 'Fleet Manager';

  // Toggle modal for create
  const handleOpenCreate = () => {
    setEditDriver(null);
    setName('');
    setLicenseNumber('');
    setLicenseCategory('Commercial Class A');
    setLicenseExpiryDate('');
    setContactNumber('');
    setSafetyScore(100);
    setStatus('Available');
    setModalOpen(true);
  };

  // Toggle modal for edit
  const handleOpenEdit = (d) => {
    setEditDriver(d);
    setName(d.name);
    setLicenseNumber(d.licenseNumber);
    setLicenseCategory(d.licenseCategory);
    // Format date string to YYYY-MM-DD
    const expDate = d.licenseExpiryDate ? new Date(d.licenseExpiryDate).toISOString().substring(0, 10) : '';
    setLicenseExpiryDate(expDate);
    setContactNumber(d.contactNumber);
    setSafetyScore(d.safetyScore);
    setStatus(d.status);
    setModalOpen(true);
  };

  // Submit driver create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editDriver ? `/api/drivers/${editDriver._id}` : '/api/drivers';
    const method = editDriver ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          licenseNumber,
          licenseCategory,
          licenseExpiryDate,
          contactNumber,
          safetyScore: Number(safetyScore),
          status
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert('success', `Driver ${editDriver ? 'updated' : 'registered'} successfully.`);
        setModalOpen(false);
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Error sending request to server.');
    }
  };

  // Delete driver
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver profile?')) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Driver profile deleted.');
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Delete request failed.');
    }
  };

  // Helper to determine license expiry warning state
  const getLicenseWarning = (expiryDate) => {
    const today = new Date();
    const exp = new Date(expiryDate);
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { text: 'EXPIRED', class: 'text-danger', alert: true };
    } else if (diffDays <= 30) {
      return { text: `Expiring in ${diffDays} days`, class: 'text-danger', alert: true };
    }
    return { text: 'Valid', class: 'text-accent', alert: false };
  };

  // Filtered list
  const filteredList = drivers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(search.toLowerCase())
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
              placeholder="Search drivers by name or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isSafety && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        )}
      </div>

      {/* Grid listing */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {filteredList.map(d => {
          const warning = getLicenseWarning(d.licenseExpiryDate);
          return (
            <div key={d._id} className="glass-card" style={{ padding: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <div>
                  <span className={`badge badge-${d.status.toLowerCase().replace(' ', '')}`}>
                    {d.status}
                  </span>
                  <h3 style={{ fontSize: '18px', marginTop: '8px' }}>{d.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    Lic: {d.licenseNumber} ({d.licenseCategory})
                  </span>
                </div>
                {isSafety && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '8px', borderRadius: '50%' }}
                      onClick={() => handleOpenEdit(d)}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '8px', borderRadius: '50%', color: 'var(--danger)' }}
                      onClick={() => handleDelete(d._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Safety progress score indicator */}
              <div style={{ marginBottom: '16px' }}>
                <div className="flex-between" style={{ fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Safety Score:</span>
                  <span style={{ fontWeight: '700', color: d.safetyScore >= 85 ? 'var(--accent)' : d.safetyScore >= 70 ? 'var(--warning)' : 'var(--danger)' }}>
                    {d.safetyScore}/100
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${d.safetyScore}%`, 
                    height: '100%', 
                    backgroundColor: d.safetyScore >= 85 ? 'var(--accent)' : d.safetyScore >= 70 ? 'var(--warning)' : 'var(--danger)',
                    borderRadius: '3px'
                  }}></div>
                </div>
              </div>

              {/* Driver info & warning alerts */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Phone:</span>
                  <span style={{ fontWeight: '500' }}>{d.contactNumber}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-secondary)' }}>License Expiry:</span>
                  <span style={{ fontWeight: '500' }}>{new Date(d.licenseExpiryDate).toLocaleDateString()}</span>
                </div>
                {warning.alert && (
                  <div style={{ 
                    marginTop: '8px',
                    padding: '8px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'var(--danger-light)', 
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    <AlertTriangle size={14} />
                    <span>LICENSE STATUS: {warning.text}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Driver Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>
              {editDriver ? 'Edit Driver Profile' : 'Register New Driver'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Driver Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ravi Kumar"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">License Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={licenseNumber} 
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="DL-1220190034981"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">License Category</label>
                  <select 
                    className="form-input" 
                    value={licenseCategory} 
                    onChange={(e) => setLicenseCategory(e.target.value)}
                  >
                    <option value="HMV (Heavy Motor Vehicle)">HMV (Heavy Motor Vehicle)</option>
                    <option value="LMV (Light Motor Vehicle)">LMV (Light Motor Vehicle)</option>
                    <option value="Trans (Transport Category)">Trans (Transport Category)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiry Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={licenseExpiryDate} 
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={contactNumber} 
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+1-555-0199"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Safety Score (0 - 100)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={safetyScore} 
                    onChange={(e) => setSafetyScore(e.target.value)}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>
              {editDriver && (
                <div className="form-group">
                  <label className="form-label">Driver Duty Status</label>
                  <select 
                    className="form-input" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
