import { FormEvent, useEffect, useId, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { API, jsonHeaders } from '../lib/api'
import { btnDanger, btnGhost, btnPrimary, cardClass, inputClass } from '../lib/styles'
import type { Job } from '../types'

type JobForm = {
  company: string
  role: string
  salary: string
  url: string
  note: string
  status: string
}

const emptyForm = (): JobForm => ({
  company: '',
  role: '',
  salary: '',
  url: '',
  note: '',
  status: 'applied',
})

function fromJob(job: Job): JobForm {
  return {
    company: job.company,
    role: job.role,
    salary: job.salary,
    url: job.url,
    note: job.note || '',
    status: job.status,
  }
}

export default function JobsPage() {
  const titleId = useId()
  const { token, user, isAdmin, booting } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [form, setForm] = useState<JobForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadJobs() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/jobs`, { headers: jsonHeaders(token) })
      if (!res.ok) throw new Error('Failed to load jobs')
      setJobs(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin && token) {
      loadJobs()
    }
  }, [isAdmin, token])

  useEffect(() => {
    if (!modalOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  if (booting) {
    return <p className="p-4 text-gray-500">Loading…</p>
  }

  if (!isAdmin || !token || !user) {
    return <Navigate to="/login" replace />
  }

  function openAdd() {
    setEditingJob(null)
    setForm(emptyForm())
    setError(null)
    setModalOpen(true)
  }

  function openEdit(job: Job) {
    setEditingJob(job)
    setForm(fromJob(job))
    setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setEditingJob(null)
    setForm(emptyForm())
  }

  function patchForm(patch: Partial<JobForm>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  async function submitModal(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = editingJob
      ? await fetch(`${API}/jobs/${editingJob.id}`, {
          method: 'PATCH',
          headers: jsonHeaders(token),
          body: JSON.stringify(form),
        })
      : await fetch(`${API}/jobs`, {
          method: 'POST',
          headers: jsonHeaders(token),
          body: JSON.stringify(form),
        })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || (editingJob ? 'Could not update job' : 'Could not create job'))
      setSaving(false)
      return
    }

    setSaving(false)
    setModalOpen(false)
    setEditingJob(null)
    setForm(emptyForm())
    await loadJobs()
  }

  async function deleteJob(job: Job) {
    if (!confirm(`Delete ${job.role} at ${job.company}?`)) return
    setError(null)
    const res = await fetch(`${API}/jobs/${job.id}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    })
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Could not delete job')
      return
    }
    await loadJobs()
  }

  return (
    <>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Jobs</h1>
          <p className="mt-1.5 text-gray-500">Track applications in one list.</p>
        </div>
        <button type="button" className={btnPrimary} onClick={openAdd}>
          Add job
        </button>
      </header>

      {error && !modalOpen && <p className="mb-3 text-red-600">{error}</p>}

      <section className={cardClass}>
        {loading ? (
          <p className="p-5 text-gray-500">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="p-5 text-gray-500">No jobs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[0.95rem]">
              <thead>
                <tr>
                  {['Company', 'Role', 'Salary', 'Status', 'URL', 'Note', ''].map((h) => (
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
                {jobs.map((job) => (
                  <tr key={job.id} className="align-middle">
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3">
                      {job.company}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3">
                      {job.role}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3">
                      {job.salary}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs capitalize ${
                          job.status === 'applied'
                            ? 'border-teal-200 bg-teal-50 text-accent'
                            : 'border-red-200 bg-red-50 text-red-600'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="max-w-[10rem] truncate border-b border-gray-200 px-4 py-3">
                      {job.url ? (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent underline decoration-accent/40 hover:decoration-accent"
                        >
                          Link
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="max-w-[14rem] truncate border-b border-gray-200 px-4 py-3 text-gray-600">
                      {job.note || '—'}
                    </td>
                    <td className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => openEdit(job)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() => deleteJob(job)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-2xl font-semibold text-gray-900">
                {editingJob ? 'Edit job' : 'Add job'}
              </h2>
              <button type="button" className={btnGhost} onClick={closeModal} disabled={saving}>
                Close
              </button>
            </div>

            {error && <p className="mb-3 text-red-600">{error}</p>}

            <form className="grid grid-cols-1 gap-3" onSubmit={submitModal}>
              <input
                className={inputClass}
                value={form.company}
                onChange={(e) => patchForm({ company: e.target.value })}
                placeholder="Company"
                required
              />
              <input
                className={inputClass}
                value={form.role}
                onChange={(e) => patchForm({ role: e.target.value })}
                placeholder="Role"
                required
              />
              <input
                className={inputClass}
                value={form.salary}
                onChange={(e) => patchForm({ salary: e.target.value })}
                placeholder="Salary"
                required
              />
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => patchForm({ status: e.target.value })}
              >
                <option value="applied">applied</option>
                <option value="rejected">rejected</option>
              </select>
              <input
                type="url"
                className={inputClass}
                value={form.url}
                onChange={(e) => patchForm({ url: e.target.value })}
                placeholder="https://…"
                required
              />
              <textarea
                className={`${inputClass} min-h-24`}
                value={form.note}
                onChange={(e) => patchForm({ note: e.target.value })}
                placeholder="Note (optional)"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" className={btnGhost} onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className={btnPrimary} disabled={saving}>
                  {saving ? 'Saving…' : editingJob ? 'Save changes' : 'Add job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
