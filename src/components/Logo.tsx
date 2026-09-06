import logo32 from '../assets/brand/logo-32.png'
import logo64 from '../assets/brand/logo-64.png'
import logo96 from '../assets/brand/logo-96.png'
import logo192 from '../assets/brand/logo-192.png'
import inv32 from '../assets/brand/logo-inverse-32.png'
import inv64 from '../assets/brand/logo-inverse-64.png'
import inv96 from '../assets/brand/logo-inverse-96.png'
import inv192 from '../assets/brand/logo-inverse-192.png'
import { brand } from '../config/brand'

/**
 * The XpressTend wordmark.
 *
 * Sourced from the compliance-approved lockup: navy ink on transparency for
 * light surfaces, white ink on transparency for dark surfaces, so the mark
 * never fights the background it lands on. Served at 1x/2x/3x/6x so it stays
 * crisp on retina and phone screens rather than being upscaled from a single
 * bitmap. `dark` swaps to the white-ink variant, because the light lockup
 * disappears on navy.
 *
 * Height is fixed and width is auto, so the lockup can never be squashed by a
 * flex parent. The aspect ratio is the source file's own (602:214), reserved
 * up front so the header never shifts while the image loads.
 */
const ASPECT = 602 / 214

export function Logo({
  tone = 'light',
  height = 32,
  className = '',
}: {
  tone?: 'light' | 'dark'
  height?: number
  className?: string
}) {
  const dark = tone === 'dark'
  const src = dark ? inv32 : logo32
  const srcSet = dark
    ? `${inv32} 1x, ${inv64} 2x, ${inv96} 3x, ${inv192} 6x`
    : `${logo32} 1x, ${logo64} 2x, ${logo96} 3x, ${logo192} 6x`

  return (
    <img
      src={src}
      srcSet={srcSet}
      alt={brand.name}
      width={Math.round(height * ASPECT)}
      height={height}
      style={{ height, aspectRatio: `${ASPECT}` }}
      draggable={false}
      decoding="async"
      className={`w-auto max-w-full select-none ${className}`}
    />
  )
}
