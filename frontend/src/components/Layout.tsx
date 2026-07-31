import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { btnNav, navLink } from '../lib/styles'

export default function Layout() {
  const { user, isAdmin, logout, booting } = useAuth()

  if (booting) {
    return (
      <div className="mx-auto w-[min(960px,calc(100%-2rem))] py-12">
        <p className="p-4 text-ink/55">Loading…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-[min(960px,calc(100%-2rem))] py-10">
      <nav className="mb-10 flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center gap-3">
          <span
            className="inline-block h-0 w-0 border-x-[7px] border-b-[12px] border-x-transparent border-b-accent"
            aria-hidden
          />
          <span className="text-lg font-bold tracking-tight text-ink">TQ Playground</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
          <NavLink to="/" end className={({ isActive }) => navLink(isActive)}>
            Todo
          </NavLink>
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
        </div>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm capitalize text-ink/50">{user.role}</span>
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

      <Outlet />
    </div>
  )
}
