import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { isAdmin, pb } from '../../lib/pocketbase'

const links = [
  { to: '/admin', label: '概览', end: true },
  { to: '/admin/upload', label: '上传', end: false },
  { to: '/admin/photos', label: '图片管理', end: false },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const allowed = isAdmin()

  useEffect(() => {
    if (!allowed) navigate('/admin/login', { replace: true })
  }, [allowed, navigate])

  function logout() {
    pb.authStore.clear()
    navigate('/admin/login', { replace: true })
  }

  if (!allowed) return null

  return (
    <div className="min-h-screen bg-mist">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-line bg-paper px-5 py-6">
        <Link to="/" className="text-ink">
          <Logo className="h-7 w-auto" />
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-mute">Dashboard</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1 text-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 transition-colors ${
                  isActive ? 'bg-mist text-ink' : 'text-mute hover:bg-mist hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="mt-4 text-left text-sm text-mute transition-colors hover:text-ink"
        >
          退出登录
        </button>
      </aside>
      <main className="ml-56 min-h-screen px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
