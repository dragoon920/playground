import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { btnPrimary, cardClass, inputClass } from '../lib/styles'

export default function LoginPage() {
  const { login, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@playground.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true })
  }, [isAdmin, navigate])

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const user = await login(email, password)
      navigate(user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="mx-auto w-[min(420px,100%)]">
      <header className="mb-7">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-accent">
          Admin
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-1.5 text-ink/55">Admin login is required to manage users.</p>
      </header>

      {error && <p className="mb-3 text-red-600">{error}</p>}

      <form className={`${cardClass} mb-4 grid gap-3.5 p-5`} onSubmit={onLogin}>
        <label className="grid gap-1.5 text-sm text-ink/55">
          Email
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm text-ink/55">
          Password
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className={btnPrimary}>
          Log in
        </button>
      </form>

      <p className="text-sm text-ink/55">
        Default admin:{' '}
        <code className="rounded bg-canvas px-1.5 py-0.5 text-accent">
          admin@playground.local
        </code>{' '}
        / <code className="rounded bg-canvas px-1.5 py-0.5 text-accent">admin123</code>
      </p>
    </div>
  )
}
