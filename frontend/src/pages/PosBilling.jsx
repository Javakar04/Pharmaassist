import { useEffect, useState, useRef } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function PosBilling() {
  const { user } = useAuth()

  // 7 Independent Bill Slots (1 to 7) - Starting completely empty for real transactions!
  const createEmptySlot = (slotId) => ({
    id: slotId,
    items: [],
    customerName: 'Walk-in Customer',
    customerPhone: '9952222292',
    customerCode: `CUST-10${slotId}`,
    doctorName: 'DR K VISHNU PRASANTH M B',
    billType: 'C - CASH BILL',
    discountPerc: 0,
    doctorFees: 0,
    cashTendered: '',
    invoiceNumber: `C01079${120 + slotId}`,
  })

  const [activeTab, setActiveTab] = useState(1)
  const [slots, setSlots] = useState({
    1: createEmptySlot(1),
    2: createEmptySlot(2),
    3: createEmptySlot(3),
    4: createEmptySlot(4),
    5: createEmptySlot(5),
    6: createEmptySlot(6),
    7: createEmptySlot(7),
  })

  // Static / Store Settings
  const [salesRep, setSalesRep] = useState(user?.name || 'Arun')
  const [gstNumber, setGstNumber] = useState('TN-10-20-01376')
  const [stateCode, setStateCode] = useState('33 - Tamil Nadu')

  // Search input & Autocomplete
  const [searchCode, setSearchCode] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRequestId = useRef(0)
  const searchInputRef = useRef(null)

  // Status & Modal State
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdInvoice, setCreatedInvoice] = useState(null)
  const [showSettlementModal, setShowSettlementModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Active Slot References
  const activeSlot = slots[activeTab] || slots[1]
  const billItems = activeSlot.items
  const customerName = activeSlot.customerName
  const customerPhone = activeSlot.customerPhone
  const customerCode = activeSlot.customerCode
  const doctorName = activeSlot.doctorName
  const billType = activeSlot.billType
  const discountPerc = activeSlot.discountPerc
  const doctorFees = activeSlot.doctorFees
  const cashTendered = activeSlot.cashTendered
  const currentInvoiceNo = activeSlot.invoiceNumber

  // Helper to update fields on currently active slot only
  function updateActiveSlot(partial) {
    setSlots((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...partial,
      },
    }))
  }

  // Live autocomplete search when typing
  useEffect(() => {
    const query = searchCode.trim()
    if (!query) {
      setSearchResults([])
      setSelectedIndex(0)
      return
    }

    const reqId = ++searchRequestId.current
    const timer = setTimeout(() => {
      api
        .get(`/medicines/search?q=${encodeURIComponent(query)}`)
        .then((res) => {
          if (reqId === searchRequestId.current) {
            setSearchResults(res.data || [])
            setSelectedIndex(0)
          }
        })
        .catch(() => {
          if (reqId === searchRequestId.current) {
            setSearchResults([])
            setSelectedIndex(0)
          }
        })
    }, 70) // Fast 70ms response without lagging

    return () => clearTimeout(timer)
  }, [searchCode])

  // Calculations for Active Slot
  const totalItemsCount = billItems.length
  const totalQuantity = billItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)
  const totalBase = billItems.reduce((acc, i) => acc + (Number(i.base) || 0), 0)
  const totalCgst = billItems.reduce((acc, i) => acc + (Number(i.cgst) || 0), 0)
  const totalSgst = billItems.reduce((acc, i) => acc + (Number(i.sgst) || 0), 0)
  const totalGst = billItems.reduce((acc, i) => acc + (Number(i.gst) || 0), 0)
  const rawTotal = billItems.reduce((acc, i) => acc + (Number(i.amount) || 0), 0)

  const discountAmount = (rawTotal * (Number(discountPerc) || 0)) / 100
  const finalPreRound = rawTotal - discountAmount
  const roundedNetTotal = Math.round(finalPreRound * 100) / 100
  const roundoffValue = parseFloat((Math.round(roundedNetTotal) - roundedNetTotal).toFixed(2))
  const netPayable = Math.round(roundedNetTotal)

  // Computed Change to return to customer
  const numericPaid = parseFloat(cashTendered) || 0
  const changeRefund = numericPaid >= netPayable ? parseFloat((numericPaid - netPayable).toFixed(2)) : 0
  const shortageDue = numericPaid > 0 && numericPaid < netPayable ? parseFloat((netPayable - numericPaid).toFixed(2)) : 0

  // Hotkey listener (F2 / F4 / F12 to open settlement or save bill)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'F4' || e.key === 'F12' || e.key === 'F2') {
        e.preventDefault()
        if (billItems.length === 0) {
          alert('Please add medicines before processing bill.')
          return
        }
        setShowSettlementModal(true)
      } else if (e.key === 'F3') {
        e.preventDefault()
        updateActiveSlot({ items: [], cashTendered: '' })
      } else if (e.key === 'F6') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [billItems, activeTab])

  // Keyboard navigation inside search dropdown
  function handleSearchKeyDown(e) {
    if (searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % searchResults.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (searchResults[selectedIndex]) {
          handleSelectMedicine(searchResults[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        setSearchResults([])
      }
    }
  }

  function handleSelectMedicine(med) {
    if (!med.firstBatch || med.stock <= 0) {
      alert(`⚠️ ${med.name} is currently out of stock (Stock: 0).`)
      return
    }

    const batch = med.firstBatch
    const rate = batch.salePrice || batch.mrp || 10
    const qty = 1
    const base = parseFloat(((rate * qty) / 1.05).toFixed(2))
    const totalGst = parseFloat((rate * qty - base).toFixed(2))
    const cgst = parseFloat((totalGst / 2).toFixed(2))
    const sgst = parseFloat((totalGst / 2).toFixed(2))

    const newItem = {
      id: Date.now() + Math.random(),
      medicineId: med.id,
      productName: med.name,
      quantity: qty,
      batch: batch.batchNumber,
      rate: rate,
      mrp: batch.mrp,
      expiryDate: (batch.expiryDate || '').substring(2, 7).replace('-', '/'),
      subLoc: `${batch.rack || 'A1'} / ${batch.shelf || '1'}`,
      sgst: sgst,
      cgst: cgst,
      gst: totalGst,
      base: base,
      amount: parseFloat((rate * qty).toFixed(2)),
      hsnCode: med.hsnCode || '30049099',
      mfr: batch.mfr || med.manufacturer?.substring(0, 4)?.toUpperCase() || 'GEN',
      inventoryId: batch.id,
      maxAvailable: batch.quantity,
    }

    updateActiveSlot({ items: [...billItems, newItem] })
    setSearchCode('')
    setSearchResults([])
    setErrorMsg('')
    if (searchInputRef.current) searchInputRef.current.focus()
  }

  function handleQuantityChange(index, newQty) {
    if (newQty <= 0) {
      updateActiveSlot({ items: billItems.filter((_, i) => i !== index) })
      return
    }
    const item = billItems[index]
    if (item.maxAvailable && newQty > item.maxAvailable) {
      alert(`Cannot add ${newQty}. Only ${item.maxAvailable} available in batch ${item.batch}.`)
      return
    }
    const updated = [...billItems]
    const amount = parseFloat((item.rate * newQty).toFixed(2))
    const base = parseFloat((amount / 1.05).toFixed(2))
    const gst = parseFloat((amount - base).toFixed(2))
    const cgst = parseFloat((gst / 2).toFixed(2))
    const sgst = parseFloat((gst / 2).toFixed(2))

    updated[index] = {
      ...item,
      quantity: newQty,
      amount: amount,
      base: base,
      gst: gst,
      cgst: cgst,
      sgst: sgst,
    }
    updateActiveSlot({ items: updated })
  }

  // Complete & finalize the invoice transaction for the active slot
  async function handleConfirmPayment() {
    if (billItems.length === 0) {
      setErrorMsg('Cannot generate an empty bill. Please add medicines first.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const paymentMethod = billType.includes('UPI')
        ? 'UPI'
        : billType.includes('CARD')
        ? 'CARD'
        : billType.includes('CREDIT')
        ? 'CREDIT'
        : 'CASH'
      const paid = numericPaid > 0 ? numericPaid : netPayable
      const refund = Math.max(0, parseFloat((paid - netPayable).toFixed(2)))

      const payload = {
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '9952222292',
        doctorName: doctorName || 'DR K VISHNU PRASANTH M B',
        prescriptionRef: 'RX-' + Math.floor(Math.random() * 8999 + 1000),
        paymentMethod: paymentMethod,
        discountPercentage: Number(discountPerc) || 0,
        taxPercentage: 5.0,
        amountPaid: paid,
        changeRefund: refund,
        items: billItems.map((item) => ({
          medicineId: item.medicineId,
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          unitPrice: item.rate,
        })),
      }

      const res = await api.post('/invoices', payload)
      setCreatedInvoice(res.data)
      setShowSettlementModal(false)
      setShowReceiptModal(true)

      // Reset ONLY the current slot for next transaction, leaving other 6 slots untouched!
      setSlots((prev) => ({
        ...prev,
        [activeTab]: {
          ...createEmptySlot(activeTab),
          invoiceNumber: `C01079${Math.floor(100 + Math.random() * 899)}`,
        },
      }))
      setSearchCode('')
      setSearchResults([])
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message
      setErrorMsg(`Billing Error: ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Real-World Pharmacy ERP Screen Container - Full Screen Edge-to-Edge */}
      <div className="pos-screen-container">
        {/* Active Retail Bill Bar (Photo 3) */}
        <div className="erp-bill-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div className="erp-bill-title">Retail Bill</div>
              <div style={{ fontSize: 11.5, color: '#475569', fontWeight: 600 }}>
                Bill No : <span style={{ color: '#0f172a' }}>{currentInvoiceNo}</span>
              </div>
            </div>

            {/* 7 Independent Bill Tabs [1] [2] [3] ... [7] with active badges */}
            <div className="erp-bill-tabs">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const slotItemCount = slots[num]?.items?.length || 0
                return (
                  <div
                    key={num}
                    className={`bill-tab-circle ${activeTab === num ? 'active' : ''} ${
                      slotItemCount > 0 ? 'has-items' : ''
                    }`}
                    onClick={() => {
                      setActiveTab(num)
                      setSearchCode('')
                      setSearchResults([])
                      setErrorMsg('')
                      if (searchInputRef.current) searchInputRef.current.focus()
                    }}
                    title={`Slot ${num}: ${slotItemCount} item(s) in progress`}
                  >
                    <span>{num}</span>
                    {slotItemCount > 0 && <span className="tab-item-badge">{slotItemCount}</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* TOP RIGHT CORNER: FUNCTION ACTION BUTTONS & BILL TOTAL PILL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="hotkey-btn primary"
              style={{ background: '#16a34a', borderColor: '#15803d', padding: '6px 14px', fontSize: 12.5, fontWeight: 800, color: 'white' }}
              onClick={() => setShowSettlementModal(true)}
              disabled={billItems.length === 0}
              title="Process and Settle Bill (F12)"
            >
              F12 Settle (₹{netPayable.toFixed(2)})
            </button>
            <button
              className="hotkey-btn"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={() => updateActiveSlot({ items: [], cashTendered: '' })}
              title="Clear Active Bill Slot (F3)"
            >
              F3 Clear
            </button>
            <button
              className="hotkey-btn"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={() => {
                updateActiveSlot({ billType: 'U - UPI BILL' })
                setShowSettlementModal(true)
              }}
              title="Settle with UPI (F4)"
            >
              F4 UPI
            </button>
            <button
              className="hotkey-btn"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={() => searchInputRef.current?.focus()}
              title="Focus Search Input (F6)"
            >
              F6 Search
            </button>

            {/* Net Amount Display Pill */}
            <div className="erp-net-display-pill" style={{ marginLeft: 6 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>BILL TOTAL</span>
              <span className="amount">₹ {netPayable.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 3. Main Data Table (Flexible middle scroll area) */}
        <div className="pos-table-scroll-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: 35, textAlign: 'center' }}>#</th>
                <th style={{ minWidth: 320, textAlign: 'center' }}>Product Name</th>
                <th style={{ width: 105, textAlign: 'center' }}>Quantity</th>
                <th style={{ width: 85 }}>Batch</th>
                <th style={{ width: 65, textAlign: 'right' }}>Rate</th>
                <th style={{ width: 65, textAlign: 'right' }}>MRP</th>
                <th style={{ width: 80 }}>ExpiryDate</th>
                <th style={{ width: 110 }}>Sub Loc</th>
                <th style={{ width: 55, textAlign: 'right' }}>SGST</th>
                <th style={{ width: 55, textAlign: 'right' }}>CGST</th>
                <th style={{ width: 55, textAlign: 'right' }}>GST</th>
                <th style={{ width: 70, textAlign: 'right' }}>Base</th>
                <th style={{ width: 75, textAlign: 'right' }}>Amount</th>
                <th style={{ width: 95 }}>HSN Code</th>
                <th style={{ width: 40, textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="qty-control-wrapper">
                      <button
                        type="button"
                        className="qty-btn minus"
                        onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                        title="Decrease quantity (-)"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 0)}
                        className="qty-input-manual"
                        title="Type quantity manually or click + / −"
                      />
                      <button
                        type="button"
                        className="qty-btn plus"
                        onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                        title="Increase quantity (+)"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td style={{ color: '#0369a1', fontWeight: 600 }}>{item.batch}</td>
                  <td style={{ textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{item.mrp.toFixed(2)}</td>
                  <td style={{ color: '#b45309', fontWeight: 500 }}>{item.expiryDate}</td>
                  <td>
                    <span className="badge neutral" style={{ fontSize: 10 }}>
                      {item.subLoc}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{item.sgst.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{item.cgst.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>{item.gst.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{item.base.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {item.amount.toFixed(2)}
                  </td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>{item.hsnCode}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-danger btn-sm"
                      style={{ padding: '2px 6px', fontSize: 11 }}
                      onClick={() => updateActiveSlot({ items: billItems.filter((_, i) => i !== idx) })}
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}

              {/* Active Prompt Row (Product Name centered, 1st in autocomplete list) */}
              <tr className="active-entry-row">
                <td style={{ textAlign: 'center', fontWeight: 800, color: '#ea580c' }}>
                  {billItems.length + 1}
                </td>
                <td style={{ padding: '4px 6px', position: 'relative' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Type Product Name / Code (e.g. NEU, MOX, 74415, AVIL)..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    style={{
                      width: '100%',
                      padding: '7px 12px',
                      border: '2px solid #ea580c',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 700,
                      background: '#fff7ed',
                      outline: 'none',
                      textAlign: 'center',
                    }}
                  />

                  {/* Autocomplete Dropdown Popup - Product Name is 1st in list */}
                  {searchResults.length > 0 && (
                    <div className="erp-lookup-popup" style={{ minWidth: 620, left: 0 }}>
                      <div className="erp-lookup-header">
                        <span>Product Name</span>
                        <span style={{ textAlign: 'center' }}>P_code</span>
                        <span>Rack / Shelf</span>
                        <span style={{ textAlign: 'center' }}>Stock</span>
                        <span style={{ textAlign: 'right' }}>MRP</span>
                      </div>
                      {searchResults.map((m, idx) => (
                        <div
                          key={m.id}
                          className={`erp-lookup-row ${idx === selectedIndex ? 'selected' : ''}`}
                          style={{
                            background: idx === selectedIndex ? '#eff6ff' : 'white',
                            borderLeft: idx === selectedIndex ? '4px solid #0284c7' : '4px solid transparent',
                          }}
                          onClick={() => handleSelectMedicine(m)}
                        >
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {m.genericName} • {m.dosageForm}
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, color: '#0369a1', textAlign: 'center' }}>{m.id}</span>
                          <span>{m.firstBatch ? `${m.firstBatch.rack} / ${m.firstBatch.shelf}` : '-'}</span>
                          <span style={{ textAlign: 'center' }}>
                            <span className={`badge ${m.stock > 0 ? 'success' : 'danger'}`} style={{ fontWeight: 800 }}>
                              {m.stock}
                            </span>
                          </span>
                          <span style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{m.firstBatch?.mrp ? m.firstBatch.mrp.toFixed(2) : '0.00'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
                <td style={{ color: '#94a3b8' }}>-</td>
                <td style={{ textAlign: 'right', color: '#94a3b8' }}>0.00</td>
                <td style={{ textAlign: 'right', color: '#94a3b8' }}>0.00</td>
                <td style={{ color: '#94a3b8' }}>-</td>
                <td style={{ color: '#94a3b8' }}>-</td>
                <td style={{ textAlign: 'right', color: '#94a3b8' }}>0.00</td>
                <td style={{ textAlign: 'right', color: '#94a3b8' }}>0.00</td>
                <td style={{ textAlign: 'right', color: '#94a3b8' }}>0.00</td>
                <td style={{ textAlign: 'right', color: '#94a3b8' }}>0.00</td>
                <td style={{ textAlign: 'right', color: '#94a3b8' }}>0.00</td>
                <td style={{ color: '#94a3b8' }}>-</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4 & 5. DOCKED FOOTER (Totals, Compact Customer Details, Function Hotkeys) */}
        <footer className="erp-pos-footer">
          {/* Totals Line */}
          <div className="erp-totals-bar">
            <span>
              Total Items: <strong style={{ color: '#0284c7' }}>{totalItemsCount}</strong>
            </span>
            <span>
              Qty: <strong>{totalQuantity}</strong>
            </span>
            <span>
              SGST: <strong>{totalSgst.toFixed(2)}</strong>
            </span>
            <span>
              CGST: <strong>{totalCgst.toFixed(2)}</strong>
            </span>
            <span>
              GST: <strong>{totalGst.toFixed(2)}</strong>
            </span>
            <span>
              Base: <strong>{totalBase.toFixed(2)}</strong>
            </span>
            <span>
              Amount: <strong style={{ fontSize: 14, color: '#0f766e' }}>₹ {rawTotal.toFixed(2)}</strong>
            </span>
          </div>

          {/* Compact Bottom Info Panel (Photo 3 Details Collecting Section - Slim & Sleek) */}
          <div className="erp-bottom-panel compact">
            {/* Column 1: Customer & Doctor */}
            <div className="erp-box-section compact">
              <div className="erp-field-inline compact">
                <label>Customer:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => updateActiveSlot({ customerName: e.target.value })}
                />
              </div>
              <div className="erp-field-inline compact">
                <label>Doctor:</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => updateActiveSlot({ doctorName: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: 6 }}>
                <div className="erp-field-inline compact">
                  <label>Code:</label>
                  <input
                    type="text"
                    value={customerCode}
                    onChange={(e) => updateActiveSlot({ customerCode: e.target.value })}
                  />
                </div>
                <div className="erp-field-inline compact">
                  <label>Phone:</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => updateActiveSlot({ customerPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Bill Parameters & Payment Types */}
            <div className="erp-box-section compact">
              <div className="erp-field-inline compact">
                <label>Bill Type:</label>
                <select
                  value={billType}
                  onChange={(e) => updateActiveSlot({ billType: e.target.value })}
                >
                  <option value="C - CASH BILL">C - CASH BILL</option>
                  <option value="U - UPI BILL">U - UPI BILL</option>
                  <option value="D - CARD BILL">D - CARD BILL</option>
                  <option value="R - CREDIT BILL">R - CREDIT BILL</option>
                </select>
              </div>
              <div className="erp-field-inline compact">
                <label>Disc %:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPerc}
                  onChange={(e) => updateActiveSlot({ discountPerc: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="erp-field-inline compact">
                <label>GST No:</label>
                <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
              </div>
              <div className="erp-field-inline compact">
                <label>State:</label>
                <input type="text" value={stateCode} onChange={(e) => setStateCode(e.target.value)} />
              </div>
            </div>

            {/* Column 3: Compact Settlement Summary */}
            <div className="erp-box-section compact" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 11.5, color: '#166534' }}>
                  Summary [Slot {activeTab}]
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Base: ₹{totalBase.toFixed(2)} + GST: ₹{totalGst.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #bbf7d0', paddingTop: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 12 }}>NET TOTAL:</span>
                <span style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>
                  ₹ {netPayable.toFixed(2)}
                </span>
              </div>

              {/* Compact Cash Given & Change Refund */}
              <div style={{ marginTop: 4, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>CASH (₹):</label>
                  <input
                    type="number"
                    placeholder={`₹${netPayable}`}
                    value={cashTendered}
                    onChange={(e) => updateActiveSlot({ cashTendered: e.target.value })}
                    style={{
                      width: 75,
                      padding: '2px 5px',
                      fontSize: 12,
                      fontWeight: 800,
                      textAlign: 'right',
                      border: '1.5px solid #0284c7',
                      borderRadius: 3,
                    }}
                  />
                </div>

                {numericPaid >= netPayable && numericPaid > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, paddingTop: 3, borderTop: '1px dashed #16a34a' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d' }}>REFUND:</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#15803d' }}>₹ {changeRefund.toFixed(2)}</span>
                  </div>
                ) : shortageDue > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, paddingTop: 3, borderTop: '1px dashed #dc2626' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#dc2626' }}>DUE:</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626' }}>- ₹ {shortageDue.toFixed(2)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* 7. PAYMENT SETTLEMENT & CHANGE REFUND MODAL */}
      {showSettlementModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>
                💳 Payment Settlement & Change Return [Slot {activeTab}]
              </h3>
              <button className="btn-secondary btn-sm" onClick={() => setShowSettlementModal(false)}>
                ✕
              </button>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>Total Bill Amount:</span>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>
                  ₹ {netPayable.toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Customer: <strong>{customerName}</strong> ({customerPhone})
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#334155',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Select Payment Mode:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {['CASH', 'UPI', 'CARD', 'CREDIT'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`btn ${billType.includes(mode) ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 4px', fontSize: 12, fontWeight: 700 }}
                    onClick={() => {
                      const newType =
                        mode === 'CASH'
                          ? 'C - CASH BILL'
                          : mode === 'UPI'
                          ? 'U - UPI BILL'
                          : mode === 'CARD'
                          ? 'D - CARD BILL'
                          : 'R - CREDIT BILL'
                      updateActiveSlot({
                        billType: newType,
                        cashTendered: mode !== 'CASH' ? netPayable.toString() : cashTendered,
                      })
                    }}
                  >
                    {mode === 'CASH'
                      ? '💵 Cash'
                      : mode === 'UPI'
                      ? '📱 UPI'
                      : mode === 'CARD'
                      ? '💳 Card'
                      : '📝 Credit'}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Received & Quick Note Buttons */}
            {billType.includes('CASH') && (
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#334155',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Cash Received from Customer (₹):
                </label>
                <input
                  type="number"
                  autoFocus
                  placeholder={`Enter amount (e.g. ${netPayable}, 100, 500)`}
                  value={cashTendered}
                  onChange={(e) => updateActiveSlot({ cashTendered: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 18,
                    fontWeight: 800,
                    border: '2px solid #0284c7',
                    borderRadius: 8,
                    outline: 'none',
                  }}
                />

                {/* Quick Cash Note Buttons */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => updateActiveSlot({ cashTendered: netPayable.toString() })}
                  >
                    Exact: ₹{netPayable}
                  </button>
                  {[100, 200, 500, 2000]
                    .filter((val) => val >= netPayable)
                    .map((val) => (
                      <button
                        key={val}
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => updateActiveSlot({ cashTendered: val.toString() })}
                      >
                        ₹{val}
                      </button>
                    ))}
                </div>

                {/* Live Change Refund Banner */}
                {numericPaid >= netPayable ? (
                  <div
                    style={{
                      marginTop: 14,
                      background: '#dcfce7',
                      border: '2px solid #22c55e',
                      borderRadius: 8,
                      padding: '12px 16px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#166534',
                        textTransform: 'uppercase',
                      }}
                    >
                      💵 Change / Refund to Customer:
                    </div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        color: '#15803d',
                        marginTop: 2,
                      }}
                    >
                      ₹ {changeRefund.toFixed(2)}
                    </div>
                  </div>
                ) : shortageDue > 0 ? (
                  <div
                    style={{
                      marginTop: 14,
                      background: '#fee2e2',
                      border: '1px solid #ef4444',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: '#b91c1c',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ⚠️ Shortage: Customer still owes ₹ {shortageDue.toFixed(2)}
                  </div>
                ) : null}
              </div>
            )}

            {/* Confirm Checkout Action */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                className="btn-success"
                style={{ flex: 1, padding: 13, fontSize: 15, fontWeight: 800 }}
                onClick={handleConfirmPayment}
                disabled={isSubmitting || shortageDue > 0}
              >
                {isSubmitting
                  ? 'Finalizing Bill...'
                  : `✅ Confirm & Print Bill (Refund ₹${changeRefund.toFixed(2)})`}
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: 13 }}
                onClick={() => setShowSettlementModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PRINTABLE CASH BILL RECEIPT MODAL (Matching Photo 1 with Paid & Refund Change) */}
      {showReceiptModal && createdInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header no-print">
              <h3 style={{ margin: 0, fontSize: 16 }}>🖨️ Retail Cash Bill Ready</h3>
              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  setShowReceiptModal(false)
                  setCreatedInvoice(null)
                }}
              >
                ✕ Close
              </button>
            </div>

            <div className="real-receipt-paper">
              <div className="real-receipt-header">
                <div className="real-receipt-storename">THIRUMURUGAN MEDICALS</div>
                <div className="real-receipt-meta" style={{ marginTop: 4 }}>
                  No.3/60, Sinthu Nagar, Poorandampalayam (Post), Sulthanpet(Via)
                  <br />
                  Sulur Taluk, Coimbatore District - 641669
                  <br />
                  DL NO: TN-10-20-01376 & TN-10-21-01376
                  <br />
                  MOBILE: 9952222292
                </div>
              </div>

              <div className="real-receipt-divider"></div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <span>C A S H  B i l l : {createdInvoice.invoiceNumber}</span>
                <span>
                  Date: {new Date(createdInvoice.createdAt).toLocaleDateString()}{' '}
                  {new Date(createdInvoice.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div style={{ fontSize: 11, marginTop: 4 }}>
                <div>Dr. : {createdInvoice.doctorName}</div>
                <div>Name: {createdInvoice.customerName}</div>
              </div>

              <div className="real-receipt-divider"></div>

              {/* Line items table */}
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
                  {createdInvoice.items?.map((it, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ fontWeight: 600 }}>{it.medicineName}</td>
                      <td>{it.mfr || 'GEN'}</td>
                      <td>{it.batchNumber}</td>
                      <td>{it.expiryDate || '12/28'}</td>
                      <td style={{ textAlign: 'right' }}>{it.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="real-receipt-divider"></div>

              {/* Tax & Value Breakdown */}
              <div style={{ fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    CGST VALUE:{' '}
                    {createdInvoice.cgstAmount
                      ? createdInvoice.cgstAmount.toFixed(2)
                      : (createdInvoice.taxAmount / 2).toFixed(2)}
                  </span>
                  <span>
                    Base Value:{' '}
                    {createdInvoice.baseValue
                      ? createdInvoice.baseValue.toFixed(2)
                      : createdInvoice.totalAmount.toFixed(2)}
                  </span>
                  <span>
                    Total: {(createdInvoice.baseValue + createdInvoice.taxAmount).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span>
                    SGST VALUE:{' '}
                    {createdInvoice.sgstAmount
                      ? createdInvoice.sgstAmount.toFixed(2)
                      : (createdInvoice.taxAmount / 2).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span>Total Items: {createdInvoice.items?.length || 1}</span>
                  <span>
                    Qty:{' '}
                    {createdInvoice.totalQty ||
                      createdInvoice.items?.reduce((a, c) => a + c.quantity, 0)}
                  </span>
                  <span>
                    Rnd:{' '}
                    {createdInvoice.roundoffValue !== undefined
                      ? createdInvoice.roundoffValue.toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>

              <div className="real-receipt-divider"></div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 0',
                }}
              >
                <span>E. & O.E.</span>
                <span>Rounded Off to Rs.</span>
                <span style={{ fontSize: 16, fontWeight: 900 }}>
                  {createdInvoice.netPayable.toFixed(2)}
                </span>
              </div>

              {/* Exact Amount Paid & Change Refund Printed on Bill */}
              <div
                style={{
                  borderTop: '1px dashed #000',
                  paddingTop: 4,
                  marginTop: 4,
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CASH RECEIVED:</span>
                  <span>
                    Rs.{' '}
                    {createdInvoice.amountPaid
                      ? createdInvoice.amountPaid.toFixed(2)
                      : createdInvoice.netPayable.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 2,
                    color: '#000000',
                  }}
                >
                  <span>CHANGE REFUND:</span>
                  <span style={{ fontWeight: 900 }}>
                    Rs.{' '}
                    {createdInvoice.changeRefund
                      ? createdInvoice.changeRefund.toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>

              <div className="real-receipt-divider"></div>

              <div style={{ textAlign: 'center', marginTop: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 11.5 }}>Wish You A Speedy Recovery</div>
                <div style={{ fontSize: 10.5, marginTop: 3, textAlign: 'right' }}>
                  .for THIRUMURUGAN MEDICALS
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="no-print" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: 11, fontSize: 14 }}
                onClick={() => window.print()}
              >
                🖨️ Print Cash Bill
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: 11, fontSize: 14 }}
                onClick={() => {
                  setShowReceiptModal(false)
                  setCreatedInvoice(null)
                }}
              >
                ➕ Next Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
