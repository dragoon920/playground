import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { btnGhost, navBtn } from '../lib/styles'

export default function Layout() {
  const { user, isAdmin, logout, booting } = useAuth()

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
        <div className="mr-2 font-bold tracking-tight text-accent">TQ Playground</div>
        <div className="flex gap-2">
          <NavLink to="/" end className={({ isActive }) => navBtn(isActive)}>
            Todo
          </NavLink>
          <NavLink
            to="/property-investment"
            className={({ isActive }) => navBtn(isActive)}
          >
            Property Investment
          </NavLink>
          <NavLink
            to={isAdmin ? '/admin' : '/login'}
            end
            className={({ isActive }) => navBtn(isActive)}
          >
            Users
          </NavLink>
          <NavLink
            to={isAdmin ? '/admin/jobs' : '/login'}
            className={({ isActive }) => navBtn(isActive)}
          >
            Jobs
          </NavLink>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-500 capitalize">{user.role}</span>
              <button type="button" className={btnGhost} onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={btnGhost}>
              Log in
            </NavLink>
          )}
        </div>
      </nav>

      <Outlet />
    </div>
  )
}
