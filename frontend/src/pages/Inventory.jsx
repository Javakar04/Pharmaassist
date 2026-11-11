import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function Inventory() {
  const [lowStock, setLowStock] = useState([])
  const [expiringSoon, setExpiringSoon] = useState([])
  const [expired, setExpired] = useState([])

  useEffect(() => {
    api.get('/inventory/low-stock').then((res) => setLowStock(res.data)).catch(() => {})
    api.get('/inventory/expiring-soon').then((res) => setExpiringSoon(res.data)).catch(() => {})
    api.get('/inventory/expired').then((res) => setExpired(res.data)).catch(() => {})
  }, [])

  function renderTable(rows, emptyText) {
    if (rows.length === 0) return <p style={{ color: '#6b7280' }}>{emptyText}</p>
    return (
      <table>
        <thead>
          <tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Location</th><th>Expiry</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><Link to={`/medicines/${r.medicine.id}`}>{r.medicine.name}</Link></td>
              <td>{r.batchNumber}</td>
              <td>{r.quantity}</td>
              <td>Rack {r.rack}, Shelf {r.shelf}</td>
              <td>{r.expiryDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div>
      <h2>📦 Inventory</h2>

      <div className="card">
        <h3>⚠️ Low Stock</h3>
        {renderTable(lowStock, 'No low-stock items right now.')}
      </div>

      <div className="card">
        <h3>⏳ Expiring Soon (30 days)</h3>
        {renderTable(expiringSoon, 'Nothing expiring in the next 30 days.')}
      </div>

      <div className="card">
        <h3>🚨 Expired Stock</h3>
        {renderTable(expired, 'No expired stock — good.')}
      </div>
    </div>
  )
}
