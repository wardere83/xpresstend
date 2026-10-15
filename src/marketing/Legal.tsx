import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { brand } from '../config/brand'
import { useI18n } from '../i18n'
import { ContentSections, InstitutionalActions, Q, Shell } from './PageShell'
import { privacyPage, readPassage, siteLabels, supportPage, type Passage } from './siteContent'

const routes: { subject: string; title: Passage; description: Passage }[] = [
  {
    subject: 'Institutional enquiry',
    title: [
      'Institutional enquiries',
      'Consultas institucionales',
      'Consultas institucionais',
      'الاستفسارات المؤسسية',
    ],
    description: [
      'Banking, investment, fintech and integration documentation.',
      'Banca, inversión, tecnología financiera y documentación de integración.',
      'Bancos, investimentos, tecnologia financeira e documentação de integração.',
      'البنوك والاستثمار والتقنية المالية ووثائق التكامل.',
    ],
  },
  {
    subject: 'Financial Literacy enquiry',
    title: [
      'Financial Literacy enquiries',
      'Consultas sobre educación financiera',
      'Consultas sobre educação financeira',
      'استفسارات الثقافة المالية',
    ],
    description: [
      'Community programs, schools and local organisations.',
      'Programas comunitarios, escuelas y organizaciones locales.',
      'Programas comunitários, escolas e organizações locais.',
      'البرامج المجتمعية والمدارس والمنظمات المحلية.',
    ],
  },
  {
    subject: 'Compliance enquiry',
    title: [
      'Compliance enquiries',
      'Consultas de cumplimiento',
      'Consultas de conformidade',
      'استفسارات الامتثال',
    ],
    description: [
      'Company registration, operational controls and institutional review.',
      'Registro de la empresa, controles operativos y revisión institucional.',
      'Registro da empresa, controles operacionais e análise institucional.',
      'تسجيل الشركة والضوابط التشغيلية والمراجعة المؤسسية.',
    ],
  },
  {
    subject: 'Customer support',
    title: ['Customer support', 'Atención al cliente', 'Suporte ao cliente', 'دعم العملاء'],
    description: [
      'Account access, recovery and product assistance.',
      'Acceso a la cuenta, recuperación y ayuda con el producto.',
      'Acesso à conta, recuperação e ajuda com o produto.',
      'الدخول إلى الحساب واسترداده والمساعدة في المنتج.',
    ],
  },
  {
    subject: 'Security report',
    title: ['Security reports', 'Informes de seguridad', 'Relatos de segurança', 'البلاغات الأمنية'],
    description: [
      'Potential vulnerabilities or suspicious account activity.',
      'Posibles vulnerabilidades o actividad sospechosa en la cuenta.',
      'Possíveis vulnerabilidades ou atividade suspeita na conta.',
      'الثغرات المحتملة أو النشاط المشبوه في الحساب.',
    ],
  },
  {
    subject: 'Privacy request',
    title: ['Privacy requests', 'Solicitudes de privacidad', 'Solicitações de privacidade', 'طلبات الخصوصية'],
    description: [
      'Data access, correction and account closure.',
      'Acceso a datos, corrección y cierre de la cuenta.',
      'Acesso a dados, correção e encerramento da conta.',
      'الوصول إلى البيانات وتصحيحها وإغلاق الحساب.',
    ],
  },
  {
    subject: 'Complaint',
    title: ['Complaints', 'Reclamaciones', 'Reclamações', 'الشكاوى'],
    description: [
      'Concerns about your experience and the outcome you seek.',
      'Problemas con su experiencia y el resultado que busca.',
      'Problemas na sua experiência e o resultado desejado.',
      'المشكلات المتعلقة بتجربتك والنتيجة التي تطلبها.',
    ],
  },
]
function EnquiryPicker() {
  const { lang } = useI18n()
  const [index, setIndex] = useState(0)
  const route = routes[index]
  const label: Passage = [
    'Choose an enquiry type',
    'Elija un tipo de consulta',
    'Escolha o tipo de consulta',
    'اختر نوع الاستفسار',
  ]
  return (
    <div className="enquiry-picker">
      <label htmlFor="enquiry-type">{readPassage(label, lang)}</label>
      <select id="enquiry-type" value={index} onChange={(e) => setIndex(Number(e.target.value))}>
        {routes.map((r, i) => (
          <option key={r.subject} value={i}>
            {readPassage(r.title, lang)}
          </option>
        ))}
      </select>
      <p role="status">{readPassage(route.description, lang)}</p>
      <a href={`mailto:${brand.support.email}?subject=${encodeURIComponent(route.subject)}`}>
        {readPassage(siteLabels.contact, lang)}
        <ArrowUpRight size={16} />
      </a>
    </div>
  )
}
export function Privacy() {
  const { lang } = useI18n()
  const date = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date('2026-10-15T00:00:00Z'),
  )
  return (
    <Shell
      title={readPassage(privacyPage.title, lang)}
      intro={readPassage(privacyPage.intro, lang)}
      updated={date}
    >
      <ContentSections page={privacyPage} />
      <p className="mt-8">
        <Link className="underline" to="/support">
          {readPassage(siteLabels.contact, lang)}
        </Link>
      </p>
    </Shell>
  )
}
export function Support() {
  const { lang } = useI18n()
  return (
    <Shell title={readPassage(supportPage.title, lang)} intro={readPassage(supportPage.intro, lang)}>
      <InstitutionalActions />
      <ContentSections
        page={supportPage}
        extra={(id) =>
          id === 'contact' ? (
            <EnquiryPicker />
          ) : id === 'questions' ? (
            <>
              <Q
                q={readPassage(
                  [
                    'How can I recover my account?',
                    '¿Cómo puedo recuperar mi cuenta?',
                    'Como posso recuperar minha conta?',
                    'كيف أسترد حسابي؟',
                  ],
                  lang,
                )}
              >
                <Link className="underline" to="/forgot-password">
                  {readPassage(
                    [
                      'Open password recovery',
                      'Abrir recuperación de contraseña',
                      'Abrir recuperação de senha',
                      'فتح استرداد كلمة المرور',
                    ],
                    lang,
                  )}
                </Link>
              </Q>
              <Q
                q={readPassage(
                  [
                    'How do I request my data?',
                    '¿Cómo solicito mis datos?',
                    'Como solicito meus dados?',
                    'كيف أطلب بياناتي؟',
                  ],
                  lang,
                )}
              >
                <Link className="underline" to="/privacy">
                  {readPassage(siteLabels.privacy, lang)}
                </Link>
              </Q>
            </>
          ) : id === 'complaints' ? (
            <div className="flex flex-wrap gap-5">
              <a
                className="underline"
                href="https://dfi.wa.gov/consumers/complaint"
                target="_blank"
                rel="noopener noreferrer"
              >
                Washington DFI
              </a>
              <a
                className="underline"
                href="https://www.consumerfinance.gov/complaint/"
                target="_blank"
                rel="noopener noreferrer"
              >
                CFPB
              </a>
            </div>
          ) : null
        }
      />
    </Shell>
  )
}
