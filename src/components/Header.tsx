import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

type HeaderProps = {
  solid?: boolean
}

export default function Header({ solid = false }: HeaderProps) {
  return (
    <header
      className={`sticky top-0 z-50 flex h-16 w-full shrink-0 items-center border-b ${
        solid
          ? 'border-line bg-paper'
          : 'border-transparent bg-paper/85 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="text-ink">
          <Logo />
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
        </nav>
      </div>
    </header>
  )
}
