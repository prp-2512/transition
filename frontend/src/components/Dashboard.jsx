import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { 
  Truck, 
  MapPin, 
  Wrench, 
  Map, 
  Users, 
  Activity, 
  TrendingUp 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function Dashboard() {
  const { kpis, vehicles, trips, expenses, fuelLogs } = useContext(AppContext);
  const [filterType, setFilterType] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    if (filterType !== 'All' && v.type !== filterType) return false;
    if (filterRegion !== 'All' && v.region !== filterRegion) return false;
    return true;
  });

  // Calculate filtered KPIs
  const totalF = filteredVehicles.filter(v => v.status !== 'Retired').length;
  const activeF = filteredVehicles.filter(v => v.status === 'On Trip').length;
  const availableF = filteredVehicles.filter(v => v.status === 'Available').length;
  const maintenanceF = filteredVehicles.filter(v => v.status === 'In Shop').length;
  const utilizationF = totalF > 0 ? (activeF / totalF) * 100 : 0;

  // Chart data 1: Vehicle Status counts
  const statusData = [
    { name: 'Available', value: availableF, color: '#10b981' },
    { name: 'On Trip', value: activeF, color: '#4f46e5' },
    { name: 'In Shop', value: maintenanceF, color: '#f59e0b' },
  ];

  // Chart data 2: Costs per Vehicle (Top 5)
  const getVehicleCostData = () => {
    return filteredVehicles.slice(0, 5).map(v => {
      // Fuel cost sum
      const fuelCost = fuelLogs
        .filter(f => f.vehicle?._id === v._id)
        .reduce((sum, f) => sum + (f.cost || 0), 0);
      
      // Expense cost sum
      const expCost = expenses
        .filter(e => e.vehicle?._id === v._id)
        .reduce((sum, e) => sum + (e.cost || 0), 0);

      return {
        name: v.registrationNumber,
        model: v.name,
        Fuel: fuelCost,
        Maintenance: expCost,
        Total: fuelCost + expCost
      };
    });
  };

  const costData = getVehicleCostData();

  // Region options
  const regions = ['All', ...new Set(vehicles.map(v => v.region))];
  // Type options
  const types = ['All', ...new Set(vehicles.map(v => v.type))];

  return (
    <div>
      {/* Filter Header */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Fleet Quick Filters</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dynamically recalculate dashboard insights</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Type:</span>
              <select 
                className="form-input" 
                style={{ width: '130px', padding: '6px 12px' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Region:</span>
              <select 
                className="form-input" 
                style={{ width: '130px', padding: '6px 12px' }}
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Active Vehicles */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            <Truck size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Active Vehicles</span>
            <span className="kpi-value">{activeF}</span>
          </div>
        </div>

        {/* Available Vehicles */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)' }}>
            <MapPin size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Available Vehicles</span>
            <span className="kpi-value">{availableF}</span>
          </div>
        </div>

        {/* In Maintenance */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <Wrench size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">In Maintenance</span>
            <span className="kpi-value">{maintenanceF}</span>
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            <Activity size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Fleet Utilization</span>
            <span className="kpi-value">{utilizationF.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Additional Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
            <Map size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Active Dispatches</h4>
            <h2 style={{ fontSize: '28px', fontWeight: '700' }}>{kpis ? kpis.activeTrips : 0}</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Pending Drafts: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{kpis ? kpis.pendingTrips : 0}</span>
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--accent-light)', padding: '12px', borderRadius: 'var(--radius-sm)', color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Drivers On Duty</h4>
            <h2 style={{ fontSize: '28px', fontWeight: '700' }}>{kpis ? kpis.driversOnDuty : 0}</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Assigned to active routes and ready to accept dispatches
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="dashboard-grid">
        {/* Cost Analysis Bar Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} className="text-accent" />
            Top 5 Operational Cost Breakdown (₹)
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            {costData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={costData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-color)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }} 
                  />
                  <Bar dataKey="Fuel" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Maintenance" stackId="a" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No active operational cost data found.
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Fleet Status Distribution</h3>
          <div style={{ width: '100%', height: '240px', position: 'relative' }}>
            {totalF > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderColor: 'var(--border-color)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No vehicles registered.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
            {statusData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>{s.name}:</span>
                <span style={{ fontWeight: '600' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
