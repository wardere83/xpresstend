import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Accessibility as AccessibilityIcon, X, RotateCcw } from 'lucide-react'
import { useI18n } from '../i18n'
import { readPassage, type Passage } from '../marketing/siteContent'
import { ACCESSIBILITY_EVENT } from './motion'
import './accessibility.css'

type Settings = {
  text: 'default' | 'large' | 'largest'
  contrast: boolean
  links: boolean
  spacing: boolean
  font: boolean
  motion: 'system' | 'reduce'
}
const defaults: Settings = {
  text: 'default',
  contrast: false,
  links: false,
  spacing: false,
  font: false,
  motion: 'system',
}
const key = 'xpresstend.accessibility'
function readSettings(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem(key) || 'null')
    return s
      ? {
          text: ['default', 'large', 'largest'].includes(s.text) ? s.text : 'default',
          contrast: s.contrast === true,
          links: s.links === true,
          spacing: s.spacing === true,
          font: s.font === true,
          motion: s.motion === 'reduce' ? 'reduce' : 'system',
        }
      : defaults
  } catch {
    return defaults
  }
}
const copy = {
  title: ['Accessibility', 'Accesibilidad', 'Acessibilidade', 'إمكانية الوصول'],
  intro: [
    'Adjust the experience to suit you. Your preferences stay on this device.',
    'Adapte la experiencia a sus necesidades. Las preferencias se guardan en este dispositivo.',
    'Adapte a experiência às suas necessidades. As preferências ficam neste aparelho.',
    'عدّل التجربة بما يناسبك. تُحفظ تفضيلاتك على هذا الجهاز.',
  ],
  close: [
    'Close accessibility settings',
    'Cerrar ajustes de accesibilidad',
    'Fechar ajustes de acessibilidade',
    'إغلاق إعدادات إمكانية الوصول',
  ],
  text: ['Text size', 'Tamaño del texto', 'Tamanho do texto', 'حجم النص'],
  standard: ['Default', 'Predeterminado', 'Padrão', 'افتراضي'],
  large: ['Larger text', 'Texto más grande', 'Texto maior', 'نص أكبر'],
  largest: ['Largest text', 'Texto de mayor tamaño', 'Texto ainda maior', 'أكبر حجم للنص'],
  contrast: ['Increase contrast', 'Aumentar contraste', 'Aumentar contraste', 'زيادة التباين'],
  links: ['Underline links', 'Subrayar enlaces', 'Sublinhar links', 'تسطير الروابط'],
  spacing: [
    'Roomier text spacing',
    'Mayor espaciado del texto',
    'Maior espaçamento do texto',
    'تباعد أوسع للنص',
  ],
  font: [
    'Use a clear reading font',
    'Usar una fuente de lectura clara',
    'Usar uma fonte de leitura clara',
    'استخدام خط واضح للقراءة',
  ],
  motion: ['Motion', 'Movimiento', 'Movimento', 'الحركة'],
  system: [
    'Use device setting',
    'Usar ajuste del dispositivo',
    'Usar ajuste do aparelho',
    'استخدام إعداد الجهاز',
  ],
  reduce: ['Reduce motion', 'Reducir movimiento', 'Reduzir movimento', 'تقليل الحركة'],
  reset: [
    'Reset preferences',
    'Restablecer preferencias',
    'Redefinir preferências',
    'إعادة التفضيلات الافتراضية',
  ],
  keyboard: [
    'Keyboard: use Tab to move, Enter to select and Escape to close this panel. Browser zoom and screen readers continue to work.',
    'Teclado: use Tab para desplazarse, Intro para seleccionar y Escape para cerrar este panel. El zoom y los lectores de pantalla del navegador siguen funcionando.',
    'Teclado: use Tab para navegar, Enter para selecionar e Escape para fechar este painel. O zoom e os leitores de tela do navegador continuam funcionando.',
    'بلوحة المفاتيح: استخدم Tab للتنقل وEnter للاختيار وEscape لإغلاق اللوحة. يظل تكبير المتصفح وقارئات الشاشة متاحين.',
  ],
  support: [
    'Accessibility help',
    'Ayuda de accesibilidad',
    'Ajuda de acessibilidade',
    'المساعدة في إمكانية الوصول',
  ],
  saved: [
    'Preferences updated.',
    'Preferencias actualizadas.',
    'Preferências atualizadas.',
    'تم تحديث التفضيلات.',
  ],
} satisfies Record<string, Passage>
export function Accessibility() {
  const { lang, dir } = useI18n()
  const { pathname } = useLocation()
  const id = useId()
  const [settings, setSettings] = useState<Settings>(readSettings)
  const [open, setOpen] = useState(false)
  const [changed, setChanged] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const root = document.documentElement
    root.dataset.a11yText = settings.text
    root.dataset.a11yContrast = String(settings.contrast)
    root.dataset.a11yLinks = String(settings.links)
    root.dataset.a11ySpacing = String(settings.spacing)
    root.dataset.a11yFont = String(settings.font)
    root.dataset.a11yMotion = settings.motion
    try {
      localStorage.setItem(key, JSON.stringify(settings))
    } catch {
      /* Preferences still work for this visit. */
    }
    window.dispatchEvent(new Event(ACCESSIBILITY_EVENT))
  }, [settings])
  useEffect(() => {
    const openPanel = () => setOpen(true)
    window.addEventListener('xpresstend:open-accessibility', openPanel)
    return () => window.removeEventListener('xpresstend:open-accessibility', openPanel)
  }, [])
  useEffect(() => {
    const node = dialog.current
    if (open && !node?.open) node?.showModal()
    else if (!open && node?.open) node.close()
  }, [open])
  const update = (patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }))
    setChanged(true)
  }
  const product =
    /^\/(demo|app|send|review|success|recipients|activity|profile|verify-identity|help|rates)$/.test(pathname)
  return (
    <aside className="a11y-tools" lang={lang} dir={dir} aria-label={readPassage(copy.title, lang)}>
      <button
        className="a11y-launcher"
        data-product={product}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-dialog`}
        onClick={() => setOpen(true)}
      >
        <AccessibilityIcon size={21} aria-hidden="true" />
        <span>{readPassage(copy.title, lang)}</span>
      </button>
      <dialog
        ref={dialog}
        id={`${id}-dialog`}
        className="a11y-dialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-intro`}
        onClose={() => setOpen(false)}
      >
        <header>
          <h2 id={`${id}-title`}>{readPassage(copy.title, lang)}</h2>
          <button
            type="button"
            className="a11y-close"
            onClick={() => setOpen(false)}
            aria-label={readPassage(copy.close, lang)}
          >
            <X size={20} />
          </button>
        </header>
        <p id={`${id}-intro`}>{readPassage(copy.intro, lang)}</p>
        <div className="a11y-select">
          <label htmlFor={`${id}-text`}>{readPassage(copy.text, lang)}</label>
          <select
            id={`${id}-text`}
            value={settings.text}
            onChange={(e) => update({ text: e.target.value as Settings['text'] })}
          >
            <option value="default">{readPassage(copy.standard, lang)}</option>
            <option value="large">{readPassage(copy.large, lang)}</option>
            <option value="largest">{readPassage(copy.largest, lang)}</option>
          </select>
        </div>
        {(['contrast', 'links', 'spacing', 'font'] as const).map((setting) => (
          <label className="a11y-toggle" key={setting}>
            <span>{readPassage(copy[setting], lang)}</span>
            <input
              type="checkbox"
              checked={settings[setting]}
              onChange={(e) => update({ [setting]: e.target.checked })}
            />
          </label>
        ))}
        <div className="a11y-select">
          <label htmlFor={`${id}-motion`}>{readPassage(copy.motion, lang)}</label>
          <select
            id={`${id}-motion`}
            value={settings.motion}
            onChange={(e) => update({ motion: e.target.value as Settings['motion'] })}
          >
            <option value="system">{readPassage(copy.system, lang)}</option>
            <option value="reduce">{readPassage(copy.reduce, lang)}</option>
          </select>
        </div>
        <p className="a11y-help">{readPassage(copy.keyboard, lang)}</p>
        <p role="status" className="a11y-saved">
          {changed ? readPassage(copy.saved, lang) : ''}
        </p>
        <footer>
          <button
            type="button"
            onClick={() => {
              setSettings({ ...defaults })
              setChanged(true)
            }}
          >
            <RotateCcw size={15} />
            {readPassage(copy.reset, lang)}
          </button>
          <a href="mailto:support@xpresstend.com?subject=Accessibility%20help">
            {readPassage(copy.support, lang)}
          </a>
        </footer>
      </dialog>
    </aside>
  )
}

export function AccessibilityLink() {
  const { lang } = useI18n()
  return (
    <button
      type="button"
      className="accessibility-link"
      onClick={() => window.dispatchEvent(new Event('xpresstend:open-accessibility'))}
    >
      {readPassage(copy.title, lang)}
    </button>
  )
}
