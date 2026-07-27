import { FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { API, jsonHeaders } from '../lib/api'
import { btnPrimary, cardClass, inputClass } from '../lib/styles'
import type { Job } from '../types'

export default function JobsPage() {
  const { token, user, isAdmin, booting } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [salary, setSalary] = useState('')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('applied')

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

  if (booting) {
    return <p className="p-4 text-gray-500">Loading…</p>
  }

  if (!isAdmin || !token || !user) {
    return <Navigate to="/login" replace />
  }

  async function createJob(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch(`${API}/jobs`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ company, role, salary, url, status }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Could not create job')
      return
    }
    setCompany('')
    setRole('')
    setSalary('')
    setUrl('')
    setStatus('applied')
    await loadJobs()
  }

  return (
    <>
      <header className="mb-7">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Jobs</h1>
        <p className="mt-1.5 text-gray-500">Track applications by company, role, and status.</p>
      </header>

      {error && <p className="mb-3 text-red-600">{error}</p>}

      <form className="mb-4 grid grid-cols-1 gap-3" onSubmit={createJob}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className={inputClass}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            required
          />
          <input
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role"
            required
          />
          <input
            className={inputClass}
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="Salary"
            required
          />
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="applied">applied</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="url"
            className={inputClass}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            required
          />
          <button type="submit" className={btnPrimary}>
            Add job
          </button>
        </div>
      </form>

      <section className={cardClass}>
        {loading ? (
          <p className="p-5 text-gray-500">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="p-5 text-gray-500">No jobs yet.</p>
        ) : (
          <table className="w-full border-collapse text-[0.95rem]">
            <thead>
              <tr>
                {['ID', 'Company', 'Role', 'Salary', 'URL', 'Status', 'Created'].map((h) => (
                  <th
                    key={h}
                    className="border-b border-gray-200 bg-gray-50 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="border-b border-gray-200 px-4 py-3.5">{job.id}</td>
                  <td className="border-b border-gray-200 px-4 py-3.5">{job.company}</td>
                  <td className="border-b border-gray-200 px-4 py-3.5">{job.role}</td>
                  <td className="border-b border-gray-200 px-4 py-3.5">{job.salary}</td>
                  <td className="border-b border-gray-200 px-4 py-3.5">
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
                  <td className="border-b border-gray-200 px-4 py-3.5">
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
                  <td className="border-b border-gray-200 px-4 py-3.5">
                    {new Date(job.created_at).toLocaleString()}
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
