import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { btnNav, navLink } from '../lib/styles'

export default function Layout() {
  const { user, isAdmin, logout, booting } = useAuth()

  if (booting) {
    return (
      <div className="mx-auto w-[min(980px,calc(100%-2rem))] py-12">
        <p className="p-4 text-muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-mist/70 bg-surface/90 backdrop-blur-md">
        <nav className="mx-auto flex w-[min(980px,calc(100%-2rem))] flex-wrap items-center gap-x-8 gap-y-3 py-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block h-0 w-0 border-x-[6px] border-b-[11px] border-x-transparent border-b-accent"
              aria-hidden
            />
            <span className="text-[1.05rem] font-semibold tracking-tight text-ink">
              TQ Playground
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
            <NavLink
              to="/property-investment"
              className={({ isActive }) => navLink(isActive)}
            >
              Property Investment
            </NavLink>
            <NavLink
              to={isAdmin ? '/admin' : '/login'}
              end
              className={({ isActive }) => navLink(isActive)}
            >
              Users
            </NavLink>
            <NavLink
              to={isAdmin ? '/admin/jobs' : '/login'}
              className={({ isActive }) => navLink(isActive)}
            >
              Jobs
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => navLink(isActive)}>
              About
            </NavLink>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm capitalize text-muted">{user.role}</span>
                <button type="button" className={btnNav} onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <NavLink to="/login" className={btnNav}>
                Log in
              </NavLink>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-[min(980px,calc(100%-2rem))] py-12">
        <Outlet />
      </main>
    </div>
  )
}
