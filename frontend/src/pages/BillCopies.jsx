import { useEffect, useState } from 'react'
import api from '../api/client'

export default function BillCopies() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showPrintModal, setShowPrintModal] = useState(false)

  // Filter Form State (matching Video 1 top controls)
  const [fromDate, setFromDate] = useState('2026-11-10')
  const [toDate, setToDate] = useState('2026-11-10')
  const [billType, setBillType] = useState('ALL')
  const [filterCustomer, setFilterCustomer] = useState('ALL')
  const [filterDoctor, setFilterDoctor] = useState('ALL')
  const [filterSalesRep, setFilterSalesRep] = useState('ALL')
  const [searchBillNo, setSearchBillNo] = useState('')

  useEffect(() => {
    fetchBills()
  }, [])

  function fetchBills() {
    setLoading(true)
    api.get('/invoices')
      .then((res) => {
        setInvoices(res.data)
        if (res.data && res.data.length > 0) {
          setSelectedInvoice(res.data[0]) // Select first bill by default (Video 1)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const filteredBills = invoices.filter((inv) => {
    if (billType !== 'ALL' && inv.paymentMethod !== billType) return false
    if (searchBillNo.trim() && !inv.invoiceNumber.toLowerCase().includes(searchBillNo.toLowerCase().trim())) return false
    if (filterCustomer !== 'ALL' && inv.customerName !== filterCustomer) return false
    if (filterDoctor !== 'ALL' && inv.doctorName !== filterDoctor) return false
    return true
  })

  return (
    <div className="pos-screen-container" style={{ background: '#fdfbf7' }}>

      {/* 1. Sleek ERP Sub-Header Bar (matching Video 1) */}
      <div className="erp-bill-header-bar" style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', padding: '8px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div className="erp-bill-title" style={{ fontSize: 16, color: '#1e3a8a' }}>📑 Bill Copies & Sales Register</div>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
              Audit Ledger | Showing <strong>{filteredBills.length}</strong> of {invoices.length} Invoices
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="hotkey-btn primary"
            style={{ background: '#0284c7', borderColor: '#0369a1', padding: '6px 14px', fontSize: 12, fontWeight: 700 }}
            onClick={() => selectedInvoice && setShowPrintModal(true)}
            disabled={!selectedInvoice}
          >
            🖨️ Print Selected Bill (Receipt)
          </button>
        </div>
      </div>

      {/* 2. Top Filter Controls (matching Video 1 screen layout) */}
      <div style={{ background: '#f5efe6', padding: '10px 14px', borderBottom: '1px solid #dcd3c5', fontSize: 11.5 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, alignItems: 'center' }}>
          <div>
            <label style={{ color: '#57534e', fontWeight: 600, display: 'block' }}>From Date:</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '3px 6px', fontSize: 11.5 }} />
          </div>

          <div>
            <label style={{ color: '#57534e', fontWeight: 600, display: 'block' }}>To Date:</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '3px 6px', fontSize: 11.5 }} />
          </div>

          <div>
            <label style={{ color: '#57534e', fontWeight: 600, display: 'block' }}>Bill Type:</label>
            <select value={billType} onChange={(e) => setBillType(e.target.value)} style={{ padding: '3px 6px', fontSize: 11.5 }}>
              <option value="ALL">&lt;ALL&gt;</option>
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="CARD">CARD</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#57534e', fontWeight: 600, display: 'block' }}>Bill Number:</label>
            <input
              type="text"
              placeholder="e.g. C0108..."
              value={searchBillNo}
              onChange={(e) => setSearchBillNo(e.target.value)}
              style={{ padding: '3px 6px', fontSize: 11.5 }}
            />
          </div>

          <div>
            <label style={{ color: '#57534e', fontWeight: 600, display: 'block' }}>Select Customer:</label>
            <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} style={{ padding: '3px 6px', fontSize: 11.5 }}>
              <option value="ALL">&lt;ALL&gt;</option>
              <option value="DR VISHNU PRASANTH">DR VISHNU PRASANTH</option>
              <option value="MANI VADACHELA">MANI VADACHELA</option>
              <option value="SENTHIL">SENTHIL</option>
              <option value="Walk-in Patient">Walk-in Patient</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#57534e', fontWeight: 600, display: 'block' }}>Select Doctor:</label>
            <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} style={{ padding: '3px 6px', fontSize: 11.5 }}>
              <option value="ALL">&lt;ALL&gt;</option>
              <option value="DR K VISHNU PRASANTH M B">DR K VISHNU PRASANTH M B</option>
              <option value="DR R SENGOTTUVEL">DR R SENGOTTUVEL</option>
            </select>
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '6px 12px', fontSize: 12, fontWeight: 700, background: '#1e3a8a' }}
              onClick={fetchBills}
            >
              🔄 Load
            </button>
          </div>
        </div>
      </div>

      {/* 3. Top Master Table: Invoices / Bills List (matching Video 1) */}
      <div style={{ maxHeight: 240, overflowY: 'auto', borderBottom: '2px solid #1e3a8a' }}>
        <table className="erp-table">
          <thead>
            <tr>
              <th style={{ width: 75 }}># / Time</th>
              <th style={{ width: 100 }}>Bill Number</th>
              <th style={{ width: 85, textAlign: 'right' }}>Bill Amt</th>
              <th style={{ width: 75, textAlign: 'right' }}>Disc Amt</th>
              <th style={{ width: 75, textAlign: 'right' }}>Discount Per</th>
              <th style={{ width: 95 }}>Customer Code</th>
              <th style={{ minWidth: 160 }}>Customer Name</th>
              <th style={{ width: 120 }}>Address 1</th>
              <th style={{ minWidth: 160 }}>Doctor Name</th>
              <th style={{ width: 90 }}>SMan Name</th>
              <th style={{ width: 85 }}>User Name</th>
              <th style={{ width: 75 }}>Delivery</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((inv) => {
              const isSelected = selectedInvoice?.id === inv.id
              return (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  style={{
                    background: isSelected ? '#bfdbfe' : undefined,
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ fontSize: 11 }}>{inv.time || '08:30 PM'}</td>
                  <td style={{ color: '#0369a1', fontWeight: 700 }}>{inv.invoiceNumber}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{inv.netPayable?.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{inv.discountAmount ? inv.discountAmount.toFixed(2) : '0.00'}</td>
                  <td style={{ textAlign: 'right' }}>{inv.discountPercentage ? inv.discountPercentage.toFixed(2) : '0.00'}</td>
                  <td>{inv.customerCode || '10001'}</td>
                  <td style={{ fontWeight: 600 }}>{inv.customerName}</td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>{inv.customerAddress || 'At Store'}</td>
                  <td style={{ fontSize: 11 }}>{inv.doctorName}</td>
                  <td>-</td>
                  <td style={{ fontSize: 11, color: '#0284c7' }}>{inv.cashierName || 'SALES 2'}</td>
                  <td><span className="badge neutral" style={{ fontSize: 10 }}>{inv.delivery || 'At Store'}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Detail Table: Line Items of Selected Bill (matching Video 1) */}
      <div style={{ padding: '8px 14px', background: '#e0e7ff', fontWeight: 700, fontSize: 12, color: '#1e3a8a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          📦 Line Items for Bill: <strong>{selectedInvoice?.invoiceNumber || 'None Selected'}</strong> — Customer: <strong>{selectedInvoice?.customerName}</strong>
        </span>
        <span>
          Net Total: <strong style={{ color: '#15803d', fontSize: 14 }}>₹ {selectedInvoice?.netPayable?.toFixed(2)}</strong>
        </span>
      </div>

      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        <table className="erp-table">
          <thead>
            <tr style={{ background: '#1e293b' }}>
              <th style={{ width: 35 }}>#</th>
              <th>Product Name</th>
              <th style={{ width: 65, textAlign: 'center' }}>Quantity</th>
              <th style={{ width: 100 }}>BatchDescription</th>
              <th style={{ width: 70, textAlign: 'right' }}>Discount</th>
              <th style={{ width: 70, textAlign: 'right' }}>TaxAmount</th>
              <th style={{ width: 85, textAlign: 'right' }}>TransAmount</th>
              <th style={{ width: 55, textAlign: 'center' }}>FreeQ</th>
              <th style={{ width: 75, textAlign: 'right' }}>MRP</th>
              <th style={{ width: 65, textAlign: 'center' }}>SaleUnit</th>
              <th style={{ width: 75, textAlign: 'right' }}>Rate</th>
              <th style={{ width: 75 }}>Expiry</th>
            </tr>
          </thead>
          <tbody>
            {selectedInvoice?.items?.map((it, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ fontWeight: 600 }}>{it.medicineName}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>{it.quantity}</td>
                <td style={{ color: '#b45309', fontWeight: 600 }}>{it.batchNumber}</td>
                <td style={{ textAlign: 'right' }}>0.00</td>
                <td style={{ textAlign: 'right' }}>{it.taxAmount ? it.taxAmount.toFixed(2) : '1.20'}</td>
                <td style={{ textAlign: 'right' }}>{it.transAmount ? it.transAmount.toFixed(2) : (it.totalPrice - (it.taxAmount || 0)).toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>0</td>
                <td style={{ textAlign: 'right' }}>{it.mrp ? it.mrp.toFixed(2) : it.unitPrice.toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>10</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{it.rate ? it.rate.toFixed(2) : it.unitPrice.toFixed(2)}</td>
                <td style={{ color: '#475569' }}>{it.expiryDate || '12/28'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Printable Dot-Matrix Bill Modal (matching Photo 1) */}
      {showPrintModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header no-print">
              <h3>🖨️ Bill Copy: {selectedInvoice.invoiceNumber}</h3>
              <button className="btn-secondary btn-sm" onClick={() => setShowPrintModal(false)}>✕</button>
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
                      <td style={{ textAlign: 'right' }}>{(it.totalPrice || it.quantity * it.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="real-receipt-divider"></div>

              <div style={{ fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST VALUE: {selectedInvoice.cgstAmount ? selectedInvoice.cgstAmount.toFixed(2) : (selectedInvoice.taxAmount / 2).toFixed(2)}</span>
                  <span>Base Value: {selectedInvoice.baseValue ? selectedInvoice.baseValue.toFixed(2) : selectedInvoice.totalAmount?.toFixed(2)}</span>
                  <span>Total: {selectedInvoice.netPayable.toFixed(2)}</span>
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
              <button className="btn-primary" style={{ flex: 1, padding: 11 }} onClick={() => window.print()}>
                🖨️ Print Dot-Matrix Bill
              </button>
              <button className="btn-secondary" style={{ flex: 1, padding: 11 }} onClick={() => setShowPrintModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
