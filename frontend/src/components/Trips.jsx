import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Plus, Check, Play, XCircle, ChevronRight, AlertCircle, Search } from 'lucide-react';

export default function Trips() {
  const { user, token, trips, vehicles, drivers, loadData, triggerAlert } = useContext(AppContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [search, setSearch] = useState('');

  // Complete Trip inputs
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  // Create Trip inputs
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [revenue, setRevenue] = useState('');

  const isDriverOrManager = user?.role === 'Fleet Manager' || user?.role === 'Driver';

  // Available vehicles for selection (hide Retired, In Shop, On Trip)
  const availableVehicles = vehicles.filter(v => v.status === 'Available');

  // Available drivers (hide On Trip, Off Duty, Suspended, and expired licenses)
  const availableDrivers = drivers.filter(d => {
    const isAvailable = d.status === 'Available';
    const isExpired = new Date(d.licenseExpiryDate) < new Date();
    return isAvailable && !isExpired;
  });

  // Open complete modal
  const handleOpenComplete = (trip) => {
    setSelectedTrip(trip);
    setFinalOdometer(Number(trip.vehicle?.odometer || 0) + Number(trip.plannedDistance || 0));
    setFuelConsumed('');
    setFuelCost('');
    setCompleteModalOpen(true);
  };

  // Submit complete dispatch
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/trips/${selectedTrip._id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          actualOdometerEnd: Number(finalOdometer),
          fuelConsumed: Number(fuelConsumed),
          fuelCost: Number(fuelCost)
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Trip completed successfully! Vehicle status restored and fuel logs generated.');
        setCompleteModalOpen(false);
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Error complete route request.');
    }
  };

  // Submit dispatch create (Draft)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    // Find selected vehicle for local capacity check
    const selectedVeh = vehicles.find(v => v._id === vehicleId);
    if (selectedVeh && Number(cargoWeight) > selectedVeh.maxLoadCapacity) {
      triggerAlert('error', `Cargo Weight exceeds vehicle maximum capacity (${selectedVeh.maxLoadCapacity} kg).`);
      return;
    }

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          source,
          destination,
          vehicleId,
          driverId,
          cargoWeight: Number(cargoWeight),
          plannedDistance: Number(plannedDistance),
          revenue: Number(revenue)
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'New route draft created.');
        setModalOpen(false);
        // Reset fields
        setSource('');
        setDestination('');
        setVehicleId('');
        setDriverId('');
        setCargoWeight('');
        setPlannedDistance('');
        setRevenue('');
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Error posting dispatch.');
    }
  };

  // Dispatch route API trigger
  const handleDispatch = async (id) => {
    try {
      const res = await fetch(`/api/trips/${id}/dispatch`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Route dispatched! Vehicle and driver are now set to On Trip.');
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Dispatch request failed.');
    }
  };

  // Cancel route API trigger
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this route?')) return;
    try {
      const res = await fetch(`/api/trips/${id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Route cancelled successfully.');
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Cancel request failed.');
    }
  };

  // Filtered trips
  const filteredTrips = trips.filter(t => 
    t.source.toLowerCase().includes(search.toLowerCase()) ||
    t.destination.toLowerCase().includes(search.toLowerCase()) ||
    t.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.driver?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, maxWidth: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '40px' }}
              placeholder="Search trips by route, vehicle or driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {isDriverOrManager && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            <span>Create Trip</span>
          </button>
        )}
      </div>

      {/* Trips list */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Route</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Cargo Weight</th>
              <th>Planned Distance</th>
              <th>Revenue</th>
              {isDriverOrManager && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredTrips.map(trip => (
              <tr key={trip._id}>
                <td>
                  <span className={`badge badge-${trip.status.toLowerCase()}`}>
                    {trip.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '600' }}>{trip.source}</span>
                    <ChevronRight size={14} className="text-secondary" />
                    <span style={{ fontWeight: '600' }}>{trip.destination}</span>
                  </div>
                </td>
                <td>
                  {trip.vehicle ? (
                    <div>
                      <p style={{ fontWeight: '500' }}>{trip.vehicle.name}</p>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{trip.vehicle.registrationNumber}</span>
                    </div>
                  ) : <span className="text-danger">Unassigned</span>}
                </td>
                <td>
                  {trip.driver ? (
                    <div>
                      <p style={{ fontWeight: '500' }}>{trip.driver.name}</p>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Lic: {trip.driver.licenseNumber}</span>
                    </div>
                  ) : <span className="text-danger">Unassigned</span>}
                </td>
                <td>{trip.cargoWeight} kg</td>
                <td>{trip.plannedDistance} km</td>
                <td>₹{trip.revenue?.toLocaleString('en-IN')}</td>
                {isDriverOrManager && (
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {trip.status === 'Draft' && (
                        <button 
                          className="btn btn-accent" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleDispatch(trip._id)}
                        >
                          <Play size={12} />
                          <span>Dispatch</span>
                        </button>
                      )}
                      
                      {trip.status === 'Dispatched' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleOpenComplete(trip)}
                        >
                          <Check size={12} />
                          <span>Complete</span>
                        </button>
                      )}

                      {(trip.status === 'Draft' || trip.status === 'Dispatched') && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger)' }}
                          onClick={() => handleCancel(trip._id)}
                        >
                          <XCircle size={12} />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {trips.length === 0 && (
              <tr>
                <td colSpan={isDriverOrManager ? 8 : 7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No transport routes configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Trip Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Create Dispatch Route</h2>
            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Source Location</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={source} 
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="New York, NY"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Location</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Boston, MA"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Assign Available Vehicle</label>
                  <select 
                    className="form-input" 
                    value={vehicleId} 
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                  >
                    <option value="">Select vehicle...</option>
                    {availableVehicles.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.registrationNumber}) - Cap: {v.maxLoadCapacity}kg
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Active Driver</label>
                  <select 
                    className="form-input" 
                    value={driverId} 
                    onChange={(e) => setDriverId(e.target.value)}
                    required
                  >
                    <option value="">Select driver...</option>
                    {availableDrivers.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name} (Safety Score: {d.safetyScore}/100)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Cargo Weight (kg)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={cargoWeight} 
                    onChange={(e) => setCargoWeight(e.target.value)}
                    placeholder="1200"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Planned Distance (km)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={plannedDistance} 
                    onChange={(e) => setPlannedDistance(e.target.value)}
                    placeholder="350"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Planned Route Revenue (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={revenue} 
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder="25000"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Draft Route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {completeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Complete Dispatched Route</h2>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '20px', fontSize: '13px', display: 'flex', gap: '10px' }}>
              <AlertCircle size={18} />
              <div>
                <p><strong>Start Odometer:</strong> {selectedTrip?.actualOdometerStart} km</p>
                <p>Ensure the end odometer exceeds this reading.</p>
              </div>
            </div>
            <form onSubmit={handleCompleteSubmit}>
              <div className="form-group">
                <label className="form-label">Final Odometer Reading (km)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={finalOdometer} 
                  onChange={(e) => setFinalOdometer(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Fuel Consumed (Liters)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={fuelConsumed} 
                    onChange={(e) => setFuelConsumed(e.target.value)}
                    placeholder="45"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Fuel Cost (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={fuelCost} 
                    onChange={(e) => setFuelCost(e.target.value)}
                    placeholder="4410"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCompleteModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Route</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
