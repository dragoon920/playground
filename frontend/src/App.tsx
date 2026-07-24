import { FormEvent, useEffect, useState } from 'react'

type User = {
  id: number
  email: string
  name: string
  role: string
  created_at: string
}

type Item = {
  id: number
  title: string
  done: boolean
  created_at: string
}

type Page = 'playground' | 'admin' | 'login'

const API = '/api'
const TOKEN_KEY = 'playground_token'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'
const btnPrimary =
  'rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink hover:brightness-105'
const btnGhost =
  'rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-900 hover:bg-gray-50'
const btnDanger =
  'rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50'
const cardClass = 'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'

function jsonHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function navBtn(active: boolean) {
  return `rounded-lg border px-4 py-2 font-semibold ${
    active
      ? 'border-accent bg-accent text-accent-ink'
      : 'border-gray-200 bg-gray-100 text-gray-500 hover:text-gray-900'
  }`
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<Page>('playground')
  const [error, setError] = useState<string | null>(null)
  const [booting, setBooting] = useState(!!localStorage.getItem(TOKEN_KEY))

  const [email, setEmail] = useState('admin@playground.local')
  const [password, setPassword] = useState('admin123')

  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [itemsLoading, setItemsLoading] = useState(false)

  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')

  const isAdmin = user?.role === 'admin'

  async function loadSession(activeToken: string) {
    setBooting(true)
    try {
      const meRes = await fetch(`${API}/auth/me`, {
        headers: jsonHeaders(activeToken),
      })
      if (!meRes.ok) throw new Error('Session expired')
      const me: User = await meRes.json()
      setUser(me)
      if (me.role !== 'admin' && page === 'admin') {
        setPage('playground')
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
      if (page === 'admin') setPage('login')
    } finally {
      setBooting(false)
    }
  }

  async function loadItems() {
    setItemsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/items`)
      if (!res.ok) throw new Error('Failed to load items')
      setItems(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load items')
    } finally {
      setItemsLoading(false)
    }
  }

  async function loadUsers(activeToken: string) {
    setUsersLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/users`, { headers: jsonHeaders(activeToken) })
      if (!res.ok) throw new Error('Failed to load users')
      setUsers(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadSession(token)
    } else {
      setBooting(false)
      setUser(null)
    }
  }, [token])

  useEffect(() => {
    if (page === 'playground') {
      loadItems()
    } else if (page === 'admin' && token && isAdmin) {
      loadUsers(token)
    }
  }, [page, token, isAdmin])

  function goAdmin() {
    setError(null)
    if (isAdmin) {
      setPage('admin')
    } else {
      setPage('login')
    }
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Login failed')
      return
    }
    const data = await res.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
    setPage(data.user.role === 'admin' ? 'admin' : 'playground')
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setUsers([])
    setPage('playground')
  }

  async function onCreateItem(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    const res = await fetch(`${API}/items`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ title: trimmed }),
    })
    if (!res.ok) {
      setError('Could not create item')
      return
    }
    setTitle('')
    await loadItems()
  }

  async function toggleDone(item: Item) {
    const res = await fetch(`${API}/items/${item.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ done: !item.done }),
    })
    if (!res.ok) {
      setError('Could not update item')
      return
    }
    await loadItems()
  }

  async function removeItem(id: number) {
    const res = await fetch(`${API}/items/${id}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      setError('Could not delete item')
      return
    }
    await loadItems()
  }

  async function createUser(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setError(null)
    const res = await fetch(`${API}/users`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Could not create user')
      return
    }
    setNewName('')
    setNewEmail('')
    setNewPassword('')
    setNewRole('user')
    await loadUsers(token)
  }

  async function deleteUser(id: number) {
    if (!token || !user) return
    const res = await fetch(`${API}/users/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    })
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Could not delete user')
      return
    }
    await loadUsers(token)
  }

  if (booting) {
    return (
      <div className="mx-auto w-[min(960px,calc(100%-2rem))] py-12">
        <p className="p-4 text-gray-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-[min(960px,calc(100%-2rem))] py-12">
      <nav className="mb-7 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mr-2 font-bold tracking-tight text-accent">Playground</div>
        <div className="flex gap-2">
          <button
            type="button"
            className={navBtn(page === 'playground')}
            onClick={() => setPage('playground')}
          >
            Playground
          </button>
          <button
            type="button"
            className={navBtn(page === 'admin' || page === 'login')}
            onClick={goAdmin}
          >
            Admin
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-500">
                {user.name} · {user.role}
              </span>
              <button type="button" className={btnGhost} onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <button type="button" className={btnGhost} onClick={() => setPage('login')}>
              Log in
            </button>
          )}
        </div>
      </nav>

      {error && <p className="mb-3 text-red-600">{error}</p>}

      {page === 'playground' && (
        <>
          <header className="mb-7">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-accent">
              Playground
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Items</h1>
            <p className="mt-1.5 text-gray-500">Open to everyone — no login required.</p>
          </header>

          <form className="mb-4 grid grid-cols-[1fr_auto] gap-3" onSubmit={onCreateItem}>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add something to try…"
              aria-label="Item title"
            />
            <button type="submit" className={btnPrimary}>
              Add
            </button>
          </form>

          <section className={cardClass}>
            {itemsLoading ? (
              <p className="p-5 text-gray-500">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-5 text-gray-500">No items yet. Add one above.</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 border-b border-gray-200 px-4 py-3.5 last:border-b-0"
                  >
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-white text-emerald-600"
                      onClick={() => toggleDone(item)}
                      aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {item.done ? '✓' : ''}
                    </button>
                    <span className={item.done ? 'text-gray-500 line-through' : ''}>
                      {item.title}
                    </span>
                    <button
                      type="button"
                      className={btnDanger}
                      onClick={() => removeItem(item.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {page === 'login' && (
        <div className="mx-auto w-[min(420px,100%)]">
          <header className="mb-7">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-accent">
              Admin
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Sign in</h1>
            <p className="mt-1.5 text-gray-500">Admin login is required to manage users.</p>
          </header>

          <form className={`${cardClass} mb-4 grid gap-3.5 p-5`} onSubmit={onLogin}>
            <label className="grid gap-1.5 text-sm text-gray-500">
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
            <label className="grid gap-1.5 text-sm text-gray-500">
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

          <p className="text-sm text-gray-500">
            Default admin:{' '}
            <code className="rounded bg-teal-50 px-1.5 py-0.5 text-accent">
              admin@playground.local
            </code>{' '}
            /{' '}
            <code className="rounded bg-teal-50 px-1.5 py-0.5 text-accent">admin123</code>
          </p>
        </div>
      )}

      {page === 'admin' && isAdmin && user && token && (
        <>
          <header className="mb-7">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-accent">
              Admin
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Users</h1>
            <p className="mt-1.5 text-gray-500">Create and manage accounts.</p>
          </header>

          <form
            className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1.4fr_1fr_0.7fr_auto]"
            onSubmit={createUser}
          >
            <input
              className={inputClass}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              required
            />
            <input
              type="email"
              className={inputClass}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <input
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password (min 6)"
              minLength={6}
              required
            />
            <select
              className={inputClass}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button type="submit" className={btnPrimary}>
              Add user
            </button>
          </form>

          <section className={cardClass}>
            {usersLoading ? (
              <p className="p-5 text-gray-500">Loading…</p>
            ) : users.length === 0 ? (
              <p className="p-5 text-gray-500">No users yet.</p>
            ) : (
              <table className="w-full border-collapse text-[0.95rem]">
                <thead>
                  <tr>
                    {['ID', 'Name', 'Email', 'Role', 'Created', ''].map((h) => (
                      <th
                        key={h || 'actions'}
                        className="border-b border-gray-200 bg-gray-50 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="border-b border-gray-200 px-4 py-3.5">{u.id}</td>
                      <td className="border-b border-gray-200 px-4 py-3.5">{u.name}</td>
                      <td className="border-b border-gray-200 px-4 py-3.5">{u.email}</td>
                      <td className="border-b border-gray-200 px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs ${
                            u.role === 'admin'
                              ? 'border-teal-200 bg-teal-50 text-accent'
                              : 'border-gray-200 bg-gray-50 text-gray-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3.5">
                        {new Date(u.created_at).toLocaleString()}
                      </td>
                      <td className="border-b border-gray-200 px-4 py-3.5">
                        {u.id !== user.id && (
                          <button
                            type="button"
                            className={btnDanger}
                            onClick={() => deleteUser(u.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}
