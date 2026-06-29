import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import MenuPage from './pages/MenuPage'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import SyncStatus from './components/SyncStatus'
import { isAuthed } from './lib/adminAuth'

export default function App() {
  const [authed, setAuthed] = useState(isAuthed())

  const Guarded = ({ children }) => {
    if (!isAuthed()) return <Navigate to="/admin/login" replace />
    return children
  }

  return (
    <>
      {/* Global offline/online sync UI */}
      <SyncStatus />

      <Routes>
        {/* Public menu (with splash landing) */}
        <Route path="/" element={<Navigate to="/menu" replace />} />
        <Route path="/menu" element={<MenuPage />} />

        {/* Admin auth — password only */}
        <Route
          path="/admin/login"
          element={isAuthed() ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />}
        />

        {/* Protected admin */}
        <Route
          path="/admin"
          element={
            <Guarded>
              <AdminDashboard key={authed} onLogout={() => setAuthed(false)} />
            </Guarded>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <Guarded>
              <AdminDashboard key={authed} onLogout={() => setAuthed(false)} />
            </Guarded>
          }
        />

        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </>
  )
}
