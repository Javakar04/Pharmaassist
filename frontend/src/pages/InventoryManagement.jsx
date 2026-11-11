import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function InventoryManagement() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const location = useLocation()

  const [inventoryList, setInventoryList] = useState([])
  const [medicines, setMedicines] = useState([])
  const [filterMode, setFilterMode] = useState('ALL') // 'ALL' | 'MOSTLY_USED' | 'EXPIRING_SOON' | 'LOW_STOCK'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState('')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // Add Form State
  const [addForm, setAddForm] = useState({
    medicineId: '',
    batchNumber: '',
    quantity: 50,
    mrp: 100,
    salePrice: 90,
    purchasePrice: 60,
    rack: 'RACK-A1',
    shelf: '1',
    expiryDate: '2027-12-31',
    status: 'AVAILABLE',
  })

  // List of high-turnover / fast-moving medicines
  const mostlyUsedNames = [
    'PARACET 650',
    'ACTON OR TAB 10\' TAB* SCH',
    'MONOCEF 1G VIAL*',
    'NEULORA 2MG TAB',
    'ALLERONE M TAB SC-H',
    'AVIL 25MG TAB 15\'S SC-H',
    'MOXCLAV DS ORAL SUSPENSION',
    'CLAVAMOX 625 TAB',
    'AZILIDE 500MG TAB'
  ]

  useEffect(() => {
    fetchInventory()
    api.get('/medicines').then((res) => setMedicines(res.data)).catch(() => {})

    // Check filter from URL query param (e.g. ?filter=mostly_used)
    const params = new URLSearchParams(location.search)
    const qFilter = params.get('filter')
    if (qFilter === 'mostly_used') {
      setFilterMode('MOSTLY_USED')
    } else if (qFilter === 'expiring_soon') {
      setFilterMode('EXPIRING_SOON')
    } else if (qFilter === 'low_stock') {
      setFilterMode('LOW_STOCK')
    }
  }, [location.search])

  function fetchInventory() {
    setLoading(true)
    api.get('/inventory')
      .then((res) => {
        setInventoryList(res.data)
        setLoading(false)
      })
      .catch(() => {
        setNotification('Failed to load inventory data.')
        setLoading(false)
      })
  }

  // Handle Add New Stock Entry
  async function handleAddStock(e) {
    e.preventDefault()
    if (!addForm.medicineId) {
      alert('Please select a medicine.')
      return
    }

    try {
      await api.post('/inventory', {
        ...addForm,
        medicineId: Number(addForm.medicineId),
        quantity: Number(addForm.quantity),
        mrp: Number(addForm.mrp),
        salePrice: Number(addForm.salePrice),
        purchasePrice: Number(addForm.purchasePrice),
      })
      setShowAddModal(false)
      setNotification('✅ New stock batch added successfully!')
      fetchInventory()
      setTimeout(() => setNotification(''), 4000)
    } catch (err) {
      alert('Failed to add stock batch: ' + (err.response?.data?.message || err.message))
    }
  }

  // Handle Edit Stock
  async function handleUpdateStock(e) {
    e.preventDefault()
    if (!editingItem) return

    try {
      await api.put(`/inventory/${editingItem.id}`, {
        batchNumber: editingItem.batchNumber,
        quantity: Number(editingItem.quantity),
        mrp: Number(editingItem.mrp),
        salePrice: Number(editingItem.salePrice),
        purchasePrice: Number(editingItem.purchasePrice),
        rack: editingItem.rack,
        shelf: editingItem.shelf,
        expiryDate: editingItem.expiryDate,
        status: editingItem.status,
      })
      setShowEditModal(false)
      setEditingItem(null)
      setNotification('✅ Stock batch updated successfully!')
      fetchInventory()
      setTimeout(() => setNotification(''), 4000)
    } catch (err) {
      alert('Failed to update stock: ' + (err.response?.data?.message || err.message))
    }
  }

  // Calculation of Key Metrics
  const totalStockCount = inventoryList.reduce((acc, it) => acc + (it.quantity || 0), 0)
  const totalStockValuation = inventoryList.reduce((acc, it) => acc + ((it.quantity || 0) * (it.mrp || 0)), 0)
  const expiringSoonCount = inventoryList.filter((it) => (it.expiryDate && it.expiryDate.startsWith('2026')) || it.status === 'EXPIRING_SOON').length
  const lowStockCount = inventoryList.filter((it) => it.quantity <= 10).length
  const mostlyUsedCount = inventoryList.filter((it) => mostlyUsedNames.some(n => it.medicineName?.toUpperCase().includes(n.substring(0, 8)))).length

  // Filtered List
  const filteredList = inventoryList.filter((item) => {
    // 1. Status / Category Filter
    if (filterMode === 'MOSTLY_USED') {
      const match = mostlyUsedNames.some((n) => item.medicineName?.toUpperCase().includes(n.substring(0, 8)))
      if (!match) return false
    } else if (filterMode === 'EXPIRING_SOON') {
      const isSoon = (item.expiryDate && item.expiryDate.startsWith('2026')) || item.status === 'EXPIRING_SOON'
      if (!isSoon) return false
    } else if (filterMode === 'LOW_STOCK') {
      if (item.quantity > 10) return false
    }

    // 2. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = item.medicineName?.toLowerCase().includes(q)
      const matchGeneric = item.genericName?.toLowerCase().includes(q)
      const matchBatch = item.batchNumber?.toLowerCase().includes(q)
      const matchRack = item.rack?.toLowerCase().includes(q)
      return matchName || matchGeneric || matchBatch || matchRack
    }
    return true
  })

  return (
    <div style={{ padding: '16px 20px', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>
            📦 Stock & Quantity Maintenance
          </h2>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 13 }}>
            Inspect available medicines with live quantities, filter mostly used high-demand drugs, and manage expiring batches.
          </p>
        </div>

        <button
          className="btn-success"
          onClick={() => setShowAddModal(true)}
          style={{ padding: '8px 14px', fontSize: 13, fontWeight: 700 }}
        >
          ➕ Add New Stock Batch (GRN)
        </button>
      </div>

      {notification && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {notification}
        </div>
      )}

      {/* KPI METRIC CARDS (Matching User Requirements) */}
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div
          className={`stat-box ${filterMode === 'ALL' ? 'highlight' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilterMode('ALL')}
        >
          <div className="value" style={{ color: '#0284c7' }}>{totalStockCount} Units</div>
          <div className="label">Total Stock Count (All Batches)</div>
        </div>

        <div
          className={`stat-box ${filterMode === 'MOSTLY_USED' ? 'highlight' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilterMode('MOSTLY_USED')}
        >
          <div className="value" style={{ color: '#0f766e' }}>{mostlyUsedCount} Items</div>
          <div className="label">🔥 Mostly Used / High Demand Drugs</div>
        </div>

        <div
          className={`stat-box ${filterMode === 'EXPIRING_SOON' ? 'highlight-warning' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilterMode('EXPIRING_SOON')}
        >
          <div className="value" style={{ color: '#d97706' }}>{expiringSoonCount} Batches</div>
          <div className="label">⚠️ Medicines Going to Expiry (2026)</div>
        </div>

        <div
          className={`stat-box ${filterMode === 'LOW_STOCK' ? 'highlight-warning' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setFilterMode('LOW_STOCK')}
        >
          <div className="value" style={{ color: '#dc2626' }}>{lowStockCount} Items</div>
          <div className="label">📉 Low / Out-of-Stock Reorder Alerts</div>
        </div>
      </div>

      {/* FILTER BUTTONS & SEARCH BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${filterMode === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12.5, fontWeight: 700, padding: '7px 14px' }}
            onClick={() => setFilterMode('ALL')}
          >
            All Inventory ({inventoryList.length})
          </button>

          <button
            className={`btn ${filterMode === 'MOSTLY_USED' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12.5, fontWeight: 700, padding: '7px 14px' }}
            onClick={() => setFilterMode('MOSTLY_USED')}
          >
            🔥 Mostly Used ({mostlyUsedCount})
          </button>

          <button
            className={`btn ${filterMode === 'EXPIRING_SOON' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12.5, fontWeight: 700, padding: '7px 14px' }}
            onClick={() => setFilterMode('EXPIRING_SOON')}
          >
            ⚠️ Going to Expiry ({expiringSoonCount})
          </button>

          <button
            className={`btn ${filterMode === 'LOW_STOCK' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12.5, fontWeight: 700, padding: '7px 14px' }}
            onClick={() => setFilterMode('LOW_STOCK')}
          >
            📉 Low Stock ({lowStockCount})
          </button>
        </div>

        <div style={{ minWidth: 280 }}>
          <input
            type="text"
            placeholder="Search by Medicine, Generic, Batch, Rack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 12px', fontSize: 13, border: '1.5px solid #cbd5e1', borderRadius: 6 }}
          />
        </div>
      </div>

      {/* STOCK QUANTITY TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Medicine Name</th>
              <th>Generic Formulation</th>
              <th style={{ width: 95 }}>Batch No</th>
              <th style={{ width: 110 }}>Rack / Shelf</th>
              <th style={{ width: 130, textAlign: 'center' }}>Available Quantity</th>
              <th style={{ width: 85, textAlign: 'right' }}>MRP (₹)</th>
              <th style={{ width: 85, textAlign: 'right' }}>Sale Price</th>
              <th style={{ width: 100 }}>Expiry Date</th>
              <th style={{ width: 100, textAlign: 'center' }}>Status</th>
              <th style={{ width: 90, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: 24 }}>Loading inventory batches…</td></tr>
            ) : filteredList.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No medicines match the selected filter.</td></tr>
            ) : (
              filteredList.map((item, idx) => {
                const isMostlyUsed = mostlyUsedNames.some(n => item.medicineName?.toUpperCase().includes(n.substring(0, 8)))
                const isNearExpiry = item.expiryDate && item.expiryDate.startsWith('2026')
                return (
                  <tr key={item.id} style={{ background: isNearExpiry ? '#fffbeb' : 'transparent' }}>
                    <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.medicineName}</div>
                      {isMostlyUsed && (
                        <span style={{ fontSize: 10, color: '#0284c7', fontWeight: 700 }}>
                          🔥 Fast-Moving High Demand
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{item.genericName}</td>
                    <td style={{ fontWeight: 600, color: '#0369a1' }}>{item.batchNumber}</td>
                    <td>
                      <span className="badge neutral" style={{ fontSize: 11 }}>
                        {item.rack} / Shelf {item.shelf}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`badge ${item.quantity === 0 ? 'danger' : item.quantity <= 10 ? 'warning' : 'success'}`}
                        style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px' }}
                      >
                        {item.quantity} Units
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.mrp?.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>₹{item.salePrice?.toFixed(2)}</td>
                    <td style={{ color: isNearExpiry ? '#b45309' : '#475569', fontWeight: isNearExpiry ? 800 : 500 }}>
                      {item.expiryDate} {isNearExpiry && '⚠️'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${item.status === 'AVAILABLE' ? 'success' : item.status === 'LOW_STOCK' ? 'warning' : 'danger'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => {
                          setEditingItem({ ...item })
                          setShowEditModal(true)
                        }}
                      >
                        ✏️ Edit Qty
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && editingItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16 }}>✏️ Adjust Stock & Quantity</h3>
              <button className="btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleUpdateStock}>
              <div style={{ marginBottom: 12 }}>
                <strong>{editingItem.medicineName}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>Batch: {editingItem.batchNumber}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Available Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                    required
                    style={{ width: '100%', padding: '6px 10px', fontSize: 14, fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Status:</label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="LOW_STOCK">LOW_STOCK</option>
                    <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                    <option value="QUARANTINED">QUARANTINED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Rack Location:</label>
                  <input
                    type="text"
                    value={editingItem.rack}
                    onChange={(e) => setEditingItem({ ...editingItem, rack: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Shelf Level:</label>
                  <input
                    type="text"
                    value={editingItem.shelf}
                    onChange={(e) => setEditingItem({ ...editingItem, shelf: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-success" style={{ flex: 1, padding: 10, fontWeight: 700 }}>
                  Save Quantity Update
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD BATCH MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16 }}>➕ Add New Stock Batch</h3>
              <button className="btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddStock}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Select Medicine:</label>
                <select
                  value={addForm.medicineId}
                  onChange={(e) => setAddForm({ ...addForm, medicineId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13 }}
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.genericName})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Batch Number:</label>
                  <input
                    type="text"
                    placeholder="e.g. MCV27B"
                    value={addForm.batchNumber}
                    onChange={(e) => setAddForm({ ...addForm, batchNumber: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Initial Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={addForm.quantity}
                    onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>MRP (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.mrp}
                    onChange={(e) => setAddForm({ ...addForm, mrp: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Sale Price (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.salePrice}
                    onChange={(e) => setAddForm({ ...addForm, salePrice: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Purchase (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.purchasePrice}
                    onChange={(e) => setAddForm({ ...addForm, purchasePrice: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Rack:</label>
                  <input
                    type="text"
                    value={addForm.rack}
                    onChange={(e) => setAddForm({ ...addForm, rack: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Shelf:</label>
                  <input
                    type="text"
                    value={addForm.shelf}
                    onChange={(e) => setAddForm({ ...addForm, shelf: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Expiry Date:</label>
                  <input
                    type="date"
                    value={addForm.expiryDate}
                    onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
                    required
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-success" style={{ flex: 1, padding: 10, fontWeight: 700 }}>
                  Save New Batch
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
