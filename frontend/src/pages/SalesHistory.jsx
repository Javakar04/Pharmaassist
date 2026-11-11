import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function SalesHistory() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentFilter, setPaymentFilter] = useState('ALL')

  useEffect(() => {
    fetchInvoices()
  }, [])

  function fetchInvoices() {
    setLoading(true)
    const endpoint = isAdmin ? '/invoices' : '/invoices/my'
    api.get(endpoint)
      .then((res) => {
        setInvoices(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerPhone.includes(searchTerm) ||
      (inv.doctorName && inv.doctorName.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false
    if (paymentFilter !== 'ALL' && inv.paymentMethod !== paymentFilter) return false
    return true
  })

  const totalSalesRevenue = filtered.reduce((acc, inv) => acc + (inv.netPayable || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>📜 {isAdmin ? 'Pharmacy Sales History & Audit Ledger' : 'My Shift Sales Register'}</h2>
          <p>
            {isAdmin
              ? 'Complete transaction audit trail with line-item detail and reprint capability'
              : 'Record of all sales and invoices generated during your counter shifts'}
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="value">₹{totalSalesRevenue.toFixed(2)}</div>
          <div className="label">Total Filtered Sales</div>
        </div>
        <div className="stat-box">
          <div className="value">{filtered.length}</div>
          <div className="label">Total Bills</div>
        </div>
        <div className="stat-box">
          <div className="value">
            {filtered.length > 0 ? `₹${(totalSalesRevenue / filtered.length).toFixed(2)}` : '₹0.00'}
          </div>
          <div className="label">Average Bill Value</div>
        </div>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              type="text"
              placeholder="Search by Bill Number (e.g. R01001411, C01079066), customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: 180 }}>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="ALL">All Payment Modes</option>
              <option value="CASH">💵 Cash Only</option>
              <option value="UPI">📱 UPI Only</option>
              <option value="CARD">💳 Card Only</option>
              <option value="CREDIT">📝 Credit Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: 20 }}>Loading sales history...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>No invoices found matching criteria.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bill No</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Doctor</th>
                <th>Cashier</th>
                <th>Payment Mode</th>
                <th style={{ textAlign: 'right' }}>Net Amount</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: '#0369a1' }}>{inv.invoiceNumber}</td>
                  <td style={{ fontSize: 12, color: '#475569' }}>
                    {new Date(inv.createdAt).toLocaleDateString()} {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{inv.customerName}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{inv.customerPhone}</div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{inv.doctorName || 'Self / OTC'}</td>
                  <td style={{ fontSize: 12.5 }}>{inv.cashierName || 'Pharmacist'}</td>
                  <td>
                    <span className="badge neutral">{inv.paymentMethod}</span>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: 14, color: '#15803d', textAlign: 'right' }}>
                    ₹{inv.netPayable?.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      🖨️ View & Print Bill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Real-World Printed Cash Bill Modal (Matching Photo 1) */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header no-print">
              <h3 style={{ margin: 0, fontSize: 16 }}>Bill: {selectedInvoice.invoiceNumber}</h3>
              <button className="btn-secondary btn-sm" onClick={() => setSelectedInvoice(null)}>✕</button>
            </div>

            <div className="real-receipt-paper">
              <div className="real-receipt-header">
                <div className="real-receipt-storename">THIRUMURUGAN MEDICALS</div>
                <div className="real-receipt-meta" style={{ marginTop: 4 }}>
                  No.3/60, Sinthu Nagar, Poorandampalayam (Post), Sulthanpet(Via)<br />
                  Sulur Taluk, Coimbatore District - 641669<br />
                  DL NO: TN-10-20-01376 & TN-10-21-01376<br />
                  MOBILE: 9952222292
                </div>
              </div>

              <div className="real-receipt-divider"></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                <span>C A S H  B i l l : {selectedInvoice.invoiceNumber}</span>
                <span>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()} {new Date(selectedInvoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div style={{ fontSize: 11, marginTop: 4 }}>
                <div>Dr. : {selectedInvoice.doctorName}</div>
                <div>Name: {selectedInvoice.customerName}</div>
              </div>

              <div className="real-receipt-divider"></div>

              <table className="real-receipt-table">
                <thead>
                  <tr>
                    <th style={{ width: 35 }}>Qty</th>
                    <th>Particulars</th>
                    <th style={{ width: 45 }}>Mfr</th>
                    <th style={{ width: 65 }}>Batch</th>
                    <th style={{ width: 45 }}>Exp</th>
                    <th style={{ width: 65, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((it, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ fontWeight: 600 }}>{it.medicineName}</td>
                      <td>{it.mfr || 'GEN'}</td>
                      <td>{it.batchNumber}</td>
                      <td>{it.expiryDate || '12/28'}</td>
                      <td style={{ textAlign: 'right' }}>{it.totalPrice ? it.totalPrice.toFixed(2) : (it.quantity * it.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="real-receipt-divider"></div>

              <div style={{ fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST VALUE: {selectedInvoice.cgstAmount ? selectedInvoice.cgstAmount.toFixed(2) : (selectedInvoice.taxAmount / 2).toFixed(2)}</span>
                  <span>Base Value: {selectedInvoice.baseValue ? selectedInvoice.baseValue.toFixed(2) : selectedInvoice.totalAmount?.toFixed(2)}</span>
                  <span>Total: {((selectedInvoice.baseValue || selectedInvoice.totalAmount || 0) + (selectedInvoice.taxAmount || 0)).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span>SGST VALUE: {selectedInvoice.sgstAmount ? selectedInvoice.sgstAmount.toFixed(2) : (selectedInvoice.taxAmount / 2).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span>Total Items: {selectedInvoice.items?.length || 1}</span>
                  <span>Qty: {selectedInvoice.totalQty || selectedInvoice.items?.reduce((a, c) => a + c.quantity, 0)}</span>
                  <span>Rnd: {selectedInvoice.roundoffValue !== undefined ? selectedInvoice.roundoffValue.toFixed(2) : '0.00'}</span>
                </div>
              </div>

              <div className="real-receipt-divider"></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, padding: '4px 0' }}>
                <span>E. & O.E.</span>
                <span>Rounded Off to Rs.</span>
                <span style={{ fontSize: 16, fontWeight: 900 }}>{selectedInvoice.netPayable.toFixed(2)}</span>
              </div>

              <div className="real-receipt-divider"></div>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 11.5 }}>Wish You A Speedy Recovery</div>
                <div style={{ fontSize: 10.5, marginTop: 4, textAlign: 'right' }}>.for THIRUMURUGAN MEDICALS</div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: 11, fontSize: 14 }}
                onClick={() => window.print()}
              >
                🖨️ Print Receipt
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: 11, fontSize: 14 }}
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
