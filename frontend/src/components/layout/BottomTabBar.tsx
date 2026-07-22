import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

export function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex bg-dusk md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              isActive ? 'text-white' : 'text-wisteria'
            }`
          }
        >
          <span className="text-lg leading-none">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
