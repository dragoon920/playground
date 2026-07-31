import { FormEvent, useEffect, useState } from 'react'
import { API, jsonHeaders } from '../lib/api'
import { btnDanger, btnPrimary, cardClass, inputClass } from '../lib/styles'
import type { Item } from '../types'

export default function TodoPage() {
  const [todos, setTodos] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadTodos() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/items`)
      if (!res.ok) throw new Error('Failed to load todos')
      setTodos(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load todos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTodos()
  }, [])

  async function onCreateTodo(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    const res = await fetch(`${API}/items`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ title: trimmed }),
    })
    if (!res.ok) {
      setError('Could not create todo')
      return
    }
    setTitle('')
    await loadTodos()
  }

  async function toggleDone(todo: Item) {
    const res = await fetch(`${API}/items/${todo.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ done: !todo.done }),
    })
    if (!res.ok) {
      setError('Could not update todo')
      return
    }
    await loadTodos()
  }

  async function removeTodo(id: number) {
    const res = await fetch(`${API}/items/${id}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      setError('Could not delete todo')
      return
    }
    await loadTodos()
  }

  return (
    <>
      <header className="mb-7">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Todos</h1>
        <p className="mt-1.5 text-gray-500">Open to everyone — no login required.</p>
      </header>

      {error && <p className="mb-3 text-red-600">{error}</p>}

      <form className="mb-4 grid grid-cols-[1fr_auto] gap-3" onSubmit={onCreateTodo}>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a todo…"
          aria-label="Todo title"
        />
        <button type="submit" className={btnPrimary}>
          Add
        </button>
      </form>

      <section className={cardClass}>
        {loading ? (
          <p className="p-5 text-gray-500">Loading…</p>
        ) : todos.length === 0 ? (
          <p className="p-5 text-gray-500">No todos yet. Add one above.</p>
        ) : (
          <ul>
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 border-b border-gray-200 px-4 py-3.5 last:border-b-0"
              >
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-white text-emerald-600"
                  onClick={() => toggleDone(todo)}
                  aria-label={todo.done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {todo.done ? '✓' : ''}
                </button>
                <span className={todo.done ? 'text-gray-500 line-through' : ''}>
                  {todo.title}
                </span>
                <button
                  type="button"
                  className={btnDanger}
                  onClick={() => removeTodo(todo.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
