import type { Lang } from '../i18n'

/** Every published passage has an explicit version in each supported language. */
export type Passage = readonly [string, string, string, string]
export const readPassage = (value: Passage, lang: Lang) =>
  value[({ en: 0, es: 1, 'pt-BR': 2, ar: 3 } as const)[lang]]
export type PageSection = { id: string; title: Passage; paragraphs: Passage[] }
export type SitePage = { title: Passage; intro: Passage; sections: PageSection[] }
export const siteLabels = {
  contents: ['On this page', 'En esta página', 'Nesta página', 'في هذه الصفحة'],
  details: ['Explore the details', 'Ver los detalles', 'Explore os detalhes', 'استكشف التفاصيل'],
  contact: ['Contact the team', 'Contactar con el equipo', 'Fale com a equipe', 'تواصل مع الفريق'],
  demo: ['Explore app demo', 'Explorar la demo', 'Explorar demonstração', 'استكشف التطبيق التجريبي'],
  resources: ['Company resources', 'Recursos de la empresa', 'Recursos da empresa', 'موارد الشركة'],
  updated: ['Last updated', 'Última actualización', 'Última atualização', 'آخر تحديث'],
  rights: [
    'All rights reserved.',
    'Todos los derechos reservados.',
    'Todos os direitos reservados.',
    'جميع الحقوق محفوظة.',
  ],
  operating: [
    'XpressTend is completing state money transmitter licensing and banking partner onboarding. Customer transfers are not yet being processed, and XpressTend does not hold or move customer funds.',
    'XpressTend está completando las licencias estatales de transmisión de dinero y la incorporación de socios bancarios. Todavía no se procesan transferencias de clientes y XpressTend no mantiene ni mueve fondos de clientes.',
    'A XpressTend está concluindo o licenciamento estadual para transmissão de dinheiro e a integração de parceiros bancários. As transferências de clientes ainda não são processadas, e a XpressTend não mantém nem movimenta fundos de clientes.',
    'تستكمل XpressTend تراخيص تحويل الأموال على مستوى الولايات وإجراءات ضم الشركاء المصرفيين. لا تجري معالجة تحويلات العملاء بعد، ولا تحتفظ XpressTend بأموال العملاء أو تنقلها.',
  ],
  status: [
    'Official sanctions data status',
    'Estado de los datos oficiales de sanciones',
    'Status dos dados oficiais de sanções',
    'حالة بيانات العقوبات الرسمية',
  ],
  checking: [
    'Checking the official OFAC dataset…',
    'Comprobando los datos oficiales de la OFAC…',
    'Verificando os dados oficiais da OFAC…',
    'جارٍ التحقق من بيانات OFAC الرسمية…',
  ],
  ready: [
    'A current official OFAC dataset is loaded for platform screening.',
    'La plataforma dispone de datos oficiales actualizados de la OFAC para las comprobaciones.',
    'A plataforma dispõe de dados oficiais atualizados da OFAC para as verificações.',
    'تتوفر على المنصة بيانات OFAC الرسمية المحدّثة لإجراء الفحص.',
  ],
  unavailable: [
    'Current sanctions data availability could not be verified. Transfers require a current official dataset before they can proceed.',
    'No se pudo verificar la disponibilidad de datos de sanciones actualizados. Las transferencias requieren datos oficiales vigentes para continuar.',
    'Não foi possível verificar a disponibilidade de dados de sanções atualizados. As transferências exigem dados oficiais vigentes para prosseguir.',
    'تعذر التحقق من توفر بيانات عقوبات محدّثة. تتطلب متابعة التحويلات بيانات رسمية سارية.',
  ],
  refresh: ['Refresh status', 'Actualizar estado', 'Atualizar status', 'تحديث الحالة'],
  source: [
    'Last successful source check',
    'Última comprobación correcta de la fuente',
    'Última verificação bem-sucedida da fonte',
    'آخر تحقق ناجح من المصدر',
  ],
  privacy: ['Privacy policy', 'Política de privacidad', 'Política de privacidade', 'سياسة الخصوصية'],
  support: ['Contact and support', 'Contacto y asistencia', 'Contato e suporte', 'التواصل والدعم'],
  skip: ['Skip to content', 'Ir al contenido', 'Ir para o conteúdo', 'الانتقال إلى المحتوى'],
} satisfies Record<string, Passage>

