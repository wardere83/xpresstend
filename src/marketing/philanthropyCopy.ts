import type { Passage, SitePage } from './siteContent'
export const philanthropyLabels = {
  title: ['Philanthropy', 'Filantropía', 'Filantropia', 'العطاء المجتمعي'],
  intro: [
    'Real money skills. Lasting upward mobility. Built alongside the communities we call home.',
    'Habilidades financieras prácticas. Progreso social duradero. Junto a las comunidades que consideramos nuestro hogar.',
    'Habilidades financeiras práticas. Mobilidade social duradoura. Ao lado das comunidades que chamamos de lar.',
    'مهارات مالية عملية. وفرص تقدم مستدامة. نبنيها مع المجتمعات التي نعدّها موطننا.',
  ],
  themes: [
    'What this work stands for',
    'Lo que representa esta labor',
    'O que este trabalho representa',
    'ما يجسّده هذا العمل',
  ],
  pause: ['Pause the film', 'Pausar el vídeo', 'Pausar o filme', 'إيقاف الفيديو مؤقتاً'],
  play: ['Play the film', 'Reproducir el vídeo', 'Reproduzir o filme', 'تشغيل الفيديو'],
  film: [
    'Banner film: community members of different ages and backgrounds learning about money together in a classroom and around their neighbourhood.',
    'Vídeo de cabecera: miembros de la comunidad de diferentes edades y orígenes aprenden juntos sobre el dinero en un aula y en su barrio.',
    'Filme de abertura: pessoas da comunidade de diferentes idades e origens aprendem juntas sobre dinheiro na sala de aula e no bairro.',
    'فيديو المقدمة: أفراد من المجتمع من أعمار وخلفيات مختلفة يتعلمون معاً عن المال في الصف وفي حيّهم.',
  ],
  contact: [
    'Contact XpressTend Financial Literacy',
    'Contactar con XpressTend Financial Literacy',
    'Fale com o XpressTend Financial Literacy',
    'تواصل مع XpressTend Financial Literacy',
  ],
} satisfies Record<string, Passage>
export const philanthropyThemes: Passage[] = [
  [
    'Real money skills',
    'Habilidades financieras prácticas',
    'Habilidades financeiras práticas',
    'مهارات مالية عملية',
  ],
  ['Upward mobility', 'Progreso social', 'Mobilidade social', 'التقدم الاجتماعي والاقتصادي'],
  ['Community wealth', 'Riqueza comunitaria', 'Riqueza comunitária', 'ثروة المجتمع'],
  ['Cultural brilliance', 'Talento cultural', 'Talento cultural', 'التميّز الثقافي'],
  ['Youth leadership', 'Liderazgo juvenil', 'Liderança jovem', 'القيادة الشبابية'],
  [
    'Generational knowledge',
    'Conocimiento entre generaciones',
    'Conhecimento entre gerações',
    'المعرفة عبر الأجيال',
  ],
  ['Shared prosperity', 'Prosperidad compartida', 'Prosperidade compartilhada', 'الازدهار المشترك'],
]
export const philanthropyPage: SitePage = {
  title: [
    'XpressTend Financial Literacy',
    'XpressTend Financial Literacy',
    'XpressTend Financial Literacy',
    'XpressTend Financial Literacy',
  ],
  intro: philanthropyLabels.intro,
  sections: [
    {
      id: 'mission-heading',
      title: [
        'Let’s also make financial literacy cool.',
        'Hagamos también que la educación financiera sea genial.',
        'Vamos também fazer da educação financeira algo descolado.',
        'لنجعل الثقافة المالية ممتعة أيضاً.',
      ],
      paragraphs: [
        [
          'We build real money skills and lasting upward mobility in underserved communities across Washington state, Nairobi, São Paulo, and beyond.',
          'Desarrollamos habilidades financieras prácticas y un progreso social duradero en comunidades desatendidas del estado de Washington, Nairobi, São Paulo y más allá.',
          'Desenvolvemos habilidades financeiras práticas e mobilidade social duradoura em comunidades desassistidas no estado de Washington, em Nairóbi, em São Paulo e além.',
          'نبني مهارات مالية عملية وفرص تقدم اجتماعي واقتصادي مستدامة في المجتمعات الأقل حصولاً على الخدمات في ولاية واشنطن ونيروبي وساو باولو وما وراءها.',
        ],
        [
          'Money knowledge travels through family, language, humour and trust. Learning should feel at home in the classroom and the neighbourhood.',
          'El conocimiento financiero se transmite a través de la familia, el idioma, el humor y la confianza. El aprendizaje debe sentirse cercano tanto en el aula como en el barrio.',
          'O conhecimento financeiro circula pela família, pelo idioma, pelo humor e pela confiança. O aprendizado deve fazer sentido na sala de aula e no bairro.',
          'تنتقل المعرفة المالية عبر الأسرة واللغة والفكاهة والثقة. وينبغي أن يكون التعلّم مألوفاً وقريباً من الناس في الصف والحي.',
        ],
      ],
    },
    {
      id: 'value-heading',
      title: [
        'Investing in great minds',
        'Invertimos en grandes talentos',
        'Investimos em grandes talentos',
        'الاستثمار في العقول المتميزة',
      ],
      paragraphs: [
        [
          'We add value to the community by investing in the great minds of today and tomorrow.',
          'Aportamos valor a la comunidad al invertir en los grandes talentos de hoy y de mañana.',
          'Agregamos valor à comunidade ao investir nos grandes talentos de hoje e de amanhã.',
          'نضيف قيمة إلى المجتمع بالاستثمار في العقول المتميزة اليوم وغداً.',
        ],
        [
          'Young people, parents, elders and entrepreneurs already carry ideas that move communities forward. We invest in that talent and stay long enough to see it grow.',
          'Los jóvenes, los padres, los mayores y los emprendedores ya tienen ideas que impulsan a las comunidades. Invertimos en ese talento y mantenemos nuestro compromiso para verlo crecer.',
          'Jovens, pais, pessoas mais velhas e empreendedores já trazem ideias que impulsionam as comunidades. Investimos nesse talento e mantemos nosso compromisso para vê-lo crescer.',
          'يحمل الشباب والآباء وكبار السن ورواد الأعمال أفكاراً تدفع مجتمعاتهم إلى الأمام. نستثمر في هذه المواهب ونلتزم معها لنشهد نموها.',
        ],
      ],
    },
    {
      id: 'approach-heading',
      title: [
        'Culturally congruent strengths-based strategies.',
        'Estrategias culturalmente pertinentes y basadas en fortalezas.',
        'Estratégias culturalmente alinhadas e baseadas em potencialidades.',
        'استراتيجيات منسجمة ثقافياً وقائمة على نقاط القوة.',
      ],
      paragraphs: [
        [
          'We support communities through culturally congruent strengths-based strategies. Families budgeting across currencies, savings circles and local enterprise already hold deep financial knowledge.',
          'Apoyamos a las comunidades mediante estrategias culturalmente pertinentes y basadas en sus fortalezas. Las familias que administran varias monedas, los círculos de ahorro y las empresas locales ya poseen amplios conocimientos financieros.',
          'Apoiamos as comunidades com estratégias culturalmente alinhadas e baseadas em suas potencialidades. Famílias que administram várias moedas, grupos de poupança e negócios locais já possuem profundo conhecimento financeiro.',
          'ندعم المجتمعات باستراتيجيات منسجمة ثقافياً وقائمة على نقاط قوتها. فالأسر التي تدير ميزانياتها بعملات مختلفة ودوائر الادخار والمشروعات المحلية تمتلك بالفعل معرفة مالية عميقة.',
        ],
        [
          'We don’t utilize philanthropic efforts that are deficit-based.',
          'No utilizamos enfoques filantrópicos basados en las carencias.',
          'Não adotamos ações filantrópicas baseadas em carências.',
          'لا نتّبع جهوداً خيرية قائمة على التركيز على أوجه النقص.',
        ],
        [
          'Communities set the priorities. We begin with what people know, do well and aspire to, bringing resources and tools that build on those strengths.',
          'Las comunidades establecen las prioridades. Partimos de lo que las personas saben, hacen bien y aspiran a lograr, y aportamos recursos y herramientas que refuerzan esas fortalezas.',
          'As comunidades definem as prioridades. Partimos do que as pessoas sabem, fazem bem e desejam alcançar, oferecendo recursos e ferramentas que ampliam essas potencialidades.',
          'تحدد المجتمعات أولوياتها. ننطلق مما يعرفه الناس ويتقنونه ويطمحون إليه، ونقدّم موارد وأدوات تبني على نقاط القوة هذه.',
        ],
      ],
    },
    {
      id: 'skills-heading',
      title: [
        'Real money skills, for real life.',
        'Habilidades financieras para la vida real.',
        'Habilidades financeiras para a vida real.',
        'مهارات مالية عملية للحياة اليومية.',
      ],
      paragraphs: [
        [
          'Explore the learning topics below. Each begins with everyday choices and builds toward lasting confidence.',
          'Explore los temas de aprendizaje a continuación. Cada uno parte de decisiones cotidianas y ayuda a construir una confianza duradera.',
          'Explore os temas de aprendizagem abaixo. Cada um parte de escolhas cotidianas e ajuda a construir confiança duradoura.',
          'استكشف موضوعات التعلّم أدناه. يبدأ كل منها بالخيارات اليومية ويبني ثقة مستدامة.',
        ],
      ],
    },
    {
      id: 'places-heading',
      title: [
        'Local roots, across the globe.',
        'Raíces locales por todo el mundo.',
        'Raízes locais pelo mundo.',
        'جذور محلية عبر العالم.',
      ],
      paragraphs: [
        [
          'Washington state is our home. Nairobi brings mobile-money innovation and youthful ambition. São Paulo brings creative, entrepreneurial neighbourhoods. Our commitment grows alongside communities connected across borders.',
          'El estado de Washington es nuestro hogar. Nairobi aporta innovación en dinero móvil y ambición juvenil. São Paulo aporta barrios creativos y emprendedores. Nuestro compromiso crece junto a las comunidades conectadas a través de las fronteras.',
          'O estado de Washington é nosso lar. Nairóbi traz inovação em dinheiro móvel e ambição jovem. São Paulo traz bairros criativos e empreendedores. Nosso compromisso cresce ao lado das comunidades conectadas além das fronteiras.',
          'ولاية واشنطن هي موطننا. وتأتي نيروبي بابتكارات الأموال عبر الهاتف وطموح الشباب، وساو باولو بأحياء مبدعة وريادية. وينمو التزامنا مع المجتمعات المتصلة عبر الحدود.',
        ],
      ],
    },
    {
      id: 'join-heading',
      title: [
        'Invest in great minds with us.',
        'Invierta en grandes talentos con nosotros.',
        'Invista em grandes talentos conosco.',
        'استثمر معنا في العقول المتميزة.',
      ],
      paragraphs: [
        [
          'Schools, community organisations and local leaders: tell us what your community wants to learn and how XpressTend Financial Literacy can support it.',
          'Escuelas, organizaciones comunitarias y líderes locales: cuéntenos qué quiere aprender su comunidad y cómo puede apoyarla XpressTend Financial Literacy.',
          'Escolas, organizações comunitárias e lideranças locais: conte o que sua comunidade quer aprender e como o XpressTend Financial Literacy pode apoiar.',
          'إلى المدارس والمنظمات المجتمعية والقادة المحليين: أخبرونا بما يرغب مجتمعكم في تعلّمه وكيف يمكن لـ XpressTend Financial Literacy دعمه.',
        ],
      ],
    },
  ],
}
export const learningTopics: { title: Passage; body: Passage }[] = [
  {
    title: ['Earning and budgeting', 'Ingresos y presupuesto', 'Renda e orçamento', 'الدخل والميزانية'],
    body: [
      'Make a plan for each dollar, shilling and real. Separate essentials, goals and flexible spending.',
      'Planifique cada dólar, chelín y real. Separe los gastos esenciales, los objetivos y los gastos flexibles.',
      'Planeje cada dólar, xelim e real. Separe despesas essenciais, metas e gastos flexíveis.',
      'ضع خطة لكل دولار وشلن وريال. وافصل بين الضروريات والأهداف والإنفاق المرن.',
    ],
  },
  {
    title: ['Saving and credit', 'Ahorro y crédito', 'Poupança e crédito', 'الادخار والائتمان'],
    body: [
      'Build an emergency cushion and understand the total cost of borrowing before taking on credit.',
      'Cree un fondo de emergencia y comprenda el coste total de un préstamo antes de asumir un crédito.',
      'Crie uma reserva de emergência e entenda o custo total do empréstimo antes de contratar crédito.',
      'كوّن احتياطياً للطوارئ وافهم التكلفة الكاملة للاقتراض قبل الحصول على الائتمان.',
    ],
  },
  {
    title: [
      'Sending money safely',
      'Enviar dinero con seguridad',
      'Enviar dinheiro com segurança',
      'إرسال الأموال بأمان',
    ],
    body: [
      'Check the recipient, fee, exchange rate and delivery terms before confirming a transfer.',
      'Compruebe el destinatario, la comisión, el tipo de cambio y las condiciones de entrega antes de confirmar una transferencia.',
      'Confira o destinatário, a tarifa, a taxa de câmbio e as condições de entrega antes de confirmar uma transferência.',
      'تحقق من المستلم والرسوم وسعر الصرف وشروط التسليم قبل تأكيد التحويل.',
    ],
  },
  {
    title: ['Digital confidence', 'Confianza digital', 'Confiança digital', 'الثقة الرقمية'],
    body: [
      'Keep passwords private, verify unexpected requests and use trusted channels to report suspicious activity.',
      'Mantenga sus contraseñas en privado, verifique las solicitudes inesperadas y utilice canales de confianza para informar de actividad sospechosa.',
      'Mantenha suas senhas em sigilo, verifique pedidos inesperados e use canais confiáveis para relatar atividades suspeitas.',
      'حافظ على سرية كلمات المرور وتحقق من الطلبات غير المتوقعة واستخدم قنوات موثوقة للإبلاغ عن النشاط المشبوه.',
    ],
  },
  {
    title: ['Enterprise', 'Emprendimiento', 'Empreendedorismo', 'ريادة الأعمال'],
    body: [
      'Turn an idea into a plan: track costs, understand customers and separate business and household money.',
      'Convierta una idea en un plan: registre costes, comprenda a sus clientes y separe el dinero del negocio y del hogar.',
      'Transforme uma ideia em um plano: acompanhe custos, entenda os clientes e separe o dinheiro do negócio e da casa.',
      'حوّل الفكرة إلى خطة: تابع التكاليف وافهم العملاء وافصل أموال العمل عن أموال الأسرة.',
    ],
  },
  {
    title: ['Ownership', 'Patrimonio', 'Patrimônio', 'بناء الأصول'],
    body: [
      'Set long-term goals, understand risk and build habits that can benefit the next generation.',
      'Fije objetivos a largo plazo, comprenda los riesgos y cree hábitos que puedan beneficiar a la siguiente generación.',
      'Defina metas de longo prazo, entenda os riscos e desenvolva hábitos que possam beneficiar a próxima geração.',
      'حدد أهدافاً طويلة الأجل وافهم المخاطر وابنِ عادات يمكن أن تفيد الجيل القادم.',
    ],
  },
]
