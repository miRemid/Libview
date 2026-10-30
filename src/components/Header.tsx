import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type HeaderProps = {
  solid?: boolean
}

export default function Header({ solid = false }: HeaderProps) {
  const { isAdmin } = useAuth()

  return (
    <header
      className={`sticky top-0 z-50 flex h-16 w-full shrink-0 items-center border-b ${
        solid
          ? 'border-line bg-paper'
          : 'border-transparent bg-paper/85 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="font-serif text-[1.65rem] tracking-tight text-ink">
          Libview
        </Link>
        <nav className="flex items-center gap-6 text-sm text-mute">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'text-ink' : 'transition-colors hover:text-ink'
            }
          >
            图库
          </NavLink>
          <NavLink
            to={isAdmin ? '/admin' : '/admin/login'}
            className={({ isActive }) =>
              isActive ? 'text-ink' : 'transition-colors hover:text-ink'
            }
          >
            {isAdmin ? '管理' : '登录'}
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
