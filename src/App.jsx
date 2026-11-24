import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import SyncStatus from './components/SyncStatus'
import { getAdminUser, isAdminUser, subscribeAuthState } from './lib/adminAuth'

const MenuPage = lazy(() => import('./pages/MenuPage'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

export default function App() {
  const [authState, setAuthState] = useState({ ready: false, user: null })

  useEffect(() => {
    let active = true
    const unsubscribe = subscribeAuthState((user) => {
      setAuthState({ ready: true, user })
    })
    getAdminUser().then(({ user }) => {
      if (active) setAuthState((current) => current.ready ? current : { ready: true, user })
    }).catch(() => {
      if (active) setAuthState((current) => current.ready ? current : { ready: true, user: null })
    })
    return () => { active = false; unsubscribe() }
  }, [])

  const loginRoute = authState.ready && isAdminUser(authState.user)
    ? <Navigate to="/admin/dashboard" replace />
    : <AdminLogin onAuthenticated={(user) => setAuthState({ ready: true, user })} />

  return (
    <>
      <SyncStatus />
      <Suspense fallback={<div className="min-h-screen bg-surface-2" aria-busy="true" />}>
        <Routes>
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/admin/login" element={loginRoute} />
          <Route path="/admin" element={<AdminGuard authState={authState} onLogout={() => setAuthState({ ready: true, user: null })}><AdminDashboard onLogout={() => setAuthState({ ready: true, user: null })} /></AdminGuard>} />
          <Route path="/admin/dashboard" element={<AdminGuard authState={authState} onLogout={() => setAuthState({ ready: true, user: null })}><AdminDashboard onLogout={() => setAuthState({ ready: true, user: null })} /></AdminGuard>} />
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

function AdminGuard({ authState, onLogout, children }) {
  const [status, setStatus] = useState('checking')
  const [attempt, setAttempt] = useState(0)
  const userId = authState.user?.id
  const role = authState.user?.app_metadata?.role

  useEffect(() => {
    let active = true
    if (!authState.ready) {
      setStatus('checking')
      return () => { active = false }
    }
    if (!isAdminUser(authState.user)) {
      setStatus('denied')
      return () => { active = false }
    }
    setStatus('checking')
    getAdminUser().then(({ user, error }) => {
      if (active) setStatus(error ? 'unavailable' : user ? 'allowed' : 'denied')
    }).catch(() => {
      if (active) setStatus('unavailable')
    })
    return () => { active = false }
  }, [authState.ready, userId, role, attempt])

  if (status === 'allowed') return children
  if (status === 'denied') return <Navigate to="/admin/login" replace />
  if (status === 'unavailable') {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-2 px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center text-sm text-text">
          <p>تعذّر التحقق من جلسة المسؤول. لا يمكن فتح لوحة التحكم قبل التحقق من Supabase Auth.</p>
          <button onClick={() => setAttempt((value) => value + 1)} className="mt-4 rounded-xl bg-accent px-4 py-2 font-bold text-white">إعادة المحاولة</button>
          <button onClick={onLogout} className="mr-2 mt-4 rounded-xl border px-4 py-2">تسجيل الخروج</button>
        </div>
      </div>
    )
  }
  return <div className="min-h-screen bg-surface-2" aria-busy="true" />
}
