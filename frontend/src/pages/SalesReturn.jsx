import { useState, useEffect, useRef } from 'react'
import api from '../api/client'

export default function SalesReturn() {
  const [returnItems, setReturnItems] = useState([])
  const [searchCode, setSearchCode] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const [customerName, setCustomerName] = useState('Customer Return')
  const [customerPhone, setCustomerPhone] = useState('')
  const [returnReason, setReturnReason] = useState('Doctor Changed Prescription')
  const [returnType, setReturnType] = useState('R - Cash Sales Return')

  const [notification, setNotification] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (!searchCode.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      api.get(`/medicines/search?q=${encodeURIComponent(searchCode)}`)
        .then(async (res) => {
          const meds = res.data
          const enriched = await Promise.all(
            meds.map(async (m) => {
              try {
                const bRes = await api.get(`/inventory/medicine/${m.id}/batches`)
                const batches = bRes.data
                const totalStock = batches.reduce((acc, b) => acc + b.quantity, 0)
                return { ...m, stock: totalStock, firstBatch: batches[0] || null }
              } catch {
                return { ...m, stock: 0, firstBatch: null }
              }
            })
          )
          setSearchResults(enriched)
        })
        .catch(() => {})
    }, 180)
    return () => clearTimeout(timer)
  }, [searchCode])

  function handleSelectMedicine(med) {
    const batch = med.firstBatch
    const rate = batch?.salePrice || batch?.mrp || 10
    const newItem = {
      id: Date.now(),
      medicineId: med.id,
      productName: med.name,
      quantity: 1,
      batch: batch?.batchNumber || 'RET-BATCH',
      rate: rate,
      mrp: batch?.mrp || rate,
      free: 0,
      disAmt: 0,
      disPct: 0,
      expiryDate: (batch?.expiryDate || '2028-12-31').substring(2, 7).replace('-', '/'),
      unitDesc: med.dosageForm || 'Tab',
      loc: 'MAIN',
      subLoc: `${batch?.rack || 'RACK-E1'} / ${batch?.shelf || '1'}`,
      gross: rate,
      inventoryId: batch?.id || 1
    }
    setReturnItems([...returnItems, newItem])
    setSearchCode('')
    setSearchResults([])
    if (searchInputRef.current) searchInputRef.current.focus()
  }

  function handleQuantityChange(index, qty) {
    if (qty <= 0) {
      setReturnItems(returnItems.filter((_, i) => i !== index))
      return
    }
    const updated = [...returnItems]
    updated[index].quantity = qty
    updated[index].gross = parseFloat((updated[index].rate * qty).toFixed(2))
    setReturnItems(updated)
  }

  const refundTotal = returnItems.reduce((acc, item) => acc + (item.gross || 0), 0)

  async function handleProcessReturn() {
    if (returnItems.length === 0) {
      alert('Please add at least one item to return.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        customerName: customerName,
        reason: returnReason,
        items: returnItems.map((it) => ({
          medicineId: it.medicineId,
          inventoryId: it.inventoryId,
          quantity: it.quantity,
          unitPrice: it.rate
        }))
      }

      const res = await api.post('/invoices/return', payload)
      setNotification(`✅ ${res.data.message} | Refund Slip: ${res.data.returnSlip} | Amount: ₹${res.data.refundTotal.toFixed(2)}`)
      setReturnItems([])
    } catch (err) {
      alert('Failed to process return: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pos-screen-container">


      {/* 2. Return Header Bar */}
      <div className="erp-bill-header-bar" style={{ background: '#fff1f2' }}>
        <div>
          <div className="erp-bill-title" style={{ color: '#be123c' }}>Sales Return</div>
          <div style={{ fontSize: 11.5, color: '#475569', fontWeight: 600 }}>
            Return No : <span style={{ color: '#0f172a' }}>R0100145</span>
          </div>
        </div>

        <div className="erp-net-display-pill" style={{ background: '#881337' }}>
          <span style={{ fontSize: 13, color: '#fecdd3', fontWeight: 600 }}>REFUND TOTAL</span>
          <span className="amount" style={{ color: '#ffffff' }}>₹ {refundTotal.toFixed(2)}</span>
        </div>
      </div>

      {notification && (
        <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px 16px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #bbf7d0' }}>
          {notification}
        </div>
      )}

      {/* 3. Return Items Table (matching Video 3 columns) */}
      <div style={{ position: 'relative', overflowX: 'auto', minHeight: 220 }}>
        <table className="erp-table">
          <thead>
            <tr style={{ background: '#881337' }}>
              <th style={{ width: 35 }}>#</th>
              <th>Product Name</th>
              <th style={{ width: 70, textAlign: 'center' }}>Quantity</th>
              <th style={{ width: 85 }}>Batch</th>
              <th style={{ width: 65, textAlign: 'right' }}>Rate</th>
              <th style={{ width: 65, textAlign: 'right' }}>MRP</th>
              <th style={{ width: 50, textAlign: 'center' }}>Free</th>
              <th style={{ width: 75 }}>Expiry</th>
              <th style={{ width: 80 }}>Unit Desc</th>
              <th style={{ width: 100 }}>Sub Loc</th>
              <th style={{ width: 85, textAlign: 'right' }}>Gross</th>
              <th style={{ width: 40, textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {returnItems.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ fontWeight: 600 }}>{item.productName}</td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                    style={{ width: 50, padding: '2px 4px', textAlign: 'center', fontSize: 12 }}
                  />
                </td>
                <td style={{ color: '#0369a1', fontWeight: 600 }}>{item.batch}</td>
                <td style={{ textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{item.mrp.toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>0</td>
                <td>{item.expiryDate}</td>
                <td>{item.unitDesc}</td>
                <td><span className="badge neutral" style={{ fontSize: 10 }}>{item.subLoc}</span></td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#be123c' }}>₹ {item.gross.toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-danger btn-sm" onClick={() => setReturnItems(returnItems.filter((_, i) => i !== idx))}>✕</button>
                </td>
              </tr>
            ))}

            {/* Prompt Row for returning items (matching Video 3) */}
            <tr className="active-entry-row">
              <td style={{ textAlign: 'center', fontWeight: 700 }}>{returnItems.length + 1}</td>
              <td colSpan={11} style={{ padding: '4px 6px', position: 'relative' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type product name to return (e.g. AVIL, NEULORA, PARACET)..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', border: '2px solid #e11d48', borderRadius: 4, fontWeight: 700, background: '#fff1f2', outline: 'none' }}
                />

                {searchResults.length > 0 && (
                  <div className="erp-lookup-popup">
                    <div className="erp-lookup-header" style={{ background: '#ffe4e6', color: '#881337' }}>
                      <span>P_code</span>
                      <span>Product Name</span>
                      <span>Rack</span>
                      <span style={{ textAlign: 'center' }}>Stock</span>
                      <span style={{ textAlign: 'right' }}>MRP</span>
                    </div>
                    {searchResults.map((m) => (
                      <div
                        key={m.id}
                        className="erp-lookup-row"
                        onClick={() => handleSelectMedicine(m)}
                      >
                        <span style={{ fontWeight: 700, color: '#0369a1' }}>{m.id}</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{m.name}</div>
                          <div style={{ fontSize: 10.5, color: '#64748b' }}>{m.genericName}</div>
                        </div>
                        <span>{m.firstBatch?.rack || '-'}</span>
                        <span style={{ textAlign: 'center' }}>
                          <span className={`badge ${m.stock > 0 ? 'success' : 'danger'}`}>
                            {m.stock}
                          </span>
                        </span>
                        <span style={{ textAlign: 'right', fontWeight: 700 }}>
                          ₹{m.firstBatch?.mrp || '0.00'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Info Panel */}
      <div className="erp-bottom-panel">
        <div className="erp-box-section">
          <div className="erp-field-inline">
            <label>Customer Name:</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="erp-field-inline">
            <label>Mobile No:</label>
            <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="9876543210" />
          </div>
          <div className="erp-field-inline">
            <label>Return Reason:</label>
            <input type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
          </div>
        </div>

        <div className="erp-box-section">
          <div className="erp-field-inline">
            <label>Return Type:</label>
            <select value={returnType} onChange={(e) => setReturnType(e.target.value)}>
              <option value="R - Cash Sales Return">R - Cash Sales Return</option>
              <option value="U - UPI Refund">U - UPI Refund</option>
              <option value="C - Store Credit Note">C - Store Credit Note</option>
            </select>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
            ℹ️ Returned items will be automatically re-credited to inventory stock batches.
          </div>
        </div>

        <div className="erp-box-section" style={{ background: '#fff1f2', borderColor: '#fecdd3' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#881337', marginBottom: 6 }}>Refund Summary</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>Items to Restock:</span>
            <span>{returnItems.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: '#be123c', borderTop: '1px dashed #be123c', paddingTop: 6 }}>
            <span>REFUND PAYABLE:</span>
            <span>₹ {refundTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 5. Hotkey Bar */}
      <div className="erp-hotkey-bar">
        <button className="hotkey-btn primary" style={{ background: '#be123c', borderColor: '#9f1239' }} onClick={handleProcessReturn} disabled={isSubmitting}>
          <strong>F2</strong> Process Return & Restock (₹{refundTotal.toFixed(2)})
        </button>
        <button className="hotkey-btn" onClick={() => setReturnItems([])}>
          <strong>F3</strong> Clear Return List
        </button>
        <button className="hotkey-btn" onClick={() => searchInputRef.current?.focus()}>
          <strong>F6</strong> Search Medicine
        </button>
      </div>
    </div>
  )
}
