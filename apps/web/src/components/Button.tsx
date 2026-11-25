import type { ComponentProps } from 'react'

const VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
} as const

type ButtonProps = ComponentProps<'button'> & {
  variant?: keyof typeof VARIANTS
}

export function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 sm:px-3 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
