import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import SyncStatus from './components/SyncStatus'
import { isAuthed, validateSession } from './lib/adminAuth'

const MenuPage = lazy(() => import('./pages/MenuPage'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

export default function App() {
  const [authed, setAuthed] = useState(null)

  useEffect(() => {
    let active = true
    validateSession().then((valid) => { if (active) setAuthed(valid) })
    return () => { active = false }
  }, [])

  const Guarded = ({ children }) => {
    if (authed === null) return <div className="min-h-screen bg-surface-2" aria-busy="true" />
    if (!authed || !isAuthed()) return <Navigate to="/admin/login" replace />
    return children
  }

  return (
    <>
      <SyncStatus />
      <Suspense fallback={<div className="min-h-screen bg-surface-2" aria-busy="true" />}>
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route
            path="/admin/login"
            element={authed === null
              ? <div className="min-h-screen bg-surface-2" aria-busy="true" />
              : authed
                ? <Navigate to="/admin/dashboard" replace />
                : <AdminLogin onAuthenticated={() => setAuthed(true)} />}
          />
          <Route path="/admin" element={<Guarded><AdminDashboard onLogout={() => setAuthed(false)} /></Guarded>} />
          <Route path="/admin/dashboard" element={<Guarded><AdminDashboard onLogout={() => setAuthed(false)} /></Guarded>} />
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
