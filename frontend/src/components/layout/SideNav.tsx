import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

export function SideNav() {
  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 overflow-y-auto bg-dusk p-4 md:sticky md:top-0 md:flex md:h-svh">
      <h1 className="mb-4 px-2 text-lg font-semibold text-white">薪資追蹤</h1>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-white/10 text-white' : 'text-wisteria hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
