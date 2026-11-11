import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'

export default function MedicineDetail() {
  const { id } = useParams()
  const [medicine, setMedicine] = useState(null)
  const [uses, setUses] = useState([])
  const [similar, setSimilar] = useState([])
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/medicines/${id}`),
      api.get(`/medicines/${id}/uses`),
      api.get(`/medicines/${id}/similar`),
      api.get(`/inventory/medicine/${id}/location`),
    ])
      .then(([medRes, usesRes, similarRes, locRes]) => {
        setMedicine(medRes.data)
        setUses(usesRes.data)
        setSimilar(similarRes.data)
        setLocation(locRes.data)
      })
      .catch(() => setError('Could not load medicine details.'))
  }, [id])

  if (error) return <div className="card error-text">{error}</div>
  if (!medicine) return <p>Loading…</p>

  return (
    <div>
      <h2>{medicine.name}</h2>

      <div className="card">
        <h3>Medicine Overview</h3>
        <table>
          <tbody>
            <tr><th>Generic Name</th><td>{medicine.genericName}</td></tr>
            <tr><th>Active Ingredient</th><td>{medicine.activeIngredient}</td></tr>
            <tr><th>Category</th><td>{medicine.category}</td></tr>
            <tr><th>Dosage Form</th><td>{medicine.dosageForm}</td></tr>
            <tr><th>Strength</th><td>{medicine.strength}</td></tr>
            <tr><th>Manufacturer</th><td>{medicine.manufacturer}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Common Uses</h3>
        {uses.length === 0 && <p style={{ color: '#6b7280' }}>No verified uses recorded yet.</p>}
        <ul>
          {uses.map((u) => (
            <li key={u.id}><strong>{u.useCategory}:</strong> {u.description}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Important Information</h3>
        <p>{medicine.storageInformation}</p>
      </div>

      {location && (
        <div className="card">
          <h3>📍 Stock & Location</h3>
          <p>
            <strong>Available:</strong>{' '}
            <span className={`badge ${location.available ? 'success' : 'danger'}`}>
              {location.available ? 'Yes' : 'No'}
            </span>
          </p>
          <p><strong>Quantity:</strong> {location.quantity}</p>
          <p><strong>Location:</strong> Rack {location.rack}, Shelf {location.shelf}</p>
          {location.expiryDate && <p><strong>Expiry:</strong> {location.expiryDate}</p>}
        </div>
      )}

      {similar.length > 0 && (
        <div className="card">
          <h3>Same Active Ingredient</h3>
          <ul>
            {similar.map((m) => (
              <li key={m.id}>{m.name} ({m.manufacturer})</li>
            ))}
          </ul>
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            These products share the same active ingredient. Substitution should
            follow pharmacy policy and pharmacist/doctor authorization.
          </p>
        </div>
      )}
    </div>
  )
}
