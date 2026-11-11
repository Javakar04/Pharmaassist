import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('ADMIN')
  const [email, setEmail] = useState('admin@pharmaassist.local')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleRoleSwitch(role) {
    setSelectedRole(role)
    setError('')
    if (role === 'ADMIN') {
      setEmail('admin@pharmaassist.local')
      setPassword('admin123')
    } else {
      setEmail('arun@pharmaassist.local')
      setPassword('admin123')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      if (!err.response) {
        setError('⚠️ Cannot connect to backend server (http://localhost:8080). Please ensure the backend is running.')
      } else {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="enterprise-login-screen">
      {/* Left Brand Showcase Section */}
      <div className="login-brand-pane">
        <div>
          <div className="brand-badge">
            <span>🏥</span> Licensed Retail Pharmacy ERP
          </div>

          <h1 className="brand-title">THIRUMURUGAN MEDICALS</h1>
          <p className="brand-tagline">
            Enterprise Pharmacy Operations, Retail POS Fast Billing, Batch Expiry Tracking & AI Assisted Dispensing System.
          </p>

          <div className="store-lic-card">
            <span style={{ fontSize: 20 }}>📍</span>
            <div>
              <strong>Sulthanpet (Via), Sulur Taluk, Coimbatore - 641669</strong>
              <div style={{ color: '#94a3b8', fontSize: 11.5, marginTop: 2 }}>
                Drug License: <strong>TN-10-20-01376 & TN-10-21-01376</strong> | Phone: <strong>+91 9952222292</strong>
              </div>
            </div>
          </div>

          {/* 4 Feature Highlights */}
          <div className="feature-highlight-grid">
            <div className="feature-pill">
              <div className="icon">⚡</div>
              <h4>Counter POS Fast Billing</h4>
              <p>Instant medicine search by code or salt, FEFO batch allocation, and dot-matrix cash bill generation.</p>
            </div>

            <div className="feature-pill">
              <div className="icon">📦</div>
              <h4>Batch Stock & Shelf Finder</h4>
              <p>Live rack & shelf location mapper with strict quantity checks preventing overselling.</p>
            </div>

            <div className="feature-pill">
              <div className="icon">🤖</div>
              <h4>AI Vision Recognition</h4>
              <p>Upload or photograph medicine packaging for verified salts, dosage forms, and storage instructions.</p>
            </div>

            <div className="feature-pill">
              <div className="icon">📜</div>
              <h4>Sales Ledger & Quarantine</h4>
              <p>Complete GSTIN billing history, cashier audit trails, customer khata, and safe stock quarantine.</p>
            </div>
          </div>
        </div>

        {/* Live System Status Dock */}
        <div className="system-status-dock">
          <div>
            <span className="status-dot"></span>
            Terminal: <strong>POS-01 (Main Counter)</strong>
          </div>
          <div>
            <span className="status-dot"></span>
            API Engine: <strong>Online (Port 8080)</strong>
          </div>
          <div>
            <span className="status-dot"></span>
            AI Microservice: <strong>Active (Port 8000)</strong>
          </div>
        </div>
      </div>

      {/* Right Authentication Box */}
      <div className="login-auth-pane">
        <div className="enterprise-login-card">
          <div className="card-top-header">
            <h3>Pharmacy Staff Sign In</h3>
            <p>Select your authorized role to automatically load credentials, or enter your staff email.</p>
          </div>

          {/* 1-Click Role Switcher */}
          <div className="quick-role-toggle">
            <button
              type="button"
              className={`role-tab-btn ${selectedRole === 'ADMIN' ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('ADMIN')}
            >
              👑 Administrator
            </button>
            <button
              type="button"
              className={`role-tab-btn ${selectedRole === 'SALES' ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('SALES')}
            >
              💼 Sales Pharmacist
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-icon-field">
              <label>Staff Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@pharmaassist.local"
              />
            </div>

            <div className="input-icon-field">
              <label>Terminal Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontWeight: 600
                  }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 12, color: '#475569' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: 'auto' }} />
                Remember Terminal
              </label>
              <span style={{ color: '#0284c7', cursor: 'pointer' }} onClick={() => alert('Please contact pharmacy administrator for password resets.')}>
                Help & Support
              </span>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 16, lineHeight: 1.4 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="login-submit-btn">
              {loading ? 'Authenticating...' : `Sign In as ${selectedRole === 'ADMIN' ? 'Administrator' : 'Sales Pharmacist'} →`}
            </button>

            <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
              <div>🔒 Authorized Pharmacy Personnel Only. All access is audit logged.</div>
              <div style={{ marginTop: 3 }}>RETL41321 • Enterprise POS v8.1.6 • 2026 Edition</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
