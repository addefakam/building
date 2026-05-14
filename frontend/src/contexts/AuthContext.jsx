import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const [loading, setLoading] = useState(false)

  const setLoginData = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const verifyMfa = async (preToken, totpCode) => {
    const { data } = await api.post('/auth/mfa/verify', { preToken, totpCode })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
      localStorage.setItem('user', JSON.stringify(data))
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, setLoginData, verifyMfa, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
