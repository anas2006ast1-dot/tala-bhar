import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import SyncStatus from './components/SyncStatus'
import { isAuthed } from './lib/adminAuth'

const MenuPage = lazy(() => import('./pages/MenuPage'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

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

      <Suspense fallback={<div className="min-h-screen bg-surface-2" aria-busy="true" />}>
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
      </Suspense>
    </>
  )
}