export const sitePages = {
  company: {
    title: ['About XpressTend', 'Acerca de XpressTend', 'Sobre a XpressTend', 'عن XpressTend'],
    intro: [
      'Seattle roots. Cross-border connections. A clear, accountable approach to remittances.',
      'Raíces en Seattle. Conexiones internacionales. Un enfoque claro y responsable de las remesas.',
      'Raízes em Seattle. Conexões internacionais. Uma abordagem clara e responsável para remessas.',
      'جذور في سياتل. وتواصل عبر الحدود. ونهج واضح ومسؤول لتحويل الأموال.',
    ],
    sections: [
      {
        id: 'mission',
        title: [
          'Connecting people across borders',
          'Conectamos personas a través de las fronteras',
          'Conectando pessoas além das fronteiras',
          'نصل بين الناس عبر الحدود',
        ],
        paragraphs: [
          [
            'XpressTend Financial Services is a Seattle-based cross-border payments company. We focus on US-originated remittances, transparent pricing and accessible digital experiences.',
            'XpressTend Financial Services es una empresa de pagos internacionales con sede en Seattle. Nos centramos en las remesas desde Estados Unidos, los precios transparentes y las experiencias digitales accesibles.',
            'A XpressTend Financial Services é uma empresa de pagamentos internacionais sediada em Seattle. Nosso foco são as remessas originadas nos Estados Unidos, os preços transparentes e as experiências digitais acessíveis.',
            'XpressTend Financial Services شركة مدفوعات دولية مقرها سياتل. نركز على التحويلات الصادرة من الولايات المتحدة والتسعير الشفاف والتجارب الرقمية سهلة الاستخدام.',
          ],
          [
            'Customers can review amounts and fees, manage recipients and keep transaction records together. Our demonstration lets institutions explore the experience without moving money.',
            'Los clientes pueden revisar importes y comisiones, gestionar destinatarios y consultar sus registros de transacciones en un solo lugar. Nuestra demostración permite a las instituciones explorar la experiencia sin mover dinero.',
            'Os clientes podem conferir valores e tarifas, gerenciar destinatários e consultar registros de transações em um só lugar. Nossa demonstração permite que instituições explorem a experiência sem movimentar dinheiro.',
            'يمكن للعملاء مراجعة المبالغ والرسوم وإدارة المستلمين والاحتفاظ بسجلات المعاملات في مكان واحد. وتتيح تجربتنا التوضيحية للمؤسسات استكشاف الخدمة دون نقل أموال.',
          ],
        ],
      },
      {
        id: 'facts',
        title: [
          'Company information',
          'Información de la empresa',
          'Informações da empresa',
          'معلومات الشركة',
        ],
        paragraphs: [
          [
            'Headquarters: Seattle, Washington, USA. NMLS ID 2900672. Product languages: English, Spanish, Brazilian Portuguese and Arabic.',
            'Sede: Seattle, Washington, Estados Unidos. NMLS ID 2900672. Idiomas del producto: inglés, español, portugués de Brasil y árabe.',
            'Sede: Seattle, Washington, Estados Unidos. NMLS ID 2900672. Idiomas do produto: inglês, espanhol, português do Brasil e árabe.',
            'المقر الرئيسي: سياتل، واشنطن، الولايات المتحدة. رقم NMLS هو 2900672. لغات المنتج: الإنجليزية والإسبانية والبرتغالية البرازيلية والعربية.',
          ],
        ],
      },
      {
        id: 'markets',
        title: ['Market focus', 'Mercados de interés', 'Mercados de interesse', 'الأسواق المستهدفة'],
        paragraphs: [
          [
            'Our current market focus includes Kenya, Ethiopia, Brazil and Mexico. Service availability depends on licensing, banking and payout arrangements.',
            'Nuestros mercados de interés actuales incluyen Kenia, Etiopía, Brasil y México. La disponibilidad del servicio depende de las licencias y de los acuerdos bancarios y de pago.',
            'Nosso foco atual inclui Quênia, Etiópia, Brasil e México. A disponibilidade do serviço depende das licenças e dos acordos bancários e de pagamento.',
            'تشمل أسواقنا المستهدفة حالياً كينيا وإثيوبيا والبرازيل والمكسيك. يعتمد توفر الخدمة على التراخيص والترتيبات المصرفية وترتيبات الصرف.',
          ],
        ],
      },
      {
        id: 'approach',
        title: [
          'Clarity, accountability and community',
          'Claridad, responsabilidad y comunidad',
          'Clareza, responsabilidade e comunidade',
          'الوضوح والمساءلة والمجتمع',
        ],
        paragraphs: [
          [
            'Clear customer information, controlled access and traceable records guide our operations. Our compliance and security pages explain the controls relevant to institutional review.',
            'La información clara para los clientes, el acceso controlado y los registros trazables guían nuestras operaciones. Las páginas de cumplimiento y seguridad explican los controles pertinentes para la revisión institucional.',
            'Informações claras para os clientes, acesso controlado e registros rastreáveis orientam nossas operações. As páginas de conformidade e segurança explicam os controles relevantes para a análise institucional.',
            'توجّه عملياتنا معلومات واضحة للعملاء ووصول خاضع للضوابط وسجلات قابلة للتتبع. وتشرح صفحتا الامتثال والأمان الضوابط ذات الصلة بالمراجعة المؤسسية.',
          ],
          [
            'Through XpressTend Financial Literacy, we invest in real money skills and lasting upward mobility alongside the communities we serve.',
            'A través de XpressTend Financial Literacy, invertimos en habilidades financieras prácticas y en un progreso social duradero junto a las comunidades a las que servimos.',
            'Por meio do XpressTend Financial Literacy, investimos em habilidades financeiras práticas e em mobilidade social duradoura junto às comunidades que atendemos.',
            'من خلال XpressTend Financial Literacy، نستثمر مع المجتمعات التي نخدمها في مهارات مالية عملية وفرص تقدم اجتماعي واقتصادي مستدام.',
          ],
        ],
      },
      {
        id: 'contact',
        title: [
          'Contact the company',
          'Contactar con la empresa',
          'Entre em contato com a empresa',
          'التواصل مع الشركة',
        ],
        paragraphs: [
          [
            'Financial institutions, investors, technology providers and community organisations can contact our team to discuss the company, integration requirements and supporting documentation.',
            'Las instituciones financieras, los inversores, los proveedores tecnológicos y las organizaciones comunitarias pueden contactar con nuestro equipo para hablar de la empresa, los requisitos de integración y la documentación de respaldo.',
            'Instituições financeiras, investidores, fornecedores de tecnologia e organizações comunitárias podem falar com nossa equipe sobre a empresa, os requisitos de integração e a documentação de apoio.',
            'يمكن للمؤسسات المالية والمستثمرين ومزودي التقنية والمنظمات المجتمعية التواصل مع فريقنا لمناقشة الشركة ومتطلبات التكامل والوثائق الداعمة.',
          ],
        ],
      },
    ],
  },
  compliance: {
    title: ['Compliance', 'Cumplimiento', 'Conformidade', 'الامتثال'],
    intro: [
      'Registration, operational controls and service readiness for institutional review.',
      'Registro, controles operativos y preparación del servicio para la revisión institucional.',
      'Registro, controles operacionais e preparação do serviço para análise institucional.',
      'التسجيل والضوابط التشغيلية وجاهزية الخدمة للمراجعة المؤسسية.',
    ],
    sections: [
      {
        id: 'registration',
        title: ['Company registration', 'Registro de la empresa', 'Registro da empresa', 'تسجيل الشركة'],
        paragraphs: [
          [
            'XpressTend Financial Services. NMLS ID 2900672. Registration information and service availability should be reviewed separately from individual platform controls.',
            'XpressTend Financial Services. NMLS ID 2900672. La información de registro y la disponibilidad del servicio deben revisarse por separado de los controles individuales de la plataforma.',
            'XpressTend Financial Services. NMLS ID 2900672. As informações de registro e a disponibilidade do serviço devem ser analisadas separadamente dos controles individuais da plataforma.',
            'XpressTend Financial Services. رقم NMLS هو 2900672. يجب مراجعة معلومات التسجيل وتوفر الخدمة بصورة منفصلة عن الضوابط الفردية للمنصة.',
          ],
        ],
      },
      {
        id: 'status',
        title: [
          'Service availability',
          'Disponibilidad del servicio',
          'Disponibilidade do serviço',
          'توفر الخدمة',
        ],
        paragraphs: [siteLabels.operating],
      },
      {
        id: 'identity',
        title: [
          'Customer identification',
          'Identificación del cliente',
          'Identificação do cliente',
          'التحقق من هوية العملاء',
        ],
        paragraphs: [
          [
            'Unverified accounts cannot create transfers. The identity workflow supports government ID, selfie and liveness checks through a configured provider. Provider activation remains a prerequisite for live verification.',
            'Las cuentas sin verificar no pueden crear transferencias. El proceso de identidad admite comprobaciones del documento oficial, del autorretrato y de presencia real mediante un proveedor configurado. Es necesario activar el proveedor para realizar verificaciones reales.',
            'Contas não verificadas não podem criar transferências. O fluxo de identidade permite verificar documento oficial, selfie e prova de vida por meio de um provedor configurado. A ativação do provedor é um requisito para verificações reais.',
            'لا تستطيع الحسابات غير المتحقق منها إنشاء تحويلات. يدعم مسار الهوية فحص الوثيقة الرسمية والصورة الذاتية والتحقق من الحضور الفعلي عبر مزود تتم تهيئته. ويظل تفعيل المزود شرطاً لإجراء تحقق فعلي.',
          ],
        ],
      },
      {
        id: 'limits',
        title: [
          'Transaction controls',
          'Controles de transacciones',
          'Controles de transações',
          'ضوابط المعاملات',
        ],
        paragraphs: [
          [
            'The platform checks per-transfer, daily, monthly and transaction-frequency limits against account history. Cancelled and failed transfers do not consume these allowances.',
            'La plataforma comprueba los límites por transferencia, diarios, mensuales y de frecuencia con el historial de la cuenta. Las transferencias canceladas y fallidas no consumen esos límites.',
            'A plataforma verifica limites por transferência, diários, mensais e de frequência com base no histórico da conta. Transferências canceladas e com falha não consomem esses limites.',
            'تتحقق المنصة من حدود كل تحويل والحدود اليومية والشهرية وحدود تكرار المعاملات استناداً إلى سجل الحساب. ولا تُحتسب التحويلات الملغاة أو الفاشلة ضمن هذه الحدود.',
          ],
          [
            'Compliance review and payout authorisation are separate. Only authorised compliance and owner roles can release payouts, with each action recorded for review.',
            'La revisión de cumplimiento y la autorización del pago son procesos separados. Solo los roles autorizados de cumplimiento y propietario pueden liberar pagos, y cada acción queda registrada para su revisión.',
            'A análise de conformidade e a autorização de pagamento são etapas separadas. Apenas os perfis autorizados de conformidade e proprietário podem liberar pagamentos, com cada ação registrada para análise.',
            'مراجعة الامتثال وترخيص الصرف خطوتان منفصلتان. ولا يُسمح بإطلاق الصرف إلا لأدوار الامتثال والمالك المخوّلة، مع تسجيل كل إجراء للمراجعة.',
          ],
        ],
      },
      {
        id: 'screening',
        title: ['Sanctions screening', 'Comprobación de sanciones', 'Verificação de sanções', 'فحص العقوبات'],
        paragraphs: [
          [
            'The platform uses official US Treasury OFAC SDN and consolidated non-SDN sanctions lists, including listed names and aliases. Senders and recipients are screened before transfer creation, payment processing and payout release.',
            'La plataforma utiliza las listas oficiales SDN y no SDN consolidadas de la OFAC del Tesoro de Estados Unidos, incluidos los nombres y alias registrados. Se comprueban remitentes y destinatarios antes de crear transferencias, procesar pagos y liberar fondos.',
            'A plataforma utiliza as listas oficiais SDN e não SDN consolidadas da OFAC do Tesouro dos Estados Unidos, incluindo nomes e pseudônimos registrados. Remetentes e destinatários são verificados antes da criação de transferências, do processamento de pagamentos e da liberação de fundos.',
            'تستخدم المنصة قوائم SDN والقوائم الموحّدة لغير SDN الرسمية التابعة لمكتب OFAC بوزارة الخزانة الأمريكية، بما فيها الأسماء والأسماء المستعارة المدرجة. ويُفحص المرسلون والمستلمون قبل إنشاء التحويل ومعالجة الدفع وإطلاق الصرف.',
          ],
          [
            'Potential matches are held for authorised staff review. A documented false-positive decision does not itself release a transfer. Unresolved matches cannot be bypassed by approving a transfer.',
            'Las posibles coincidencias quedan retenidas para su revisión por personal autorizado. Una decisión documentada de falso positivo no libera por sí sola una transferencia. Aprobar una transferencia no permite omitir coincidencias sin resolver.',
            'Possíveis correspondências ficam retidas para análise por pessoal autorizado. Uma decisão documentada de falso positivo não libera, por si só, uma transferência. Aprovar uma transferência não permite ignorar correspondências não resolvidas.',
            'تُعلّق المطابقات المحتملة لمراجعتها من الموظفين المخوّلين. ولا يؤدي توثيق قرار بأن المطابقة إيجابية كاذبة إلى إطلاق التحويل بحد ذاته. ولا يمكن تجاوز المطابقات غير المحسومة بالموافقة على التحويل.',
          ],
          [
            'Source checks are scheduled every 15 minutes. Screening stops if the dataset is unavailable or has not been successfully checked within 24 hours. Records retain dataset versions, official identifiers and staff decisions.',
            'Las comprobaciones de la fuente se programan cada 15 minutos. El proceso se detiene si los datos no están disponibles o no se han comprobado correctamente en las últimas 24 horas. Los registros conservan las versiones de los datos, los identificadores oficiales y las decisiones del personal.',
            'As verificações da fonte são programadas a cada 15 minutos. O processo é interrompido se os dados estiverem indisponíveis ou sem verificação bem-sucedida nas últimas 24 horas. Os registros preservam versões dos dados, identificadores oficiais e decisões da equipe.',
            'تُجدول عمليات التحقق من المصدر كل 15 دقيقة. ويتوقف الفحص إذا لم تتوفر البيانات أو لم يُتحقق منها بنجاح خلال 24 ساعة. وتحتفظ السجلات بإصدارات البيانات والمعرّفات الرسمية وقرارات الموظفين.',
          ],
        ],
      },
      {
        id: 'records',
        title: [
          'Records and accountability',
          'Registros y responsabilidad',
          'Registros e responsabilidade',
          'السجلات والمساءلة',
        ],
        paragraphs: [
          [
            'Verification, screening, transfers and staff actions have an audit trail. Role-based access can be revoked. Double-entry ledger records support reconciliation. Bank review APIs support scoped, expiring decisions; no partner-bank funds are moved by the review portal.',
            'La verificación, las comprobaciones, las transferencias y las acciones del personal disponen de una pista de auditoría. El acceso por roles puede revocarse. Los registros contables de partida doble respaldan la conciliación. Las API de revisión bancaria admiten decisiones limitadas y con caducidad; el portal de revisión no mueve fondos de bancos socios.',
            'Verificações, transferências e ações da equipe possuem trilha de auditoria. O acesso por perfil pode ser revogado. Registros contábeis de partidas dobradas apoiam a conciliação. As APIs de análise bancária permitem decisões com escopo e prazo definidos; o portal de análise não movimenta fundos de bancos parceiros.',
            'تتوفر سجلات تدقيق للتحقق والفحص والتحويلات وإجراءات الموظفين. ويمكن إلغاء الوصول القائم على الأدوار. وتدعم سجلات القيد المزدوج المطابقة المحاسبية. وتتيح واجهات المراجعة المصرفية قرارات محددة النطاق والصلاحية؛ ولا تنقل بوابة المراجعة أموال أي بنك شريك.',
          ],
        ],
      },
    ],
  },
  security: {
    title: ['Security and platform', 'Seguridad y plataforma', 'Segurança e plataforma', 'الأمان والمنصة'],
    intro: [
      'Account protection, access control and transaction integrity, explained clearly.',
      'Protección de cuentas, control de acceso e integridad de las transacciones, explicados con claridad.',
      'Proteção de contas, controle de acesso e integridade das transações, explicados com clareza.',
      'شرح واضح لحماية الحسابات وضبط الوصول وسلامة المعاملات.',
    ],
    sections: [
      {
        id: 'accounts',
        title: ['Account protection', 'Protección de cuentas', 'Proteção de contas', 'حماية الحسابات'],
        paragraphs: [
          [
            'Account protection includes one-way password hashing, revocable sessions, authentication rate limits and single-use recovery tokens. Device biometric unlock stays on the device; XpressTend receives only the result.',
            'La protección de cuentas incluye contraseñas con hash unidireccional, sesiones revocables, límites de intentos de autenticación y tokens de recuperación de un solo uso. El desbloqueo biométrico permanece en el dispositivo; XpressTend solo recibe el resultado.',
            'A proteção de contas inclui hash unidirecional de senhas, sessões revogáveis, limites de tentativas de autenticação e tokens de recuperação de uso único. O desbloqueio biométrico permanece no aparelho; a XpressTend recebe apenas o resultado.',
            'تشمل حماية الحسابات تجزئة كلمات المرور أحادية الاتجاه وجلسات قابلة للإلغاء وحدوداً لمحاولات المصادقة ورموز استرداد للاستخدام مرة واحدة. وتبقى بيانات الفتح البيومتري على الجهاز؛ وتتلقى XpressTend النتيجة فقط.',
          ],
        ],
      },
      {
        id: 'money',
        title: [
          'Transaction integrity',
          'Integridad de las transacciones',
          'Integridade das transações',
          'سلامة المعاملات',
        ],
        paragraphs: [
          [
            'Amounts use integer minor units with defined rounding rules. Quotes are recalculated when transfers are created. Double-entry ledger postings provide a traceable basis for balances and reconciliation.',
            'Los importes se expresan en unidades monetarias menores enteras, con reglas de redondeo definidas. Las cotizaciones se recalculan al crear las transferencias. Los asientos de partida doble ofrecen una base trazable para los saldos y la conciliación.',
            'Os valores usam unidades monetárias menores inteiras, com regras de arredondamento definidas. As cotações são recalculadas na criação das transferências. Lançamentos de partidas dobradas fornecem uma base rastreável para saldos e conciliação.',
            'تُسجّل المبالغ بوحدات العملة الصغرى كأعداد صحيحة مع قواعد تقريب محددة. وتُعاد حسابات التسعير عند إنشاء التحويلات. وتوفّر قيود القيد المزدوج أساساً قابلاً للتتبع للأرصدة والمطابقة المحاسبية.',
          ],
        ],
      },
      {
        id: 'access',
        title: ['Staff access', 'Acceso del personal', 'Acesso da equipe', 'وصول الموظفين'],
        paragraphs: [
          [
            'Viewer, agent, compliance and owner roles have distinct permissions. Staff set their own credentials through private invitations. Controls protect the last active owner from removal.',
            'Los roles de lector, agente, cumplimiento y propietario tienen permisos diferentes. El personal establece sus propias credenciales mediante invitaciones privadas. Los controles impiden eliminar al último propietario activo.',
            'Os perfis de visualizador, agente, conformidade e proprietário possuem permissões distintas. Cada funcionário define suas credenciais por meio de convite privado. Os controles impedem a remoção do último proprietário ativo.',
            'تملك أدوار المشاهد والوكيل والامتثال والمالك صلاحيات مختلفة. ويُنشئ الموظفون بيانات دخولهم عبر دعوات خاصة. وتحمي الضوابط آخر مالك نشط من الإزالة.',
          ],
        ],
      },
      {
        id: 'privacy',
        title: ['Data and privacy', 'Datos y privacidad', 'Dados e privacidade', 'البيانات والخصوصية'],
        paragraphs: [
          [
            'Platform access and transaction activity are recorded for operational review. The privacy policy explains data collection, retention and the choices available to customers.',
            'El acceso a la plataforma y la actividad de las transacciones se registran para la revisión operativa. La política de privacidad explica la recopilación y conservación de datos y las opciones de los clientes.',
            'O acesso à plataforma e a atividade das transações são registrados para análise operacional. A política de privacidade explica a coleta e a retenção de dados e as opções dos clientes.',
            'يُسجّل الوصول إلى المنصة ونشاط المعاملات للمراجعة التشغيلية. وتشرح سياسة الخصوصية جمع البيانات والاحتفاظ بها والخيارات المتاحة للعملاء.',
          ],
        ],
      },
      {
        id: 'review',
        title: ['Technical review', 'Revisión técnica', 'Análise técnica', 'المراجعة التقنية'],
        paragraphs: [
          [
            'Institutions can request architecture, authentication, ledger, audit-trail and integration documentation. Our team can coordinate a technical review and discuss connection requirements while bank onboarding is pending.',
            'Las instituciones pueden solicitar documentación de arquitectura, autenticación, contabilidad, auditoría e integración. Nuestro equipo puede coordinar una revisión técnica y analizar los requisitos de conexión mientras se completa la incorporación bancaria.',
            'As instituições podem solicitar documentação de arquitetura, autenticação, contabilidade, auditoria e integração. Nossa equipe pode coordenar uma análise técnica e discutir requisitos de conexão enquanto a integração bancária está pendente.',
            'يمكن للمؤسسات طلب وثائق البنية التقنية والمصادقة ودفتر الأستاذ وسجل التدقيق والتكامل. ويمكن لفريقنا تنسيق مراجعة تقنية ومناقشة متطلبات الاتصال أثناء استكمال إجراءات ضم البنك.',
          ],
        ],
      },
      {
        id: 'disclosure',
        title: [
          'Report a security issue',
          'Informar de un problema de seguridad',
          'Relate um problema de segurança',
          'الإبلاغ عن مشكلة أمنية',
        ],
        paragraphs: [
          [
            'Contact support with a description and reproduction steps. Do not send passwords, verification codes or full payment details. Please allow a reasonable opportunity for investigation and remediation before public disclosure.',
            'Contacte con asistencia y describa el problema y los pasos para reproducirlo. No envíe contraseñas, códigos de verificación ni datos de pago completos. Conceda un plazo razonable para investigar y corregir el problema antes de divulgarlo públicamente.',
            'Fale com o suporte e descreva o problema e os passos para reproduzi-lo. Não envie senhas, códigos de verificação ou dados completos de pagamento. Conceda um prazo razoável para investigação e correção antes da divulgação pública.',
            'تواصل مع الدعم مع وصف المشكلة وخطوات إعادة إنتاجها. لا ترسل كلمات مرور أو رموز تحقق أو بيانات دفع كاملة. يُرجى إتاحة فرصة معقولة للتحقيق والمعالجة قبل الإفصاح العلني.',
          ],
        ],
      },
    ],
  },
} satisfies Record<string, SitePage>

