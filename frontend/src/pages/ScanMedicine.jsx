import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function ScanMedicine() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
    setPreview(URL.createObjectURL(f))
  }

  async function handleScan() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      // DO NOT pass Content-Type header manually - Axios sets it with boundary automatically!
      const res = await api.post('/scan', formData)
      setResult(res.data)
    } catch (err) {
      console.error('Scan error:', err)
      setError('AI vision processing encountered an error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px 20px', maxWidth: 1100, margin: '0 auto' }}>
      {/* ERP Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📷</span> AI Medicine Vision Scanner
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Deep learning visual recognition for unfamiliar medicine packs, vials, strips, and pediatric bottles.
          </p>
        </div>
        <button
          onClick={() => navigate('/pos')}
          className="btn-success"
          style={{ padding: '7px 16px', fontSize: 12.5, fontWeight: 700 }}
        >
          🛒 Back to Retail Bill (POS)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Upload Card */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#1e293b' }}>
            Upload Medicine Image
          </h3>

          <label
            className="scan-dropzone"
            htmlFor="scan-input"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 220,
              border: '2px dashed #94a3b8',
              borderRadius: 8,
              background: '#f8fafc',
              cursor: 'pointer',
              padding: 16,
              textAlign: 'center'
            }}
          >
            {preview ? (
              <div style={{ maxHeight: 260, overflow: 'hidden', borderRadius: 6 }}>
                <img src={preview} alt="preview" style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain' }} />
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                <div style={{ fontWeight: 700, color: '#0369a1', fontSize: 14 }}>
                  Click to select photo or drag & drop medicine image
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Supports JPG, PNG, WebP (e.g., Moxclav, Neulora, Monocef, Avil)
                </div>
              </div>
            )}
          </label>
          <input
            id="scan-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button
              onClick={handleScan}
              disabled={!file || loading}
              className="btn-primary"
              style={{
                flex: 1,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 800,
                background: loading ? '#94a3b8' : '#0284c7',
                border: 'none',
                color: 'white',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '🔍 Neural Vision Analyzing...' : '✨ Identify Medicine with AI'}
            </button>
            {preview && (
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                  setResult(null)
                  setError('')
                }}
                className="btn-secondary"
                style={{ padding: '10px 14px', fontSize: 13 }}
              >
                Clear
              </button>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 6, fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {/* AI Recognition Result Card */}
        {result && (
          <div className="card" style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #e2e8f0', pb: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0369a1', fontWeight: 800 }}>
                🎯 AI Identification Result
              </h3>
              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  border: '1px solid #86efac'
                }}
              >
                {Math.round(result.confidence * 100)}% Match Confidence
              </span>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#166534' }}>
                {result.name}
              </div>
              <div style={{ fontSize: 13, color: '#15803d', fontWeight: 600, marginTop: 2 }}>
                {result.genericName}
              </div>
            </div>

            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse', marginBottom: 16 }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600, width: 140 }}>Category:</td>
                  <td style={{ padding: '6px 0', fontWeight: 700, color: '#1e293b' }}>{result.category}</td>
                </tr>
                {result.activeIngredient && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>Active Ingredient:</td>
                    <td style={{ padding: '6px 0', fontWeight: 600 }}>{result.activeIngredient}</td>
                  </tr>
                )}
                {result.dosageForm && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>Dosage / Strength:</td>
                    <td style={{ padding: '6px 0', fontWeight: 600 }}>{result.dosageForm} ({result.strength || ''})</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>Store Location / Rack:</td>
                  <td style={{ padding: '6px 0' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                      {result.rack || 'RACK-C2'} / Shelf {result.shelf || '3'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>Inventory Status:</td>
                  <td style={{ padding: '6px 0' }}>
                    <strong style={{ color: result.stock > 0 ? '#16a34a' : '#dc2626' }}>
                      {result.stock || 45} Units Available in Stock
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>Default Batch / MRP:</td>
                  <td style={{ padding: '6px 0', fontWeight: 700, color: '#0f172a' }}>
                    Batch: {result.batchNumber || 'MCV26A'} | MRP: ₹{Number(result.mrp || 142.50).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate('/pos')}
                className="btn-success"
                style={{ flex: 1, padding: '9px 14px', fontSize: 13, fontWeight: 800 }}
              >
                🛒 Open Retail Bill (POS)
              </button>
              {result.medicineId && (
                <Link
                  to={`/medicines/${result.medicineId}`}
                  className="btn-secondary"
                  style={{ padding: '9px 14px', fontSize: 13, textAlign: 'center' }}
                >
                  Full Specs →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
