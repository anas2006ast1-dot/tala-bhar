import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import { useEffect } from 'react'
import SyncStatus from './components/SyncStatus'
import { getAdminUser, isAdminUser, subscribeAuthState } from './lib/adminAuth'

const MenuPage = lazy(() => import('./pages/MenuPage'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

export default function App() {
  const [authState, setAuthState] = useState({ ready: false, user: null })

  useEffect(() => subscribeAuthState((user) => {
    setAuthState({ ready: true, user })
  }), [])

  return (
    <>
      {/* Global offline/online sync UI */}
      <SyncStatus />

      <Suspense fallback={<div className="min-h-screen bg-surface-2" aria-busy="true" />}>
        <Routes>
          {/* Public menu (with splash landing) */}
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<MenuPage />} />

          {/* Admin login uses Supabase Auth; no client-side password gate. */}
          <Route
            path="/admin/login"
            element={<AdminLogin onAuthenticated={(user) => setAuthState({ ready: true, user })} />}
          />

          {/* Protected admin */}
          <Route
            path="/admin"
            element={
              <AdminGuard authState={authState}>
                <AdminDashboard onLogout={() => setAuthState({ ready: true, user: null })} />
              </AdminGuard>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminGuard authState={authState}>
                <AdminDashboard onLogout={() => setAuthState({ ready: true, user: null })} />
              </AdminGuard>
            }
          />

          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

function AdminGuard({ authState, children }) {
  const [status, setStatus] = useState('checking')
  const [attempt, setAttempt] = useState(0)
  const { ready, user } = authState
  const userId = user?.id
  const role = user?.app_metadata?.role

  useEffect(() => {
    let active = true
    if (!ready) {
      setStatus('checking')
      return () => { active = false }
    }
    if (!isAdminUser(user)) {
      setStatus('denied')
      return () => { active = false }
    }

    setStatus('checking')
    getAdminUser().then(({ user: verifiedUser, error }) => {
      if (active) setStatus(error ? 'unavailable' : verifiedUser ? 'allowed' : 'denied')
    }).catch(() => {
      if (active) setStatus('unavailable')
    })

    return () => { active = false }
  }, [ready, userId, role, attempt])

  if (status === 'allowed') return children
  if (status === 'denied') return <Navigate to="/admin/login" replace />
  if (status === 'unavailable') {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-2 px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center text-sm text-text">
          <p>تعذّر التحقق من جلسة المسؤول. لا يمكن فتح لوحة التحكم قبل التحقق من Supabase Auth.</p>
          <button
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-4 rounded-xl bg-accent px-4 py-2 font-bold text-white"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }
  return <div className="min-h-screen bg-surface-2" aria-busy="true" />
}