export const privacyPage: SitePage = {
  title: ['Privacy Policy', 'Política de privacidad', 'Política de privacidade', 'سياسة الخصوصية'],
  intro: [
    'What XpressTend collects, why we keep it and the choices available to you.',
    'Qué recopila XpressTend, por qué lo conservamos y qué opciones tiene.',
    'O que a XpressTend coleta, por que mantemos esses dados e quais são suas opções.',
    'ما تجمعه XpressTend من بيانات وأسباب الاحتفاظ بها والخيارات المتاحة لك.',
  ],
  sections: [
    {
      id: 'availability',
      title: [
        'Service availability',
        'Disponibilidad del servicio',
        'Disponibilidade do serviço',
        'توفر الخدمة',
      ],
      paragraphs: [siteLabels.operating],
    },
    {
      id: 'collection',
      title: ['What we collect', 'Qué recopilamos', 'O que coletamos', 'البيانات التي نجمعها'],
      paragraphs: [
        [
          'When you create an account: your name, email address, optional phone number, country and selected language.',
          'Al crear una cuenta: su nombre, dirección de correo electrónico, teléfono opcional, país e idioma seleccionado.',
          'Ao criar uma conta: seu nome, endereço de e-mail, telefone opcional, país e idioma selecionado.',
          'عند إنشاء حساب: اسمك وعنوان بريدك الإلكتروني ورقم هاتفك الاختياري وبلدك واللغة التي تختارها.',
        ],
        [
          'When you add a recipient: their name, country, delivery method and, where relevant, phone number, bank name or relationship to you. Only provide another person’s details when they expect to hear from you.',
          'Al añadir un destinatario: su nombre, país, método de entrega y, cuando corresponda, teléfono, nombre del banco o relación con usted. Facilite datos de otra persona solo cuando espere recibir noticias suyas.',
          'Ao adicionar um destinatário: nome, país, forma de recebimento e, quando pertinente, telefone, nome do banco ou relação com você. Forneça dados de outra pessoa somente quando ela esperar seu contato.',
          'عند إضافة مستلم: اسمه وبلده وطريقة التسليم، وعند الاقتضاء رقم الهاتف أو اسم البنك أو صلته بك. لا تقدّم بيانات شخص آخر إلا إذا كان يتوقع تواصلك معه.',
        ],
        [
          'When you send: the amount, currencies, fee, exchange rate and transfer status, retained as a transaction record.',
          'Al enviar: el importe, las monedas, la comisión, el tipo de cambio y el estado de la transferencia, conservados como registro de la transacción.',
          'Ao enviar: valor, moedas, tarifa, taxa de câmbio e status da transferência, mantidos como registro da transação.',
          'عند الإرسال: المبلغ والعملات والرسوم وسعر الصرف وحالة التحويل، وتُحفظ كسجل للمعاملة.',
        ],
        [
          'Automatically: IP address and browser or device identifier, recorded with sign-ins and actions that change money or access. These records help detect fraud and investigate disputed transfers.',
          'Automáticamente: la dirección IP y el identificador del navegador o dispositivo, registrados con los inicios de sesión y las acciones que afectan al dinero o al acceso. Estos registros ayudan a detectar fraudes e investigar transferencias disputadas.',
          'Automaticamente: endereço IP e identificador do navegador ou aparelho, registrados com acessos e ações que alteram dinheiro ou permissões. Esses registros ajudam a detectar fraudes e investigar transferências contestadas.',
          'تلقائياً: عنوان IP ومعرّف المتصفح أو الجهاز، ويُسجّلان مع عمليات الدخول والإجراءات التي تغيّر الأموال أو صلاحيات الوصول. تساعد هذه السجلات في كشف الاحتيال والتحقيق في التحويلات محل النزاع.',
        ],
      ],
    },
    {
      id: 'biometrics',
      title: [
        'Biometric unlock and identity verification',
        'Desbloqueo biométrico y verificación de identidad',
        'Desbloqueio biométrico e verificação de identidade',
        'الفتح البيومتري والتحقق من الهوية',
      ],
      paragraphs: [
        [
          'Device unlock is handled by your phone. iOS and Android tell the app whether the check passed; biometric data used for device unlock stays on your device.',
          'El teléfono gestiona el desbloqueo del dispositivo. iOS y Android indican a la aplicación si la comprobación se superó; los datos biométricos de desbloqueo permanecen en su dispositivo.',
          'Seu telefone realiza o desbloqueio do aparelho. iOS e Android informam ao aplicativo se a verificação foi aprovada; os dados biométricos de desbloqueio permanecem no aparelho.',
          'يتولى هاتفك فتح الجهاز. ويُبلغ نظاما iOS وAndroid التطبيق بنجاح الفحص أو فشله؛ وتبقى البيانات البيومترية المستخدمة لفتح الجهاز على جهازك.',
        ],
        [
          'Identity verification is separate. When activated, our provider Persona receives your government ID and selfie to check identity and liveness. XpressTend stores results and evidence references, rather than ID or biometric images. Compliance records may be retained after account closure.',
          'La verificación de identidad es independiente. Cuando se activa, nuestro proveedor Persona recibe su documento oficial y autorretrato para comprobar la identidad y la presencia real. XpressTend almacena resultados y referencias de pruebas, en lugar de imágenes de documentos o biométricas. Los registros de cumplimiento pueden conservarse tras el cierre de la cuenta.',
          'A verificação de identidade é separada. Quando ativado, nosso provedor Persona recebe seu documento oficial e sua selfie para verificar identidade e prova de vida. A XpressTend armazena resultados e referências de evidências, em vez de imagens de documentos ou biométricas. Registros de conformidade podem ser mantidos após o encerramento da conta.',
          'التحقق من الهوية إجراء منفصل. عند تفعيله، يتلقى مزودنا Persona وثيقتك الرسمية وصورتك الذاتية للتحقق من الهوية والحضور الفعلي. وتحفظ XpressTend النتائج ومراجع الأدلة بدلاً من صور الوثائق أو الصور البيومترية. وقد تُحفظ سجلات الامتثال بعد إغلاق الحساب.',
        ],
      ],
    },
    {
      id: 'passwords',
      title: ['Password protection', 'Protección de contraseñas', 'Proteção de senhas', 'حماية كلمات المرور'],
      paragraphs: [
        [
          'We do not store readable passwords. We store a slow one-way hash combined with a secret held separately from the database. Passwords are submitted securely during registration or sign-in and cannot be recovered from the stored hash.',
          'No almacenamos contraseñas legibles. Guardamos un hash unidireccional de cálculo lento combinado con un secreto almacenado fuera de la base de datos. Las contraseñas se envían de forma segura al registrarse o iniciar sesión y no pueden recuperarse a partir del hash.',
          'Não armazenamos senhas legíveis. Mantemos um hash unidirecional de processamento lento combinado com um segredo armazenado separadamente do banco de dados. As senhas são enviadas com segurança no cadastro ou acesso e não podem ser recuperadas a partir do hash.',
          'لا نحفظ كلمات المرور بصيغة مقروءة. نحفظ تجزئة أحادية الاتجاه بطيئة الحساب مع قيمة سرية محفوظة منفصلة عن قاعدة البيانات. وتُرسل كلمات المرور بأمان عند التسجيل أو الدخول، ولا يمكن استرجاعها من التجزئة المحفوظة.',
        ],
      ],
    },
    {
      id: 'purpose',
      title: [
        'Why we keep it',
        'Por qué lo conservamos',
        'Por que mantemos os dados',
        'أسباب الاحتفاظ بالبيانات',
      ],
      paragraphs: [
        [
          'We use information to operate your account, carry out requested transfers, keep accurate money-movement records, meet applicable anti-money-laundering and record-keeping obligations, and investigate fraud or disputes.',
          'Utilizamos la información para operar su cuenta, realizar las transferencias solicitadas, mantener registros precisos del movimiento de dinero, cumplir las obligaciones aplicables contra el blanqueo de capitales y de conservación de registros, e investigar fraudes o disputas.',
          'Usamos as informações para operar sua conta, realizar as transferências solicitadas, manter registros precisos da movimentação de dinheiro, cumprir obrigações aplicáveis de prevenção à lavagem de dinheiro e de manutenção de registros e investigar fraudes ou contestações.',
          'نستخدم المعلومات لتشغيل حسابك وتنفيذ التحويلات المطلوبة والاحتفاظ بسجلات دقيقة لحركة الأموال والوفاء بالتزامات مكافحة غسل الأموال وحفظ السجلات المطبقة، والتحقيق في الاحتيال أو النزاعات.',
        ],
      ],
    },
    {
      id: 'sharing',
      title: [
        'Who else sees it',
        'Quién más tiene acceso',
        'Quem mais tem acesso',
        'الجهات الأخرى التي تطّلع عليها',
      ],
      paragraphs: [
        [
          'Staff access is limited by role and recorded against a named person. Platform hosting is provided by Cloudflare. Identity, sanctions-screening and, once real-money service begins, banking and payout providers receive information as needed to complete services and comply with law. We do not sell information or share it for advertising.',
          'El acceso del personal está limitado por rol y se registra a nombre de cada persona. Cloudflare proporciona el alojamiento de la plataforma. Los proveedores de identidad, comprobación de sanciones y, cuando comience el servicio con dinero real, banca y pagos reciben información según sea necesario para prestar los servicios y cumplir la ley. No vendemos información ni la compartimos con fines publicitarios.',
          'O acesso da equipe é limitado por perfil e registrado em nome de cada pessoa. A Cloudflare fornece a hospedagem da plataforma. Provedores de identidade, verificação de sanções e, quando o serviço com dinheiro real começar, bancos e prestadores de pagamento recebem as informações necessárias para prestar serviços e cumprir a lei. Não vendemos informações nem as compartilhamos para publicidade.',
          'يقتصر وصول الموظفين على متطلبات أدوارهم ويُسجّل باسم كل شخص. وتستضيف Cloudflare المنصة. ويتلقى مزودو الهوية وفحص العقوبات، وعند بدء الخدمة بأموال فعلية البنوك ومزودو الصرف، المعلومات اللازمة لتقديم الخدمات والامتثال للقانون. لا نبيع المعلومات ولا نشاركها لأغراض إعلانية.',
        ],
      ],
    },
    {
      id: 'retention',
      title: [
        'How long we keep it',
        'Cuánto tiempo lo conservamos',
        'Por quanto tempo mantemos os dados',
        'مدة الاحتفاظ بالبيانات',
      ],
      paragraphs: [
        [
          'Transaction records and audit trails are retained for at least five years after a transfer. Account details are kept while your account is open and for the same period afterwards. Records legally required for compliance are retained even after account closure.',
          'Los registros de transacciones y las pistas de auditoría se conservan al menos cinco años después de una transferencia. Los datos de la cuenta se mantienen mientras esté abierta y durante el mismo período después. Los registros exigidos legalmente se conservan incluso tras el cierre de la cuenta.',
          'Registros de transações e trilhas de auditoria são mantidos por pelo menos cinco anos após uma transferência. Os dados da conta são mantidos enquanto ela estiver aberta e pelo mesmo período após o encerramento. Registros legalmente exigidos são preservados mesmo após o encerramento da conta.',
          'تُحفظ سجلات المعاملات والتدقيق لمدة لا تقل عن خمس سنوات بعد التحويل. وتُحفظ بيانات الحساب طوال فترة فتحه وللمدة نفسها بعد إغلاقه. وتُحفظ السجلات التي يفرضها القانون حتى بعد إغلاق الحساب.',
        ],
      ],
    },
    {
      id: 'choices',
      title: ['Your choices', 'Sus opciones', 'Suas opções', 'خياراتك'],
      paragraphs: [
        [
          'You can request a copy of your data, corrections or account closure by contacting support@xpresstend.com. You can also request account deletion from your profile. Legal retention obligations still apply.',
          'Puede solicitar una copia de sus datos, correcciones o el cierre de la cuenta escribiendo a support@xpresstend.com. También puede solicitar la eliminación desde su perfil. Las obligaciones legales de conservación siguen siendo aplicables.',
          'Você pode solicitar uma cópia dos seus dados, correções ou o encerramento da conta pelo endereço support@xpresstend.com. Também pode solicitar a exclusão pelo seu perfil. As obrigações legais de retenção continuam válidas.',
          'يمكنك طلب نسخة من بياناتك أو تصحيحها أو إغلاق الحساب عبر support@xpresstend.com. ويمكنك أيضاً طلب حذف الحساب من ملفك الشخصي. وتظل التزامات الاحتفاظ القانونية سارية.',
        ],
      ],
    },
    {
      id: 'children',
      title: ['Children', 'Menores', 'Menores de idade', 'الأطفال'],
      paragraphs: [
        [
          'XpressTend is not intended for anyone under 18. We do not knowingly collect their information.',
          'XpressTend no está destinado a menores de 18 años. No recopilamos sus datos de forma deliberada.',
          'A XpressTend não se destina a menores de 18 anos. Não coletamos suas informações intencionalmente.',
          'XpressTend غير مخصصة لمن هم دون 18 عاماً. ولا نجمع معلوماتهم عن علم.',
        ],
      ],
    },
    {
      id: 'changes',
      title: ['Changes and contact', 'Cambios y contacto', 'Alterações e contato', 'التغييرات والتواصل'],
      paragraphs: [
        [
          'Material changes to this policy will be announced in the app before taking effect. Contact XpressTend Financial Services, Seattle, Washington, at support@xpresstend.com with privacy questions.',
          'Los cambios importantes en esta política se anunciarán en la aplicación antes de entrar en vigor. Para consultas de privacidad, contacte con XpressTend Financial Services, Seattle, Washington, en support@xpresstend.com.',
          'Alterações relevantes nesta política serão anunciadas no aplicativo antes de entrarem em vigor. Para dúvidas sobre privacidade, entre em contato com a XpressTend Financial Services, Seattle, Washington, pelo endereço support@xpresstend.com.',
          'سيُعلَن عن التغييرات الجوهرية لهذه السياسة في التطبيق قبل سريانها. للاستفسارات المتعلقة بالخصوصية، تواصل مع XpressTend Financial Services، سياتل، واشنطن، عبر support@xpresstend.com.',
        ],
      ],
    },
  ],
}

