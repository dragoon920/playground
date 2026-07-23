import { FormEvent, useEffect, useState } from 'react'

type Item = {
  id: number
  title: string
  done: boolean
  created_at: string
}

const API = '/api'

export default function App() {
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [health, setHealth] = useState<'ok' | 'down' | 'loading'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [healthRes, itemsRes] = await Promise.all([
        fetch(`${API}/health`),
        fetch(`${API}/items`),
      ])
      setHealth(healthRes.ok ? 'ok' : 'down')
      if (!itemsRes.ok) throw new Error('Failed to load items')
      setItems(await itemsRes.json())
    } catch (e) {
      setHealth('down')
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    const res = await fetch(`${API}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    })
    if (!res.ok) {
      setError('Could not create item')
      return
    }
    setTitle('')
    await load()
  }

  async function toggleDone(item: Item) {
    const res = await fetch(`${API}/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !item.done }),
    })
    if (!res.ok) {
      setError('Could not update item')
      return
    }
    await load()
  }

  async function remove(id: number) {
    const res = await fetch(`${API}/items/${id}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      setError('Could not delete item')
      return
    }
    await load()
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Playground</p>
          <h1>Items</h1>
          <p className="sub">Go API + MySQL + React, running in Docker.</p>
        </div>
        <span className={`badge ${health}`}>
          API {health === 'loading' ? '…' : health}
        </span>
      </header>

      <form className="composer" onSubmit={onSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add something to try…"
          aria-label="Item title"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <section className="list">
        {loading ? (
          <p className="empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="empty">No items yet. Add one above.</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className={item.done ? 'done' : ''}>
                <button
                  type="button"
                  className="check"
                  onClick={() => toggleDone(item)}
                  aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {item.done ? '✓' : ''}
                </button>
                <span className="title">{item.title}</span>
                <button
                  type="button"
                  className="danger"
                  onClick={() => remove(item.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
