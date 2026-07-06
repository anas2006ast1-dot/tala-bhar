import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { RESTAURANT_NAME } from '../lib/supabaseClient'
import { login } from '../lib/adminAuth'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.classList.add('theme-customer')
    document.body.classList.remove('theme-admin')
  }, [])

  const submit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // tiny delay so the spinner shows briefly
    window.setTimeout(() => {
      const ok = login(password)
      setLoading(false)
      if (!ok) {
        setError('كلمة السر غير صحيحة.')
        return
      }
      navigate('/admin/dashboard', { replace: true })
    }, 350)
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-surface-2 px-4 py-6">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 right-1/4 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md rounded-2xl border border-accent/10 bg-white/60 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-8"
      >
        <button
          onClick={() => navigate('/menu')}
          className="mb-5 inline-flex min-h-[44px] items-center gap-1 text-sm text-text/60 transition hover:text-accent sm:mb-6"
        >
          <ArrowLeft size={16} /> العودة للقائمة
        </button>

        <div className="mb-6 text-center sm:mb-7">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 ring-1 ring-accent/30 sm:h-16 sm:w-16">
            <Lock className="text-accent" size={26} />
          </div>
          <h1 className="text-xl font-bold text-text sm:text-2xl" style={{ fontFamily: "'Cairo', sans-serif" }}>لوحة التحكم</h1>
          <p className="mt-1 text-xs text-text/55 sm:text-sm">{RESTAURANT_NAME} — تسجيل دخول المسؤول</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-text/80">كلمة السر</span>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40">
                <Lock size={18} />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                required
                className="w-full rounded-xl border border-accent/15 bg-white/70 py-3 pr-11 pl-11 text-text placeholder:text-text/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute left-3 top-1/2 min-h-[44px] min-w-[44px] -translate-y-1/2 flex items-center justify-center text-text/40 transition hover:text-text/70"
                aria-label={showPass ? 'إخفاء' : 'إظهار'}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-100 p-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-bold text-surface-2 transition hover:bg-accent-dark disabled:opacity-60"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
            {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
