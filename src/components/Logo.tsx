import { brand } from '../config/brand'

/**
 * The XpressTend lockup.
 *
 * Set as live text rather than shipped as artwork. The mark is pure typography
 * with no graphic element, so a bitmap buys nothing and costs a great deal: the
 * previous version was six PNGs, two tones at three densities, each baked onto
 * its own background. Any surface that was not white or near-black showed the
 * baked ground as a visible rectangle, and the whole set had to be re-exported
 * to change one thing.
 *
 * As text it has no background at all, takes its colour from whatever it sits
 * on through `currentColor`, and stays sharp at any size on any screen. Placing
 * it on navy, on white, or on a photograph all work without a separate file,
 * which is what "does not clash with the background" actually requires.
 *
 * `height` is the height of the whole lockup, so existing call sites keep their
 * sizing. Type scales from it rather than being fixed, so the mark holds its
 * proportions from a 20px footer to a splash screen.
 */
export function Logo({
  tone,
  height = 32,
  variant = 'wordmark',
  className = '',
}: {
  /**
   * Retained so existing callers keep working. `dark` forces white, `light`
   * forces navy, and omitting it inherits the surrounding text colour, which
   * is what most placements should do.
   */
  tone?: 'light' | 'dark'
  height?: number
  /**
   * `wordmark` is XpressTend alone, for headers and other tight horizontal
   * space. `full` stacks Financial Services beneath it, for the footer, auth
   * screens and anywhere the mark is being presented rather than worn.
   */
  variant?: 'wordmark' | 'full'
  className?: string
}) {
  const full = variant === 'full'

  /*
   * The wordmark fills the height on its own. In the stacked lockup the two
   * lines and the gap between them share it, in roughly the 0.58 / 0.34 ratio
   * the artwork uses, so both variants read as the same mark at the same size.
   */
  const primarySize = full ? height * 0.58 : height * 0.82
  const secondarySize = height * 0.34

  const colour =
    tone === 'dark' ? '#FFFFFF' : tone === 'light' ? 'var(--color-brand-600)' : 'currentColor'

  return (
    <span
      className={`inline-flex select-none flex-col justify-center leading-none ${className}`}
      style={{ height, color: colour }}
      /* One accessible name for the whole lockup, so a screen reader announces
         the company rather than spelling out two stacked lines. */
      role="img"
      aria-label={full ? `${brand.name} Financial Services` : brand.name}
    >
      <span
        aria-hidden="true"
        style={{
          fontFamily: "'Jost', 'Century Gothic', 'Avenir Next', ui-sans-serif, system-ui, sans-serif",
          fontSize: primarySize,
          fontWeight: 300,
          letterSpacing: '-0.005em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {brand.name}
      </span>
      {full ? (
        <span
          aria-hidden="true"
          style={{
            fontFamily: "'Jost', 'Century Gothic', 'Avenir Next', ui-sans-serif, system-ui, sans-serif",
            fontSize: secondarySize,
            fontWeight: 300,
            /* The artwork sets the second line slightly open, which is what
               stops it reading as a caption and keeps it part of the mark. */
            letterSpacing: '0.01em',
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
          }}
        >
          Financial Services
        </span>
      ) : null}
    </span>
  )
}