export const supportPage: SitePage = {
  title: siteLabels.support,
  intro: [
    'Company enquiries, account assistance and institutional review. Choose the team you need below.',
    'Consultas de empresa, ayuda con la cuenta y revisión institucional. Elija el equipo que necesita a continuación.',
    'Dúvidas sobre a empresa, ajuda com a conta e análise institucional. Escolha a equipe de que precisa abaixo.',
    'استفسارات الشركة والمساعدة في الحساب والمراجعة المؤسسية. اختر الفريق المناسب أدناه.',
  ],
  sections: [
    {
      id: 'contact',
      title: ['Company contact', 'Contacto de la empresa', 'Contato da empresa', 'التواصل مع الشركة'],
      paragraphs: [
        [
          'Headquarters: Seattle, Washington, USA. Email: support@xpresstend.com. Phone: +1 (206) 331-9867.',
          'Sede: Seattle, Washington, Estados Unidos. Correo electrónico: support@xpresstend.com. Teléfono: +1 (206) 331-9867.',
          'Sede: Seattle, Washington, Estados Unidos. E-mail: support@xpresstend.com. Telefone: +1 (206) 331-9867.',
          'المقر الرئيسي: سياتل، واشنطن، الولايات المتحدة. البريد الإلكتروني: support@xpresstend.com. الهاتف: ‎+1 (206) 331-9867.',
        ],
        [
          'Include a brief description and, where relevant, your organisation or account email. Never send passwords, verification codes or full payment details.',
          'Incluya una descripción breve y, cuando corresponda, su organización o el correo de su cuenta. Nunca envíe contraseñas, códigos de verificación ni datos de pago completos.',
          'Inclua uma descrição breve e, quando pertinente, sua organização ou o e-mail da conta. Nunca envie senhas, códigos de verificação ou dados completos de pagamento.',
          'أرفق وصفاً موجزاً، واذكر عند الاقتضاء منظمتك أو بريد حسابك. لا ترسل أبداً كلمات مرور أو رموز تحقق أو بيانات دفع كاملة.',
        ],
      ],
    },
    {
      id: 'availability',
      title: [
        'Service availability',
        'Disponibilidad del servicio',
        'Disponibilidade do serviço',
        'توفر الخدمة',
      ],
      paragraphs: [siteLabels.operating],
    },
    {
      id: 'questions',
      title: ['Common questions', 'Preguntas frecuentes', 'Perguntas frequentes', 'الأسئلة الشائعة'],
      paragraphs: [
        [
          'NMLS ID: 2900672. The product, app demo and company pages support English, Spanish, Brazilian Portuguese and Arabic. Choose your language from the menu; your selection is retained as you navigate.',
          'NMLS ID: 2900672. El producto, la demo y las páginas de la empresa están disponibles en inglés, español, portugués de Brasil y árabe. Elija su idioma en el menú; la selección se conserva al navegar.',
          'NMLS ID: 2900672. O produto, a demonstração e as páginas da empresa estão disponíveis em inglês, espanhol, português do Brasil e árabe. Escolha seu idioma no menu; a seleção é mantida durante a navegação.',
          'رقم NMLS: ‏2900672. يتوفر المنتج والتطبيق التجريبي وصفحات الشركة بالإنجليزية والإسبانية والبرتغالية البرازيلية والعربية. اختر لغتك من القائمة؛ ويُحتفظ باختيارك أثناء التنقل.',
        ],
        [
          'For account access, use the sign-in and password-recovery pages. For data access, corrections or account closure, contact support or use the deletion option in your profile.',
          'Para acceder a su cuenta, utilice las páginas de inicio de sesión y recuperación de contraseña. Para acceder a sus datos, corregirlos o cerrar la cuenta, contacte con asistencia o utilice la opción de eliminación de su perfil.',
          'Para acessar sua conta, use as páginas de entrada e recuperação de senha. Para acessar dados, corrigi-los ou encerrar a conta, fale com o suporte ou use a opção de exclusão no seu perfil.',
          'للوصول إلى الحساب، استخدم صفحتي تسجيل الدخول واسترداد كلمة المرور. ولطلب بياناتك أو تصحيحها أو إغلاق الحساب، تواصل مع الدعم أو استخدم خيار الحذف في ملفك الشخصي.',
        ],
      ],
    },
    {
      id: 'safety',
      title: ['Protecting your account', 'Proteja su cuenta', 'Proteja sua conta', 'حماية حسابك'],
      paragraphs: [
        [
          'XpressTend will never ask for your password or verification code by email, phone or text, or ask you to send money to resolve an account problem. Contact us directly using this page if a message seems suspicious.',
          'XpressTend nunca le pedirá su contraseña ni un código de verificación por correo, teléfono o mensaje, ni que envíe dinero para resolver un problema con su cuenta. Contacte con nosotros directamente desde esta página si un mensaje parece sospechoso.',
          'A XpressTend nunca pedirá sua senha ou código de verificação por e-mail, telefone ou mensagem, nem solicitará dinheiro para resolver um problema na conta. Fale diretamente conosco por esta página se uma mensagem parecer suspeita.',
          'لن تطلب XpressTend كلمة مرورك أو رمز تحقق عبر البريد أو الهاتف أو الرسائل، ولن تطلب منك إرسال أموال لحل مشكلة في الحساب. تواصل معنا مباشرة عبر هذه الصفحة إذا بدت رسالة مشبوهة.',
        ],
        [
          'Be cautious of unexpected money requests, guaranteed returns, prizes requiring upfront payment or pressure to act secretly. Verify requests through a trusted channel. Report potential security issues with steps to reproduce them.',
          'Desconfíe de solicitudes inesperadas de dinero, rendimientos garantizados, premios con pago anticipado o presiones para actuar en secreto. Verifique las solicitudes por un canal de confianza. Informe de posibles problemas de seguridad e incluya los pasos para reproducirlos.',
          'Desconfie de pedidos inesperados de dinheiro, retornos garantidos, prêmios com pagamento antecipado ou pressão para agir em segredo. Verifique os pedidos por um canal confiável. Relate possíveis problemas de segurança com os passos para reproduzi-los.',
          'احذر طلبات الأموال غير المتوقعة والعوائد المضمونة والجوائز التي تتطلب دفعاً مقدماً أو الضغط للتصرف سراً. تحقّق من الطلبات عبر قناة موثوقة. وأبلغ عن المشكلات الأمنية المحتملة مع خطوات إعادة إنتاجها.',
        ],
      ],
    },
    {
      id: 'complaints',
      title: [
        'Complaints and consumer resources',
        'Reclamaciones y recursos para consumidores',
        'Reclamações e recursos para consumidores',
        'الشكاوى وموارد المستهلكين',
      ],
      paragraphs: [
        [
          'Email support with the issue, desired outcome and relevant reference information, without sensitive credentials. Independent complaint resources are also available from the Washington State Department of Financial Institutions and the Consumer Financial Protection Bureau.',
          'Escriba a asistencia describiendo el problema, el resultado que busca y las referencias pertinentes, sin credenciales sensibles. El Departamento de Instituciones Financieras del Estado de Washington y la Oficina de Protección Financiera del Consumidor también ofrecen recursos independientes para presentar reclamaciones.',
          'Envie ao suporte uma descrição do problema, do resultado desejado e das referências relevantes, sem credenciais sensíveis. O Departamento de Instituições Financeiras do Estado de Washington e o órgão de proteção financeira do consumidor dos Estados Unidos também oferecem recursos independentes para reclamações.',
          'أرسل إلى الدعم وصف المشكلة والنتيجة المطلوبة والمراجع ذات الصلة، دون بيانات دخول حساسة. وتتوفر أيضاً موارد مستقلة للشكاوى لدى إدارة المؤسسات المالية بولاية واشنطن ومكتب الحماية المالية للمستهلك.',
        ],
      ],
    },
  ],
}
