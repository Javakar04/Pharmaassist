import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Accounts() {
  const { user, login } = useAuth()
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState('')

  // Create User Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('JUNIOR_PHARMACIST')
  const [password, setPassword] = useState('admin123')

  useEffect(() => {
    fetchUsers()
  }, [])

  function fetchUsers() {
    setLoading(true)
    api.get('/accounts/users')
      .then((res) => {
        setUsersList(res.data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    try {
      await api.post('/accounts/users', { name, email, role, password })
      setShowAddModal(false)
      setName('')
      setEmail('')
      setNotification(`✅ Staff user "${name}" registered successfully!`)
      fetchUsers()
      setTimeout(() => setNotification(''), 4000)
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message))
    }
  }

  // Quick 1-Click Switch Operator
  async function handleSwitchOperator(targetEmail) {
    try {
      await login(targetEmail, 'admin123')
      setNotification(`🔄 Switched active operator to ${targetEmail}!`)
      setTimeout(() => setNotification(''), 3000)
    } catch (err) {
      alert('Failed to switch operator: ' + err.message)
    }
  }

  return (
    <div style={{ padding: '16px 20px', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>
            👥 Accounts & Staff User Management
          </h2>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 13 }}>
            Manage pharmacy cashier operators, switch active cashier shifts, and assign system permissions.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ padding: '8px 14px', fontSize: 13, fontWeight: 700 }}
        >
          ➕ Register New Pharmacist / Staff
        </button>
      </div>

      {notification && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {notification}
        </div>
      )}

      {/* Active Session Info Box */}
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Currently Signed In As:</span>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
            {user?.name} ({user?.email})
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
            Role: <strong>{user?.role}</strong> | Terminal Shift: <strong>SALES 1:1</strong>
          </div>
        </div>

        <span className={`role-tag ${user?.role === 'ADMIN' ? 'admin' : 'sales'}`} style={{ fontSize: 12, padding: '4px 10px' }}>
          {user?.role === 'ADMIN' ? '👑 FULL SYSTEM ACCESS' : '💼 COUNTER BILLING RESTRICTED'}
        </span>
      </div>

      {/* Operators List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontWeight: 700, fontSize: 13.5 }}>
          Registered Operators & Cashier Profiles
        </div>

        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ width: 45 }}>#</th>
              <th>Full Name</th>
              <th>Login Email</th>
              <th>Role Level</th>
              <th>Shift Assignment</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((u, idx) => {
              const isCurrent = u.email.toLowerCase() === user?.email?.toLowerCase()
              return (
                <tr key={u.id} style={{ background: isCurrent ? '#f0fdf4' : 'transparent' }}>
                  <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    {u.name} {isCurrent && <span style={{ color: '#16a34a', fontSize: 11 }}>(Active)</span>}
                  </td>
                  <td style={{ color: '#0369a1', fontWeight: 500 }}>{u.email}</td>
                  <td>
                    <span className={`role-tag ${u.role === 'ADMIN' ? 'admin' : 'sales'}`}>
                      {u.role === 'ADMIN' ? '👑 ADMIN' : u.role === 'SENIOR_PHARMACIST' ? '⭐ SENIOR PHARMACIST' : '💼 COUNTER SALES'}
                    </span>
                  </td>
                  <td style={{ color: '#475569', fontSize: 12 }}>{u.shift}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge success" style={{ fontSize: 10 }}>ACTIVE</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isCurrent ? (
                      <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>✓ Current User</span>
                    ) : (
                      <button
                        className="btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => handleSwitchOperator(u.email)}
                        title="Instantly switch active session to this operator"
                      >
                        ⚡ Switch Operator
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* CREATE OPERATOR MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16 }}>➕ Register Pharmacy Staff Operator</h3>
              <button className="btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Full Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Login Email:</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@pharmaassist.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Role Designation:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13 }}
                >
                  <option value="JUNIOR_PHARMACIST">Junior Pharmacist (Counter Billing & Sales)</option>
                  <option value="SENIOR_PHARMACIST">Senior Pharmacist (Schedule H & Approvals)</option>
                  <option value="ADMIN">Administrator (Full Store & Accounting Control)</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Default Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-success" style={{ flex: 1, padding: 10, fontWeight: 700 }}>
                  ✅ Create Operator
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
