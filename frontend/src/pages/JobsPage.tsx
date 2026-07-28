import { FormEvent, useEffect, useId, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { API, jsonHeaders } from '../lib/api'
import { btnDanger, btnGhost, btnPrimary, cardClass, inputClass } from '../lib/styles'
import type { Job, JobListResponse } from '../types'

const PAGE_SIZE = 40

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
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [form, setForm] = useState<JobForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [companyQuery, setCompanyQuery] = useState('')

  async function loadJobs(targetPage = page, company = companyQuery) {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        per_page: String(PAGE_SIZE),
      })
      if (company.trim()) params.set('company', company.trim())
      const res = await fetch(`${API}/jobs?${params}`, { headers: jsonHeaders(token) })
      if (!res.ok) throw new Error('Failed to load jobs')
      const data: JobListResponse = await res.json()
      setJobs(data.items || [])
      setTotal(data.total)
      setTotalPages(data.total_pages || 1)
      setPage(data.page)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = companySearch.trim()
      setCompanyQuery((prev) => {
        if (prev !== next) setPage(1)
        return next
      })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [companySearch])

  useEffect(() => {
    if (isAdmin && token) {
      loadJobs(page, companyQuery)
    }
  }, [isAdmin, token, page, companyQuery])

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
    if (!editingJob && page !== 1) {
      setPage(1)
    } else {
      await loadJobs(editingJob ? page : 1, companyQuery)
    }
  }

  async function deleteJob(job: Job) {
    if (!confirm(`Delete ${job.company}?`)) return
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
    if (jobs.length === 1 && page > 1) {
      setPage(page - 1)
    } else {
      await loadJobs(page, companyQuery)
    }
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, total)

  return (
    <>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Jobs</h1>
          <p className="mt-1.5 text-gray-500">Track applications in one list.</p>
        </div>
        <div className="flex shrink-0 flex-nowrap items-center gap-3">
          <input
            className="w-56 shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            placeholder="Search company…"
            aria-label="Search by company name"
          />
          <button type="button" className={`${btnPrimary} shrink-0 whitespace-nowrap`} onClick={openAdd}>
            Add job
          </button>
        </div>
      </header>

      {error && !modalOpen && <p className="mb-3 text-red-600">{error}</p>}

      <section className={cardClass}>
        {loading ? (
          <p className="p-5 text-gray-500">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="p-5 text-gray-500">No jobs yet.</p>
        ) : (
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[7%]" />
              <col className="w-[18%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr>
                {['Company', 'Role', 'Salary', 'Status', 'URL', 'Note', 'Created', ''].map((h) => (
                  <th
                    key={h || 'actions'}
                    className="border-b border-gray-200 bg-gray-50 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="align-top">
                  <td className="break-words border-b border-gray-200 px-2 py-3">
                    {job.company}
                  </td>
                  <td className="break-words border-b border-gray-200 px-2 py-3">
                    {job.role || '—'}
                  </td>
                  <td className="break-words border-b border-gray-200 px-2 py-3">
                    {job.salary || '—'}
                  </td>
                  <td className="border-b border-gray-200 px-2 py-3">
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
                  <td className="border-b border-gray-200 px-2 py-3">
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
                  <td className="break-words border-b border-gray-200 px-2 py-3 text-gray-600">
                    {job.note || '—'}
                  </td>
                  <td className="border-b border-gray-200 px-2 py-3 text-gray-600">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="border-b border-gray-200 px-2 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
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
                        aria-label="Delete job"
                        title="Delete"
                        onClick={() => deleteJob(job)}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Showing {rangeStart}–{rangeEnd} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={btnGhost}
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className={btnGhost}
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
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

            {editingJob && (
              <p className="mb-3 text-sm text-gray-500">
                Created: {new Date(editingJob.created_at).toLocaleString()}
              </p>
            )}

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
                placeholder="Role (optional)"
              />
              <input
                className={inputClass}
                value={form.salary}
                onChange={(e) => patchForm({ salary: e.target.value })}
                placeholder="Salary (optional)"
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
                className={inputClass}
                value={form.url}
                onChange={(e) => patchForm({ url: e.target.value })}
                placeholder="URL (optional)"
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
