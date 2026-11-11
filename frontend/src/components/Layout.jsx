import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Track active open dropdown menu
  const [openMenu, setOpenMenu] = useState(null)
  const navRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on navigation
  useEffect(() => {
    setOpenMenu(null)
  }, [location.pathname])

  // Determine active screen title for the ERP window header
  function getScreenTitle() {
    const p = location.pathname
    if (p === '/pos') return 'Retail Bill - 1'
    if (p === '/bills') return 'Bill Copies (Sales Register)'
    if (p === '/returns') return 'Sales Return Counter'
    if (p === '/purchase') return 'Purchase & Order Management'
    if (p === '/accounts') return 'Accounts & User Management'
    if (p === '/inventory') return 'Stock & Inventory Maintenance'
    if (p === '/scan') return 'AI Medicine Vision Scanner'
    return 'Main Operations Dashboard'
  }

  const isSalesActive = ['/pos', '/bills', '/returns', '/sales'].includes(location.pathname)
  const isPurchaseActive = location.pathname.startsWith('/purchase')
  const isAccountsActive = location.pathname.startsWith('/accounts')
  const isMaintenanceActive = location.pathname.startsWith('/inventory') || location.pathname.startsWith('/medicines')
  const isReportsActive = location.pathname === '/' || location.pathname === '/scan'

  return (
    <div className="erp-desktop-window">
      {/* 1. TOP GLOBAL BLUE ERP MENUBAR (Company in Middle, Navigation on Left, Buttons on Top Right) */}
      <header className="erp-global-header" ref={navRef}>
        {/* Left: ERP Menu Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, zIndex: 10 }}>
          <nav className="erp-top-nav">
            {/* 1. SALES DROPDOWN */}
            <div className="erp-nav-item">
              <button
                type="button"
                className={`erp-nav-btn ${isSalesActive ? 'active' : ''}`}
                onClick={() => setOpenMenu(openMenu === 'sales' ? null : 'sales')}
              >
                Sales ▾
              </button>
              {openMenu === 'sales' && (
                <div className="erp-menu-dropdown">
                  <NavLink to="/pos" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    🛒 Retail Bill (POS)
                  </NavLink>
                  <NavLink to="/bills" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    📑 Bill Copies (Ledger)
                  </NavLink>
                  <NavLink to="/returns" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    🔄 Sales Return
                  </NavLink>
                </div>
              )}
            </div>

            {/* 2. PURCHASE DROPDOWN */}
            <div className="erp-nav-item">
              <button
                type="button"
                className={`erp-nav-btn ${isPurchaseActive ? 'active' : ''}`}
                onClick={() => setOpenMenu(openMenu === 'purchase' ? null : 'purchase')}
              >
                Purchase ▾
              </button>
              {openMenu === 'purchase' && (
                <div className="erp-menu-dropdown">
                  <NavLink to="/purchase" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    📋 Medicines Need to be Ordered (Reorder Indent)
                  </NavLink>
                  <NavLink to="/purchase?tab=history" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    📜 Last Purchase History (Vendor Register)
                  </NavLink>
                </div>
              )}
            </div>

            {/* 3. ACCOUNTS DROPDOWN */}
            <div className="erp-nav-item">
              <button
                type="button"
                className={`erp-nav-btn ${isAccountsActive ? 'active' : ''}`}
                onClick={() => setOpenMenu(openMenu === 'accounts' ? null : 'accounts')}
              >
                Accounts ▾
              </button>
              {openMenu === 'accounts' && (
                <div className="erp-menu-dropdown">
                  <NavLink to="/accounts" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    👥 User Management & Staff Operators
                  </NavLink>
                </div>
              )}
            </div>

            {/* 4. REPORTS / DASHBOARD */}
            <div className="erp-nav-item">
              <button
                type="button"
                className={`erp-nav-btn ${isReportsActive ? 'active' : ''}`}
                onClick={() => setOpenMenu(openMenu === 'reports' ? null : 'reports')}
              >
                Reports ▾
              </button>
              {openMenu === 'reports' && (
                <div className="erp-menu-dropdown">
                  <NavLink to="/" end className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    📊 Financial & Sales Dashboard
                  </NavLink>
                  <NavLink to="/scan" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    📷 AI Medicine Scanner
                  </NavLink>
                </div>
              )}
            </div>

            {/* 5. MAINTENANCE DROPDOWN */}
            <div className="erp-nav-item">
              <button
                type="button"
                className={`erp-nav-btn ${isMaintenanceActive ? 'active' : ''}`}
                onClick={() => setOpenMenu(openMenu === 'maintenance' ? null : 'maintenance')}
              >
                Maintenance ▾
              </button>
              {openMenu === 'maintenance' && (
                <div className="erp-menu-dropdown">
                  <NavLink to="/inventory" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    📦 Stock & Quantity Maintenance
                  </NavLink>
                  <NavLink to="/inventory?filter=mostly_used" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    🔥 Mostly Used Medicines
                  </NavLink>
                  <NavLink to="/inventory?filter=expiring_soon" className="erp-menu-dropdown-link" onClick={() => setOpenMenu(null)}>
                    ⚠️ Medicines Going to Expiry
                  </NavLink>
                </div>
              )}
            </div>

            {/* 6. ORDER MGMT */}
            <NavLink to="/purchase" className={`erp-nav-link ${isPurchaseActive ? 'active' : ''}`}>
              Order Mgmt
            </NavLink>
          </nav>
        </div>

        {/* Center: COMPANY NAME EXACTLY AT THE MIDDLE */}
        <div
          onClick={() => navigate('/')}
          className="erp-header-center-brand"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap'
          }}
          title="THIRUMURUGAN MEDICALS (Click for Dashboard)"
        >
          <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: 15, letterSpacing: '0.04em', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            THIRUMURUGAN MEDICALS
          </span>
          <span style={{ color: '#bfdbfe', fontSize: 12, fontWeight: 600 }}>
            - [{getScreenTitle()}]
          </span>
        </div>

        {/* Top Right Corner: ACTION BUTTONS & SESSION INFO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, zIndex: 10 }}>
          <span style={{ opacity: 0.85 }}>
            Shift: <strong>SALES 1:1</strong>
          </span>
          <span style={{ opacity: 0.85 }}>
            Operator: <strong style={{ color: '#fef08a' }}>{user?.name?.split(' ')[0]}</strong>
          </span>
          <span className={`role-tag ${user?.role === 'ADMIN' ? 'admin' : 'sales'}`} style={{ fontSize: 10, padding: '2px 7px' }}>
            {user?.role === 'ADMIN' ? 'ADMIN' : 'COUNTER'}
          </span>
          <button
            onClick={logout}
            className="erp-header-action-btn"
            style={{
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.25)',
              color: '#fecaca',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Log Out / Exit Shift"
          >
            ⎋ Exit
          </button>
        </div>
      </header>

      {/* 2. MAIN FULL SCREEN CONTENT AREA */}
      <main className="erp-fullscreen-viewport">
        <Outlet />
      </main>
    </div>
  )
}
