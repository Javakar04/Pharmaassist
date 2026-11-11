import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PosBilling from './pages/PosBilling.jsx'
import BillCopies from './pages/BillCopies.jsx'
import SalesReturn from './pages/SalesReturn.jsx'
import InventoryManagement from './pages/InventoryManagement.jsx'
import ScanMedicine from './pages/ScanMedicine.jsx'
import MedicineDetail from './pages/MedicineDetail.jsx'
import Purchase from './pages/Purchase.jsx'
import Accounts from './pages/Accounts.jsx'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<PosBilling />} />
        <Route path="bills" element={<BillCopies />} />
        <Route path="returns" element={<SalesReturn />} />
        <Route path="sales" element={<BillCopies />} />
        <Route path="purchase" element={<Purchase />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="scan" element={<ScanMedicine />} />
        <Route path="medicines/:id" element={<MedicineDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
