import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Purchase() {
  const [activeTab, setActiveTab] = useState('reorder') // 'reorder' | 'history'
  const [reorderList, setReorderList] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState('')

  // New Purchase Modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [supplierName, setSupplierName] = useState('SANOFI INDIA LTD')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [selectedMed, setSelectedMed] = useState('AVIL 25MG TAB 15\'S SC-H')
  const [batchNumber, setBatchNumber] = useState('AVL27A')
  const [quantity, setQuantity] = useState(100)
  const [purchasePrice, setPurchasePrice] = useState(6.80)
  const [mrp, setMrp] = useState(10.28)

  useEffect(() => {
    // Check URL params for active tab
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'history') {
      setActiveTab('history')
    }
    fetchData()
  }, [])

  function fetchData() {
    setLoading(true)
    Promise.all([
      api.get('/purchases/reorder').catch(() => ({ data: [] })),
      api.get('/purchases/history').catch(() => ({ data: [] }))
    ]).then(([reorderRes, historyRes]) => {
      setReorderList(reorderRes.data || [])
      setHistoryList(historyRes.data || [])
      setLoading(false)
    })
  }

  const totalReorderEst = reorderList.reduce((acc, it) => acc + (it.estimatedTotal || 0), 0)
  const totalHistoryPurchases = historyList.reduce((acc, it) => acc + (it.netAmount || 0), 0)

  async function handleCreatePurchase(e) {
    e.preventDefault()
    try {
      await api.post('/purchases', {
        supplierName,
        paymentMode: 'NEFT',
        paymentStatus: 'PAID',
        items: [
          {
            medicineName: selectedMed,
            batchNumber,
            quantity: Number(quantity),
            purchasePrice: Number(purchasePrice),
            mrp: Number(mrp),
            amount: Number(quantity) * Number(purchasePrice)
          }
        ]
      })
      setShowNewModal(false)
      setNotification('✅ Purchase Invoice recorded and inventory batch restocked successfully!')
      fetchData()
      setTimeout(() => setNotification(''), 4000)
    } catch (err) {
      alert('Failed to record purchase: ' + err.message)
    }
  }

  return (
    <div style={{ padding: '16px 20px', maxWidth: '100%' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>
            📦 Purchase Operations & Vendor Orders
          </h2>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 13 }}>
            Manage supplier purchase orders, restock low-inventory items, and inspect historical vendor purchase registers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-success"
            onClick={() => setShowNewModal(true)}
            style={{ padding: '8px 14px', fontSize: 13, fontWeight: 700 }}
          >
            ➕ Record New Purchase Invoice (GRN)
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {notification}
        </div>
      )}

      {/* KPI Overview */}
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat-box highlight-warning">
          <div className="value" style={{ color: '#d97706' }}>{reorderList.length}</div>
          <div className="label">Medicines Need to be Ordered</div>
        </div>

        <div className="stat-box">
          <div className="value">₹{totalReorderEst.toFixed(2)}</div>
          <div className="label">Estimated Reorder Cost</div>
        </div>

        <div className="stat-box highlight">
          <div className="value" style={{ color: '#0284c7' }}>{historyList.length} Invoices</div>
          <div className="label">Purchase Invoices Recorded</div>
        </div>

        <div className="stat-box">
          <div className="value">₹{totalHistoryPurchases.toFixed(2)}</div>
          <div className="label">Total Purchases to Date</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('reorder')}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'reorder' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'reorder' ? '#0284c7' : '#64748b',
            cursor: 'pointer'
          }}
        >
          📋 Medicines Need to be Ordered ({reorderList.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'history' ? '#0284c7' : '#64748b',
            cursor: 'pointer'
          }}
        >
          📜 Last Purchase History ({historyList.length})
        </button>
      </div>

      {/* TAB 1: MEDICINES NEED TO BE ORDERED */}
      {activeTab === 'reorder' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>
              Stock Shortage Indent — Medicines below safety threshold (≤ 15 units)
            </span>
            <button
              className="btn-primary btn-sm"
              onClick={() => alert(`Purchase Order draft generated for ${reorderList.length} items totaling ₹${totalReorderEst.toFixed(2)}.`)}
            >
              📄 Export PO to Suppliers
            </button>
          </div>

          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Medicine Name</th>
                <th>Generic / Formulation</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Current Stock</th>
                <th style={{ textAlign: 'center' }}>Min Buffer</th>
                <th style={{ textAlign: 'center' }}>Recommended Order Qty</th>
                <th>Manufacturer / Supplier</th>
                <th style={{ textAlign: 'right' }}>Est. Unit Cost</th>
                <th style={{ textAlign: 'right' }}>Est. Total</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reorderList.map((item, idx) => (
                <tr key={item.medicineId}>
                  <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.medicineName}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{item.genericName}</td>
                  <td><span className="badge neutral" style={{ fontSize: 11 }}>{item.category}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${item.currentStock === 0 ? 'danger' : 'warning'}`} style={{ fontWeight: 800 }}>
                      {item.currentStock} Units
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', color: '#64748b' }}>{item.minBuffer}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>
                    +{item.suggestedOrderQty} Units
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.manufacturer}</td>
                  <td style={{ textAlign: 'right' }}>₹{item.estimatedUnitCost.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    ₹{item.estimatedTotal.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${item.urgency === 'CRITICAL' ? 'danger' : 'warning'}`}>
                      {item.urgency === 'CRITICAL' ? '🚨 OUT OF STOCK' : '⚠️ LOW STOCK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: LAST PURCHASE HISTORY */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>
              Vendor Purchase Register & Goods Receipt Notes (GRN)
            </span>
          </div>

          <table className="erp-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Supplier Name</th>
                <th>GSTIN</th>
                <th>Invoice Date</th>
                <th>Items Supplied</th>
                <th style={{ textAlign: 'right' }}>Base Amount</th>
                <th style={{ textAlign: 'right' }}>Tax (GST)</th>
                <th style={{ textAlign: 'right' }}>Net Payable</th>
                <th style={{ textAlign: 'center' }}>Mode</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700, color: '#0369a1' }}>{p.invoiceNumber}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{p.supplierName}</td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>{p.supplierGst}</td>
                  <td style={{ color: '#475569' }}>{p.invoiceDate}</td>
                  <td>
                    {p.items?.map((it, i) => (
                      <div key={i} style={{ fontSize: 11.5 }}>
                        <strong>{it.medicineName}</strong> (Batch: {it.batchNumber}, Qty: {it.quantity})
                      </div>
                    ))}
                  </td>
                  <td style={{ textAlign: 'right' }}>₹{p.totalAmount?.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>₹{p.taxAmount?.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    ₹{p.netAmount?.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge neutral" style={{ fontSize: 10 }}>{p.paymentMode}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${p.paymentStatus === 'PAID' ? 'success' : 'warning'}`}>
                      {p.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RECORD NEW PURCHASE MODAL */}
      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16 }}>➕ Record Supplier Purchase Invoice</h3>
              <button className="btn-secondary btn-sm" onClick={() => setShowNewModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreatePurchase}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Supplier Name:</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Supplier Invoice No:</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-8899"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Medicine Item:</label>
                <select
                  value={selectedMed}
                  onChange={(e) => setSelectedMed(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                >
                  <option value="AVIL 25MG TAB 15'S SC-H">AVIL 25MG TAB 15'S SC-H</option>
                  <option value="AVIL VIAL 10ML* SCH">AVIL VIAL 10ML* SCH (Currently Out of Stock)</option>
                  <option value="NEUROBION FORTE AMP 2ML* SCH">NEUROBION FORTE AMP 2ML* SCH (Currently Out of Stock)</option>
                  <option value="MOXCLAV DS ORAL SUSPENSION">MOXCLAV DS ORAL SUSPENSION</option>
                  <option value="MONOCEF 1G VIAL*">MONOCEF 1G VIAL*</option>
                  <option value="NEULORA 2MG TAB">NEULORA 2MG TAB</option>
                  <option value="PARACET 650">PARACET 650</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Batch No:</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    required
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>Purchase (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    required
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 }}>MRP (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    required
                    style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 12.5 }}>
                Subtotal: <strong>₹{(Number(quantity) * Number(purchasePrice)).toFixed(2)}</strong> + 5% GST = <strong>₹{((Number(quantity) * Number(purchasePrice)) * 1.05).toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-success" style={{ flex: 1, padding: 10, fontWeight: 700 }}>
                  ✅ Save & Restock Batch
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowNewModal(false)}>
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
