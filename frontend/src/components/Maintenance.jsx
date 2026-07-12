import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Plus, CheckSquare, Wrench } from 'lucide-react';

export default function Maintenance() {
  const { user, token, maintenance, vehicles, loadData, triggerAlert } = useContext(AppContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form Fields
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');

  // Close log fields
  const [finalCost, setFinalCost] = useState('');

  const isSafety = user?.role === 'Safety Officer' || user?.role === 'Fleet Manager';

  // Vehicles that can go to maintenance (hide Retired, and On Trip vehicles)
  const availableVehicles = vehicles.filter(v => v.status === 'Available' || v.status === 'In Shop');

  const handleOpenClose = (record) => {
    setSelectedRecord(record);
    setFinalCost(record.cost);
    setCloseModalOpen(true);
  };

  // Submit close maintenance log
  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/maintenance/${selectedRecord._id}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cost: Number(finalCost) })
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Maintenance log closed! Vehicle status restored and expense added.');
        setCloseModalOpen(false);
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Error closing maintenance log.');
    }
  };

  // Submit active maintenance log
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId,
          description,
          cost: Number(cost)
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Maintenance record created. Vehicle status is now In Shop.');
        setModalOpen(false);
        setVehicleId('');
        setDescription('');
        setCost('');
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Error posting maintenance log.');
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px' }}>Maintenance Logs & Records</h3>
        {isSafety && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            <span>Log Maintenance</span>
          </button>
        )}
      </div>

      {/* Table view */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Vehicle</th>
              <th>Description</th>
              <th>Cost</th>
              <th>Date Started</th>
              <th>Date Completed</th>
              {isSafety && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {maintenance.map(record => (
              <tr key={record._id}>
                <td>
                  <span className={`badge badge-${record.status === 'Active' ? 'inshop' : 'available'}`}>
                    {record.status}
                  </span>
                </td>
                <td>
                  {record.vehicle ? (
                    <div>
                      <p style={{ fontWeight: '500' }}>{record.vehicle.name}</p>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{record.vehicle.registrationNumber}</span>
                    </div>
                  ) : <span className="text-danger">Unassigned</span>}
                </td>
                <td>{record.description}</td>
                <td>₹{record.cost?.toLocaleString('en-IN')}</td>
                <td>{new Date(record.startDate).toLocaleDateString()}</td>
                <td>{record.endDate ? new Date(record.endDate).toLocaleDateString() : '-'}</td>
                {isSafety && (
                  <td style={{ textAlign: 'right' }}>
                    {record.status === 'Active' && (
                      <button 
                        className="btn btn-accent" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleOpenClose(record)}
                      >
                        <CheckSquare size={12} />
                        <span>Close</span>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}

            {maintenance.length === 0 && (
              <tr>
                <td colSpan={isSafety ? 7 : 6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No maintenance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Log Maintenance Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Log Vehicle Maintenance</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Select Vehicle</label>
                <select 
                  className="form-input" 
                  value={vehicleId} 
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                >
                  <option value="">Select vehicle...</option>
                  {availableVehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.registrationNumber}) - Status: {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Service Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Engine Tuneup, Oil Change, Tire Replacement"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Cost (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={cost} 
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="5000"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Start Service</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Maintenance Modal */}
      {closeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Close Maintenance Record</h2>
            <form onSubmit={handleCloseSubmit}>
              <div className="form-group">
                <label className="form-label">Final Maintenance Cost (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={finalCost} 
                  onChange={(e) => setFinalCost(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCloseModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Close Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
