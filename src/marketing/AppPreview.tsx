import { ArrowUpRight, Check, Send, Users, Clock3 } from 'lucide-react'
import { useInterfaceCopy } from '../i18n/interfaceCopy'
import { useI18n } from '../i18n'
import { useBrandCopy } from './brandCopy'

/** Live typeset sample screens: labels follow the selected language, without account APIs. */
export function AppPreview({ screen }: { screen: 'send' | 'people' | 'activity' }) {
  const p = useInterfaceCopy()
  const { lang, dir, t } = useI18n()
  const copy = useBrandCopy()
  const usd = (n: number) => new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD' }).format(n)
  return (
    <div className="app-preview" dir={dir} data-screen={screen}>
      <div className="app-preview-top">
        <strong>XpressTend</strong>
        <span>{p('Demo')}</span>
      </div>
      <div className="app-preview-content">
        <p>{p('Clear at every step.')}</p>
        <h3>{copy[screen]}</h3>
        {screen === 'send' ? (
          <>
            <label>{p('Recipient')}</label>
            <div className="app-preview-person">
              <span>GW</span>
              <strong>
                Grace Wanjiku<small>{new Intl.DisplayNames([lang], { type: 'region' }).of('KE')}</small>
              </strong>
              <ArrowUpRight size={18} />
            </div>
            <label>{p('Sample amount')}</label>
            <div className="app-preview-amount">
              <strong>{usd(125.5)}</strong>
              <span>USD</span>
            </div>
            <dl>
              <div>
                <dt>{p('Sample fee')}</dt>
                <dd>{usd(0.99)}</dd>
              </div>
              <div>
                <dt>{p('Illustrative total')}</dt>
                <dd>{usd(126.49)}</dd>
              </div>
            </dl>
            <div className="app-preview-action">
              {t('common.continue')}
              <ArrowUpRight size={18} />
            </div>
          </>
        ) : screen === 'people' ? (
          <>
            {['Grace Wanjiku', 'Daniel Otieno', 'Peter Kamau'].map((name, index) => (
              <div className="app-preview-person" key={name}>
                <span>
                  {name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </span>
                <strong>
                  {name}
                  <small>
                    {p('Sample recipient')} · {index + 1}
                  </small>
                </strong>
                <ArrowUpRight size={17} />
              </div>
            ))}
            <div className="app-preview-note">{p('Sample recipients for this tour.')}</div>
          </>
        ) : (
          <>
            <div className="app-preview-activity">
              <Check size={26} />
              <strong>{p('Demo complete')}</strong>
              <p>Grace Wanjiku</p>
              <b>{usd(125.5)}</b>
              <small>{p('No money sent')}</small>
            </div>
            <div className="app-preview-note">{p('This timeline contains demo activity only.')}</div>
          </>
        )}
      </div>
      <div className="app-preview-bottom">
        {[Send, Users, Clock3].map((Icon, i) => (
          <span key={i} className={['send', 'people', 'activity'][i] === screen ? 'active' : ''}>
            <Icon size={19} />
          </span>
        ))}
      </div>
    </div>
  )
}
