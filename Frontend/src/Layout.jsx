import { useContext, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { apiContext } from './ApiContext'
import { authContext } from './AuthContext'
import './sidebar.css'

export default function Layout() {
  const { api } = useContext(apiContext)
  const { isAuthLoading, isLoggedIn } = useContext(authContext)
  const location = useLocation()
  const [userType, setUserType] = useState('')

  useEffect(() => {
    if (isAuthLoading || !isLoggedIn) return

    async function getProfileInfo() {
      try {
        const res = await api.get('/get-profile-info')
        setUserType(res.data.userType ?? '')
      } catch {
        setUserType('')
      }
    }

    getProfileInfo()
  }, [isAuthLoading, isLoggedIn])

  if (location.pathname === '/' && userType === 'mentor') {
    return <Outlet />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
