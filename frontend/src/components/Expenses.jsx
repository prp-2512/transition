import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Plus, DollarSign, Fuel, Search } from 'lucide-react';

export default function Expenses() {
  const { user, token, expenses, fuelLogs, vehicles, loadData, triggerAlert } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('fuel');
  const [search, setSearch] = useState('');
  
  // Modals
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Fuel form fields
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  // Expense form fields
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expType, setExpType] = useState('Toll');
  const [expCost, setExpCost] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const isFinancialOrManager = user?.role === 'Financial Analyst' || user?.role === 'Fleet Manager';
  const isDriverOrAbove = user?.role === 'Driver' || user?.role === 'Fleet Manager' || user?.role === 'Financial Analyst';

  // Submit fuel log manually
  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses/fuel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: fuelVehicleId,
          liters: Number(fuelLiters),
          cost: Number(fuelCost)
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Fuel purchase logged successfully.');
        setFuelModalOpen(false);
        setFuelVehicleId('');
        setFuelLiters('');
        setFuelCost('');
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Error posting fuel log.');
    }
  };

  // Submit misc expense manually
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: expVehicleId,
          type: expType,
          cost: Number(expCost),
          description: expDesc
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerAlert('success', 'Miscellaneous expense logged successfully.');
        setExpenseModalOpen(false);
        setExpVehicleId('');
        setExpType('Toll');
        setExpCost('');
        setExpDesc('');
        loadData();
      } else {
        triggerAlert('error', data.error);
      }
    } catch (error) {
      triggerAlert('error', 'Error posting expense log.');
    }
  };

  return (
    <div>
      {/* Search Input Bar & Tabs */}
      <div className="flex-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className={`btn ${activeTab === 'fuel' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('fuel')}
            >
              <Fuel size={14} />
              <span>Fuel Logs</span>
            </button>
            <button 
              className={`btn ${activeTab === 'misc' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('misc')}
            >
              <DollarSign size={14} />
              <span>Misc Expenses</span>
            </button>
          </div>
          
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '36px', paddingTop: '6px', paddingBottom: '6px', fontSize: '13px' }}
              placeholder={activeTab === 'fuel' ? "Search fuel logs by vehicle..." : "Search expenses by vehicle, category or detail..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {activeTab === 'fuel' && isDriverOrAbove && (
            <button className="btn btn-accent" onClick={() => setFuelModalOpen(true)}>
              <Plus size={16} />
              <span>Log Fuel Purchase</span>
            </button>
          )}
          {activeTab === 'misc' && isFinancialOrManager && (
            <button className="btn btn-accent" onClick={() => setExpenseModalOpen(true)}>
              <Plus size={16} />
              <span>Log Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Fuel Logs Tab content */}
      {activeTab === 'fuel' && (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Liters</th>
                <th>Total Cost</th>
                <th>Cost / Liter</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.filter(log => 
                log.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) || 
                log.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase())
              ).map(log => (
                <tr key={log._id}>
                  <td>{new Date(log.date).toLocaleDateString()}</td>
                  <td>
                    {log.vehicle ? (
                      <div>
                        <p style={{ fontWeight: '500' }}>{log.vehicle.name}</p>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.vehicle.registrationNumber}</span>
                      </div>
                    ) : <span className="text-secondary">Unassigned</span>}
                  </td>
                  <td>{log.liters} L</td>
                  <td style={{ fontWeight: '600' }}>₹{log.cost?.toLocaleString('en-IN')}</td>
                  <td>{log.liters > 0 ? `₹${(log.cost / log.liters).toFixed(2)} / L` : '-'}</td>
                </tr>
              ))}

              {fuelLogs.filter(log => 
                log.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) || 
                log.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase())
              ).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No matching fuel purchase logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Misc Expenses Tab content */}
      {activeTab === 'misc' && (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Cost</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {expenses.filter(exp => 
                exp.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) || 
                exp.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) || 
                exp.type.toLowerCase().includes(search.toLowerCase()) || 
                exp.description.toLowerCase().includes(search.toLowerCase())
              ).map(exp => (
                <tr key={exp._id}>
                  <td>{new Date(exp.date).toLocaleDateString()}</td>
                  <td>
                    {exp.vehicle ? (
                      <div>
                        <p style={{ fontWeight: '500' }}>{exp.vehicle.name}</p>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{exp.vehicle.registrationNumber}</span>
                      </div>
                    ) : <span className="text-secondary">Unassigned</span>}
                  </td>
                  <td>
                    <span className="badge badge-draft" style={{ textTransform: 'uppercase' }}>
                      {exp.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--danger)' }}>-₹{exp.cost?.toLocaleString('en-IN')}</td>
                  <td>{exp.description}</td>
                </tr>
              ))}

              {expenses.filter(exp => 
                exp.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) || 
                exp.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) || 
                exp.type.toLowerCase().includes(search.toLowerCase()) || 
                exp.description.toLowerCase().includes(search.toLowerCase())
              ).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No matching operational expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Fuel Log Modal */}
      {fuelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Log Fuel Refill</h2>
            <form onSubmit={handleFuelSubmit}>
              <div className="form-group">
                <label className="form-label">Select Vehicle</label>
                <select 
                  className="form-input" 
                  value={fuelVehicleId} 
                  onChange={(e) => setFuelVehicleId(e.target.value)}
                  required
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Fuel (Liters)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={fuelLiters} 
                    onChange={(e) => setFuelLiters(e.target.value)}
                    placeholder="45"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost (₹)</label>
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
                <button type="button" className="btn btn-secondary" onClick={() => setFuelModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Fuel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {expenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Log Expense</h2>
            <form onSubmit={handleExpenseSubmit}>
              <div className="form-group">
                <label className="form-label">Select Vehicle</label>
                <select 
                  className="form-input" 
                  value={expVehicleId} 
                  onChange={(e) => setExpVehicleId(e.target.value)}
                  required
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Expense Category</label>
                  <select 
                    className="form-input" 
                    value={expType} 
                    onChange={(e) => setExpType(e.target.value)}
                  >
                    <option value="Toll">Toll Fee</option>
                    <option value="Maintenance">Maintenance Service</option>
                    <option value="Insurance">Insurance Charge</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cost (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={expCost} 
                    onChange={(e) => setExpCost(e.target.value)}
                    placeholder="1500"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Remarks</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={expDesc} 
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="e.g. Toll road fee for interstate route"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setExpenseModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
