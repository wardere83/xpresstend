import logo32 from '../assets/brand/logo-32.png'
import logo64 from '../assets/brand/logo-64.png'
import logo96 from '../assets/brand/logo-96.png'
import inv32 from '../assets/brand/logo-inverse-32.png'
import inv64 from '../assets/brand/logo-inverse-64.png'
import inv96 from '../assets/brand/logo-inverse-96.png'
import { brand } from '../config/brand'

/**
 * The XpressTend lockup.
 *
 * Served at 1x/2x/3x so it stays crisp on retina and phone screens rather than
 * being upscaled from a single bitmap. `dark` swaps to a variant whose wordmark
 * is white, because the black half of the logo disappears on the dark screens.
 *
 * Height is fixed and width is auto, so the 5.39:1 lockup can never be squashed
 * by a flex parent. width/height are declared to reserve the box before the
 * image loads and stop the header shifting.
 */
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
    ? `${inv32} 1x, ${inv64} 2x, ${inv96} 3x`
    : `${logo32} 1x, ${logo64} 2x, ${logo96} 3x`

  return (
    <img
      src={src}
      srcSet={srcSet}
      alt={brand.name}
      width={Math.round((height * 1823) / 338)}
      height={height}
      style={{ height }}
      draggable={false}
      decoding="async"
      className={`w-auto max-w-full select-none ${className}`}
    />
  )
}
