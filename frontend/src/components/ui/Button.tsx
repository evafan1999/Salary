import type { ButtonHTMLAttributes } from 'react'

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const variantClasses = {
    primary: 'bg-glaucous text-white hover:bg-dusk',
    secondary:
      'bg-wisteria/15 text-dusk hover:bg-wisteria/25 dark:bg-wisteria/10 dark:text-wisteria dark:hover:bg-wisteria/20',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant]

  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 ${variantClasses} ${className}`}
      {...props}
    />
  )
}
