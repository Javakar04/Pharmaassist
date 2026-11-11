import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('pharmaassist_user')
    return raw ? JSON.parse(raw) : null
  })

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    const { token, userId, name, email: userEmail, role } = res.data
    localStorage.setItem('pharmaassist_token', token)
    const userObj = { userId, name, email: userEmail, role }
    localStorage.setItem('pharmaassist_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }

  function logout() {
    localStorage.removeItem('pharmaassist_token')
    localStorage.removeItem('pharmaassist_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
