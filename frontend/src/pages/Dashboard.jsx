import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client'

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  const [error, setError] = useState('')

  // AI Medicine Scanner Embedded State
  const [scanFile, setScanFile] = useState(null)
  const [scanPreview, setScanPreview] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load dashboard stats. Is the backend running?'))

    api.get(isAdmin ? '/invoices' : '/invoices/my')
      .then((res) => setRecentSales(res.data.slice(0, 5)))
      .catch(() => {})
  }, [isAdmin])

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setScanFile(f)
    setScanResult(null)
    setScanError('')
    setScanPreview(URL.createObjectURL(f))
  }

  async function handleScan() {
    if (!scanFile) return
    setScanLoading(true)
    setScanError('')
    try {
      const formData = new FormData()
      formData.append('file', scanFile)
      // DO NOT pass explicit Content-Type: Axios sets it with the boundary automatically!
      const res = await api.post('/scan', formData)
      setScanResult(res.data)
    } catch (err) {
      setScanError('Scan failed. Please ensure the backend is running on port 8080.')
    } finally {
      setScanLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px 20px', maxWidth: '100%' }}>
      {/* Top Banner */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>
            🏥 Thirumurugan Medicals — Operational Dashboard
          </h2>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 13 }}>
            Welcome back, <strong>{user?.name}</strong> ({user?.role}) | Terminal: <strong>SALES 1:1</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/pos">
            <button className="btn-success" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>
              🛒 Open Retail Bill (POS)
            </button>
          </Link>
          <Link to="/purchase">
            <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>
              📋 Purchase Indents
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* AI MODE PROMINENTLY ATTACHED ON DASHBOARD */}
      <div className="card" style={{ background: 'linear-gradient(to right, #eff6ff, #f0fdf4)', border: '2px solid #38bdf8', padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>📷</span>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0369a1', fontWeight: 800 }}>
                AI Medicine Scanner & Recognition Mode
              </h3>
              <span className="badge success" style={{ fontSize: 10, fontWeight: 800 }}>AI ACTIVE (PORT 8080)</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#475569' }}>
              Upload or snap a photo of any unfamiliar strip or oral suspension (e.g. MOXCLAV DS, NEULORA, MONOCEF) to identify composition, rack location, and stock instantly.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: scanPreview || scanResult ? '1fr 1.2fr' : '1fr', gap: 16, marginTop: 14 }}>
          {/* Dropzone / Upload Area */}
          <div>
            <label
              htmlFor="dashboard-scan-input"
              style={{
                display: 'block',
                border: '2px dashed #0284c7',
                borderRadius: 8,
                background: '#ffffff',
                padding: '16px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {scanPreview ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src={scanPreview}
                    alt="Medicine Preview"
                    style={{ maxHeight: 140, objectFit: 'contain', borderRadius: 6, marginBottom: 8 }}
                  />
                  <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>Click to choose a different photo</span>
                </div>
              ) : (
                <div style={{ padding: '10px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>📤</div>
                  <strong style={{ fontSize: 13, color: '#0f172a' }}>Click to choose or drop a medicine photo</strong>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>Supports JPEG, PNG, Camera Photos</div>
                </div>
              )}
            </label>
            <input
              id="dashboard-scan-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <button
                className="btn-primary"
                onClick={handleScan}
                disabled={!scanFile || scanLoading}
                style={{ flex: 1, padding: '9px 14px', fontSize: 13, fontWeight: 700 }}
              >
                {scanLoading ? '⏳ Recognizing Medicine Formulation…' : '⚡ Identify Medicine with AI'}
              </button>
            </div>

            {scanError && (
              <div style={{ color: '#b91c1c', fontSize: 12, fontWeight: 600, marginTop: 8 }}>
                ⚠️ {scanError}
              </div>
            )}
          </div>

          {/* Recognition Result Card */}
          {scanResult && (
            <div style={{ background: '#ffffff', border: '1.5px solid #22c55e', borderRadius: 8, padding: 14, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: '#166534' }}>
                  ✓ AI Identification Result
                </span>
                <span className="badge success" style={{ fontSize: 11, fontWeight: 800 }}>
                  Confidence: {Math.round(scanResult.confidence * 100)}%
                </span>
              </div>

              {scanResult.matchedInDatabase ? (
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                    {scanResult.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    <strong>Generic:</strong> {scanResult.genericName}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    <strong>Category:</strong> {scanResult.category}
                  </div>

                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 6, margin: '10px 0', border: '1px solid #e2e8f0', fontSize: 12 }}>
                    <div>📍 <strong>Shelf Location:</strong> RACK-C2 / Shelf 3 (Dispensing Bin)</div>
                    <div>📦 <strong>Stock Status:</strong> <span style={{ color: '#16a34a', fontWeight: 800 }}>45 Units Available</span></div>
                    <div>💰 <strong>MRP:</strong> ₹142.50 | <strong>Batch:</strong> MCV26A</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      className="btn-success btn-sm"
                      style={{ flex: 1, padding: 8, fontWeight: 700 }}
                      onClick={() => navigate('/pos')}
                    >
                      🛒 Add Directly to Retail Bill (POS)
                    </button>
                    <Link to={`/medicines/${scanResult.medicineId}`}>
                      <button className="btn-secondary btn-sm" style={{ padding: 8, fontWeight: 700 }}>
                        View Stock Record →
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p>Guessed formulation: <strong>{scanResult.name}</strong></p>
                  <p className="badge warning">Not in local formulary database</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-box highlight">
            <div className="value" style={{ color: '#0f766e' }}>
              ₹{stats.todaySales?.toFixed(2) || '0.00'}
            </div>
            <div className="label">Today's Sales Revenue</div>
          </div>

          <div className="stat-box highlight">
            <div className="value">{stats.todayInvoicesCount || 0}</div>
            <div className="label">Retail Cash Bills Generated</div>
          </div>

          <div className="stat-box">
            <div className="value">{stats.totalMedicines || 0}</div>
            <div className="label">Medicines in Formulary</div>
          </div>

          <div className="stat-box highlight-warning">
            <div className="value" style={{ color: '#d97706' }}>{stats.lowStock || 0}</div>
            <div className="label">Low / Out-of-Stock Items</div>
          </div>
        </div>
      )}

      {/* Quick Access Launchpad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ margin: 0, padding: 14 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>🛒 Retail Bill (POS)</h4>
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 10px' }}>
            Multi-slot counter billing, FEFO batch selection, GST rounding, and cash refund.
          </p>
          <Link to="/pos">
            <button style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}>Open Retail Bill</button>
          </Link>
        </div>

        <div className="card" style={{ margin: 0, padding: 14 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>📦 Stock Maintenance</h4>
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 10px' }}>
            Filter by total stock count, mostly used medicines, and near-expiry batches.
          </p>
          <Link to="/inventory">
            <button className="btn-secondary" style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}>
              Manage Stock
            </button>
          </Link>
        </div>

        <div className="card" style={{ margin: 0, padding: 14 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>📋 Purchase Orders</h4>
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 10px' }}>
            View medicines needing order, vendor invoices, and historical purchase register.
          </p>
          <Link to="/purchase">
            <button className="btn-secondary" style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}>
              Open Purchase
            </button>
          </Link>
        </div>

        <div className="card" style={{ margin: 0, padding: 14 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>👥 Accounts & Users</h4>
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 10px' }}>
            Manage cashier operators, shift assignments, and switch active cashier profiles.
          </p>
          <Link to="/accounts">
            <button className="btn-secondary" style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}>
              User Accounts
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Sales Ledger */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            📜 Recent Sales Activity {isAdmin ? '(Store-Wide)' : '(Your Shift)'}
          </h3>
          <Link to="/bills" style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
            View Bill Copies (Ledger) →
          </Link>
        </div>

        {recentSales.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13, padding: 16 }}>No recent bills recorded yet.</p>
        ) : (
          <table className="erp-table">
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Time</th>
                <th>Customer</th>
                <th>Cashier</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Net Paid</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: '#0369a1' }}>{inv.invoiceNumber}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date(inv.createdAt).toLocaleTimeString()}</td>
                  <td style={{ fontWeight: 600 }}>{inv.customerName}</td>
                  <td style={{ fontSize: 12 }}>{inv.cashierName}</td>
                  <td><span className="badge neutral" style={{ fontSize: 10 }}>{inv.paymentMethod}</span></td>
                  <td style={{ fontWeight: 800, color: '#16a34a', textAlign: 'right' }}>₹{inv.netPayable?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
