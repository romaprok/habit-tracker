import type { ComponentProps } from 'react'
import { Link } from 'react-router'

type TextLinkProps = ComponentProps<typeof Link>

export function TextLink({ className = '', ...props }: TextLinkProps) {
  return (
    <Link
      className={`text-blue-600 underline hover:text-blue-800 ${className}`}
      {...props}
    />
  )
}
