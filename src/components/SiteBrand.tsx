import { Link } from 'react-router-dom'
import { brand } from '../config/brand'
import { Logo } from './Logo'
import './site-brand.css'

/** One lockup and home link for public and account-entry page headers. */
export function SiteBrand({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label={brand.name}
      className={`site-header-brand ${className}`}
    >
      <Logo variant="full" height={36} />
    </Link>
  )
}
