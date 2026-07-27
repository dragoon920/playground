import { FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { API, jsonHeaders } from '../lib/api'
import { btnDanger, btnPrimary, cardClass, inputClass } from '../lib/styles'
import type { User } from '../types'

export default function AdminPage() {
  const { token, user, isAdmin, booting } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')

  async function loadUsers() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/users`, { headers: jsonHeaders(token) })
      if (!res.ok) throw new Error('Failed to load users')
      setUsers(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin && token) {
      loadUsers()
    }
  }, [isAdmin, token])

  if (booting) {
    return <p className="p-4 text-gray-500">Loading…</p>
  }

  if (!isAdmin || !token || !user) {
    return <Navigate to="/login" replace />
  }

  async function createUser(e: FormEvent) {
    e.preventDefault()
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
    await loadUsers()
  }

  async function deleteUser(id: number) {
    const res = await fetch(`${API}/users/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    })
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Could not delete user')
      return
    }
    await loadUsers()
  }

  return (
    <>
      <header className="mb-7">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Users</h1>
        <p className="mt-1.5 text-gray-500">Create and manage accounts.</p>
      </header>

      {error && <p className="mb-3 text-red-600">{error}</p>}

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
        {loading ? (
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
  )
}
