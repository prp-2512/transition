import React from 'react';
import { 
  Truck, 
  Shield, 
  TrendingUp, 
  Map, 
  Layers, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Gauge
} from 'lucide-react';

export default function LandingPage({ onSignIn }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }} className="fade-in">
      
      {/* Navigation Header - Apple Frosted-glass style */}
      <header className="header-bar" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        height: '48px',
        padding: '0 40px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Truck size={20} className="text-accent" />
          <span style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>TransitOps</span>
        </div>
        <nav style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px', fontWeight: '500', transition: 'var(--transition)' }} className="nav-hover-link">Features</a>
          <a href="#specifications" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '12px', fontWeight: '500', transition: 'var(--transition)' }} className="nav-hover-link">Specifications</a>
          <button className="btn btn-primary" onClick={onSignIn} style={{ padding: '4px 12px', fontSize: '12px' }}>
            Go to Console
          </button>
        </nav>
      </header>

      {/* Hero Section - Apple.com Bold Typography & whitespace */}
      <section style={{ 
        padding: '120px 40px 100px 40px', 
        textAlign: 'center', 
        maxWidth: '960px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }} className="animated-entry">
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          backgroundColor: 'var(--primary-light)', 
          color: 'var(--primary)', 
          padding: '4px 12px', 
          borderRadius: '30px', 
          fontSize: '12px', 
          fontWeight: '500',
          marginBottom: '28px'
        }}>
          <Sparkles size={12} />
          <span>Designed for Indian Fleet Excellence</span>
        </div>

        <h1 style={{ 
          fontSize: '64px', 
          lineHeight: '1.08', 
          fontWeight: '800', 
          letterSpacing: '-0.025em', 
          marginBottom: '24px',
          color: 'var(--text-primary)',
          maxWidth: '820px'
        }}>
          Sleek Fleet Logistics. <br />
          <span style={{ 
            background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Automated ROI Intelligence.
          </span>
        </h1>

        <p style={{ 
          fontSize: '20px', 
          color: 'var(--text-secondary)', 
          maxWidth: '620px', 
          lineHeight: '1.5', 
          marginBottom: '40px',
          fontWeight: '400',
          letterSpacing: '-0.015em'
        }}>
          Register vehicles, track driver credentials, dispatch routes under strict payload rules, and record fuel logs while automatically calculating vehicle-specific returns.
        </p>

        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }} onClick={onSignIn}>
            Launch Console
          </button>
          <a href="#features" style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none', 
            fontSize: '15px', 
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>Explore features</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Grid Highlights Section */}
      <section id="features" style={{ 
        padding: '100px 40px', 
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }} className="animated-entry">
            <h2 style={{ fontSize: '40px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '16px' }}>Engineered for operations.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '580px', margin: '0 auto', letterSpacing: '-0.015em' }}>
              TransitOps simplifies transport operations with direct integrations, strict validation engines, and instant PDF/CSV reporting sheets.
            </p>
          </div>

          {/* Product Cards Grid - Looks like Apple hardware grids */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
            
            {/* Box 1 */}
            <div className="glass-card animated-entry" style={{ 
              borderRadius: '24px', 
              padding: '40px', 
              display: 'flex', 
              flexDirection: 'column', 
              height: '320px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ color: 'var(--primary)', marginBottom: '24px' }}>
                <Layers size={28} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>Central Registry</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', flexGrow: 1 }}>
                Single-source status registers for Tata trucks, Mahindra vans, and drivers. Upload documents, store insurance files, and index details securely.
              </p>
            </div>

            {/* Box 2 */}
            <div className="glass-card animated-entry" style={{ 
              borderRadius: '24px', 
              padding: '40px', 
              display: 'flex', 
              flexDirection: 'column', 
              height: '320px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ color: 'var(--accent)', marginBottom: '24px' }}>
                <Map size={28} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>Smart Route Dispatch</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', flexGrow: 1 }}>
                Ensures zero route conflicts. Automatic capacity validations block small vans from cargo overflow, while driver status controls block suspended licenses instantly.
              </p>
            </div>

            {/* Box 3 */}
            <div className="glass-card animated-entry" style={{ 
              borderRadius: '24px', 
              padding: '40px', 
              display: 'flex', 
              flexDirection: 'column', 
              height: '320px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ color: 'var(--primary)', marginBottom: '24px' }}>
                <TrendingUp size={28} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>Automatic Financial Ledger</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', flexGrow: 1 }}>
                Every single fuel log refill, toll fee expense, and finished transport route compiles automatically to yield real-time vehicle-level Return on Investment (ROI).
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Specifications / Highlights Section */}
      <section id="specifications" style={{ padding: '100px 40px', maxWidth: '1050px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '20px' }}>License Security & compliance.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', marginBottom: '28px' }}>
              We enforce strict compliance controls. The database auto-blocks driver profiles with expired commercial licensing or suspended status flags from dispatches.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '500' }}>
                <CheckCircle size={18} className="text-accent" style={{ flexShrink: 0 }} />
                <span>Daily automated email alerts for expiring commercial licenses.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '500' }}>
                <CheckCircle size={18} className="text-accent" style={{ flexShrink: 0 }} />
                <span>Encrypted documentation uploads (PDF/Images) for records.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '500' }}>
                <CheckCircle size={18} className="text-accent" style={{ flexShrink: 0 }} />
                <span>Role-Based Access Control (RBAC) protecting secure files.</span>
              </div>
            </div>
          </div>

          {/* Interactive Specification Preview Card */}
          <div className="glass-card" style={{ padding: '40px', borderRadius: '24px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', fontWeight: '600' }}>Live Verification Checks</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '16px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>Safety Officer Alerts</h5>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Warning badges dynamically flag vehicles in maintenance or expired driver licenses.</p>
              </div>
              <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '16px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>Audit Ready PDF Reporting</h5>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>PDF generation compiles fleet parameters, ROI margins, and fuel records instantaneously.</p>
              </div>
              <div style={{ borderLeft: '3px solid var(--warning)', paddingLeft: '16px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>Automatic Expense Allocation</h5>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Closing maintenance tasks automatically registers expenses and frees vehicles back to pool.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        marginTop: 'auto',
        backgroundColor: 'var(--bg-secondary)', 
        borderTop: '1px solid var(--border-color)', 
        padding: '40px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        letterSpacing: '-0.01em'
      }}>
        <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <span>© 2026 TransitOps Platform. Designed for Indian Fleet Logistics.</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span style={{ cursor: 'pointer' }} onClick={onSignIn}>Launch Console Portal</span>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Platform Features</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
