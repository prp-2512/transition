import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { FileDown, Table, Info, BookOpen } from 'lucide-react';

export default function Reports() {
  const { token, triggerAlert } = useContext(AppContext);
  const [vehiclesData, setVehiclesData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load report metrics directly
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVehiclesData(data.data.vehicles);
      }
    } catch (error) {
      triggerAlert('error', 'Error compiling analytics report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // PDF Export Trigger
  const handleExportPDF = () => {
    triggerAlert('success', 'Preparing PDF report download...');
    fetch('/api/reports/export/pdf', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('PDF generation failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transitops-fleet-report-${new Date().toISOString().substring(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => triggerAlert('error', 'Failed to generate PDF report.'));
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    triggerAlert('success', 'Preparing CSV report download...');
    fetch('/api/reports/export/csv', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('CSV generation failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transitops-fleet-report-${new Date().toISOString().substring(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => triggerAlert('error', 'Failed to generate CSV report.'));
  };

  return (
    <div>
      {/* Overview Card */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Fleet Analytics & Financial Reporting</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.6' }}>
              TransitOps computes vehicle efficiency and Return on Investment (ROI) indicators in real-time. Use the exports below to generate structured reports for executive financial reviews.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleExportPDF} disabled={loading}>
                <FileDown size={14} />
                <span>Export PDF Report</span>
              </button>
              <button className="btn btn-secondary" onClick={handleExportCSV} disabled={loading}>
                <Table size={14} />
                <span>Export CSV Sheet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROI & Math Formula Info alert */}
      <div style={{ 
        padding: '16px 20px', 
        borderRadius: 'var(--radius-sm)', 
        backgroundColor: 'var(--bg-secondary)', 
        border: '1px solid var(--border-color)', 
        marginBottom: '32px',
        fontSize: '13px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <Info size={18} className="text-accent" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <p style={{ fontWeight: '600', marginBottom: '4px' }}>How ROI and Fuel Efficiency are Calculated:</p>
          <ul style={{ paddingLeft: '16px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>
              <strong>Vehicle ROI:</strong> <code style={{ fontStyle: 'italic' }}>[Completed Trips Revenue - (Fuel Cost + Maintenance Costs)] / Acquisition Cost</code>
            </li>
            <li>
              <strong>Fuel Efficiency:</strong> Total Distance Travelled (km) divided by total Fuel Consumed (Liters).
            </li>
          </ul>
        </div>
      </div>

      {/* Screen Report Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '16px', marginBottom: '18px' }}>Active Fleet Metrics Ledger</h4>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Compiling table ledger...</p>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Region</th>
                  <th>Acquisition Cost</th>
                  <th>Total Revenue</th>
                  <th>Total Operational Cost</th>
                  <th>Fuel Efficiency</th>
                  <th>Calculated ROI</th>
                </tr>
              </thead>
              <tbody>
                {vehiclesData.map(v => (
                  <tr key={v._id}>
                    <td>
                      <div>
                        <p style={{ fontWeight: '600' }}>{v.name}</p>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v.registrationNumber} • {v.type}</span>
                      </div>
                    </td>
                    <td>{v.region}</td>
                    <td>₹{v.acquisitionCost?.toLocaleString('en-IN')}</td>
                    <td className="text-accent" style={{ fontWeight: '500' }}>+₹{v.revenue?.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: '500' }}>-₹{v.operationalCost?.toLocaleString('en-IN')}</td>
                    <td>{v.fuelEfficiency > 0 ? `${v.fuelEfficiency.toFixed(2)} km/L` : 'N/A'}</td>
                    <td style={{ 
                      fontWeight: '700', 
                      color: v.roi >= 0 ? 'var(--accent)' : 'var(--danger)' 
                    }}>
                      {v.roi !== null ? `${(v.roi * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
