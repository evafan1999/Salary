import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

export function SideNav() {
  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-gray-200 p-4 md:flex dark:border-gray-700">
      <h1 className="mb-4 px-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        薪資追蹤
      </h1>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
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
