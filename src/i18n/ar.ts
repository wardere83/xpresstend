import type { en } from './en'

/**
 * العربية. Modern Standard Arabic, so the copy reads the same from Somalia
 * and Djibouti through the Gulf. Rendered right-to-left; see `dirOf` in
 * `./langs` and the `dir` attribute set by the provider.
 */
export const ar: Record<keyof typeof en, string> = {
  // ---- Generic ----
  'common.continue': 'متابعة',
  'common.cancel': 'إلغاء',
  'common.done': 'تم',
  'common.confirm': 'تأكيد',
  'common.viewAll': 'عرض الكل',
  'common.seeAll': 'مشاهدة الكل',
  'common.close': 'إغلاق',
  'common.back': 'رجوع',
  'common.yes': 'نعم',
  'common.no': 'لا',
  'common.edit': 'تعديل',
  'common.online': 'متصل',
  'common.instant': 'فوري',
  'common.completed': 'مكتملة',
  'common.pending': 'قيد الانتظار',
  'common.language': 'اللغة',
  'common.secure': 'آمن ومشفَّر 100%',
  'common.search': 'بحث',

  // ---- Bottom navigation ----
  'nav.home': 'الرئيسية',
  'nav.recipients': 'المستفيدون',
  'nav.activity': 'النشاط',
  'nav.profile': 'الحساب',
  'nav.speak': 'تحدَّث',

  // ---- Home ----
  'home.greeting': 'مرحبًا، {name}',
  'home.subtitle': 'كيف يمكننا مساعدتك اليوم؟',
  'home.voiceTitle': 'اضغط على الميكروفون للتحدث',
  'home.voiceSubtitle': 'تحدَّث بالعربية أو الإنجليزية',
  'home.sendMoney': 'إرسال الأموال',
  'home.sendMoneySub': 'سريع وآمن وموثوق',
  'home.recentTransaction': 'آخر تحويل',
  'home.recipients': 'المستفيدون',
  'home.quickActions': 'إجراءات سريعة',
  'home.noTransactions': 'لا توجد تحويلات بعد. تحويلك الأول يستغرق دقيقة تقريبًا.',

  // ---- Services ----
  'service.mobileMoney': 'المحفظة الإلكترونية',
  'service.bankTransfer': 'تحويل بنكي',
  'service.cashPickup': 'استلام نقدي',
  'service.airtime': 'الرصيد والفواتير',
  'service.mobileMoneySub': 'مباشرة إلى محفظة إلكترونية',
  'service.bankTransferSub': 'إلى حساب بنكي',
  'service.cashPickupSub': 'استلم من أحد الوكلاء',
  'service.airtimeSub': 'اشحن رصيد هاتف أو ادفع فاتورة',

  // ---- Quick actions ----
  'quick.help': 'مركز المساعدة',
  'quick.helpSub': 'إجابات عن الأسئلة الشائعة',
  'quick.rates': 'أسعار الصرف',
  'quick.ratesSub': 'عرض الأسعار المباشرة',
  'quick.refer': 'ادعُ واربح',
  'quick.referSub': 'ادعُ أصدقاءك واربح مكافآت',
  'quick.support': 'الدعم المباشر',
  'quick.supportSub': 'دعم على مدار الساعة. نحن هنا لمساعدتك',

  // ---- Voice assistant ----
  'voice.title': 'المساعد الصوتي',
  'voice.listening': 'جارٍ الاستماع...',
  'voice.speakNow': 'تحدَّث الآن',
  'voice.trySaying': 'جرِّب أن تقول:',
  'voice.sample1': 'أرسل 100 دولار إلى والدتي',
  'voice.sample2': 'كم أرسلت الشهر الماضي؟',
  'voice.sample3': 'إضافة مستفيد جديد',
  'voice.sample4': 'ما سعر الصرف اليوم؟',
  'voice.poweredBy': 'مدعوم بالذكاء الاصطناعي من {brand}',
  'voice.stop': 'إيقاف',
  'voice.secondsLeft': 'لديك {seconds} ثانية',
  'voice.tapToStart': 'اضغط للبدء',

  // ---- Assistant chat ----
  'chat.title': '{assistant}',
  'chat.placeholder': 'اكتب رسالتك...',
  'chat.greeting': 'مرحبًا! كيف يمكنني مساعدتك اليوم؟',
  'chat.userSend500': 'أريد إرسال 500 دولار إلى والدتي.',
  'chat.botConfirmIntro':
    'حسنًا! أنت ترسل {amount} إلى {name}. محفظة إلكترونية تنتهي بالأرقام {last4}. هل هذا صحيح؟',
  'chat.confirmDetails': 'يرجى تأكيد التفاصيل',
  'chat.looksGood': 'كل شيء يبدو صحيحًا. هل تريد المتابعة؟',
  'chat.rateQuestion': 'ما سعر الصرف اليوم؟',
  'chat.rateAnswer':
    '1 دولار أمريكي = {rate} شلن صومالي. قد تتغير أسعار الصرف. تحقق من الأسعار المباشرة قبل الإرسال.',
  'chat.fallback':
    'يمكنني إرسال الأموال أو إضافة مستفيد أو التحقق من سعر الصرف أو تتبُّع تحويل. أيها تريد؟',
  'chat.suggest.send': 'إرسال الأموال',
  'chat.suggest.rate': 'التحقق من السعر',
  'chat.suggest.track': 'تتبُّع التحويل',

  // ---- Transfer fields ----
  'field.recipient': 'المستفيد',
  'field.mobileWallet': 'المحفظة الإلكترونية',
  'field.country': 'الدولة',
  'field.youSend': 'أنت ترسل',
  'field.fee': 'الرسوم',
  'field.recipientGets': 'المستفيد يستلم',
  'field.delivery': 'التسليم',
  'field.total': 'الإجمالي',
  'field.to': 'إلى',
  'field.exchangeRate': 'سعر الصرف',
  'field.availableBalance': 'الرصيد المتاح',
  'field.estimated': 'تقديري',
  'field.summary': 'الملخص',
  'field.referenceId': 'الرقم المرجعي',
  'field.dateTime': 'التاريخ والوقت',
  'field.paymentMethod': 'طريقة الدفع',

  // ---- Send money ----
  'send.title': 'إرسال الأموال',
  'send.from': 'من (أنت ترسل)',
  'send.toGets': 'إلى (المستفيد يستلم)',
  'send.chooseRecipient': 'اختر المستفيد',
  'send.changeRecipient': 'تغيير',
  'send.amountTooHigh': 'المبلغ أكبر من رصيدك المتاح.',
  'send.amountTooLow': 'أدخل مبلغًا أعلى من رسوم {fee}.',

  // ---- Payment methods ----
  'pay.bank': 'حساب بنكي',
  'pay.debit': 'بطاقة خصم',
  'pay.applePay': 'Apple Pay',
  'pay.googlePay': 'Google Pay',

  // ---- Review ----
  'review.title': 'المراجعة والتأكيد',
  'review.important': 'مهم',
  'review.importantBody':
    'يرجى التأكد من صحة جميع التفاصيل. بعد إرسال التحويل لا يمكن إلغاؤه.',
  'review.securityCheck': 'التحقق الأمني',
  'review.securityBody':
    'لأمانك، ستحتاج إلى التحقق باستخدام Face ID أو رمز PIN لإتمام هذا التحويل.',
  'review.faceId': 'Face ID',
  'review.pin': 'رمز PIN',
  'review.send': 'إرسال {amount}',
  'review.verifying': 'جارٍ التحقق...',

  // ---- Success ----
  'success.title': 'تم إرسال الأموال!',
  'success.subtitle': 'تم إرسال {amount} إلى {name}',
  'success.youSent': 'أرسلت',
  'success.share': 'مشاركة الإيصال',
  'success.sendAnother': 'إرسال تحويل آخر',
  'success.copied': 'تم النسخ',

  // ---- Recipients ----
  'recipients.title': 'المستفيدون',
  'recipients.add': 'إضافة مستفيد جديد',
  'recipients.favourites': 'المفضلون',
  'recipients.all': 'كل المستفيدين',
  'recipients.searchPlaceholder': 'ابحث بالاسم أو الرقم',
  'recipients.empty': 'لا يوجد مستفيد يطابق هذا البحث.',
  'recipients.sendTo': 'إرسال إلى {name}',

  // ---- Activity ----
  'activity.title': 'النشاط',
  'activity.thisMonth': 'هذا الشهر',
  'activity.sentThisMonth': 'أُرسل هذا الشهر',
  'activity.transfers': '{count} تحويلات',
  'activity.empty': 'لا يوجد شيء هنا بعد.',
  'activity.filterAll': 'الكل',
  'activity.filterSent': 'المُرسلة',
  'activity.filterPending': 'قيد الانتظار',

  // ---- Profile ----
  'profile.title': 'الحساب',
  'profile.verified': 'حساب موثَّق',
  'profile.personal': 'البيانات الشخصية',
  'profile.security': 'الأمان ورمز PIN',
  'profile.payment': 'طرق الدفع',
  'profile.language': 'اللغة',
  'profile.notifications': 'الإشعارات',
  'profile.help': 'مركز المساعدة',
  'profile.legal': 'الشروط والخصوصية',
  'profile.signOut': 'تسجيل الخروج',
  'profile.member': 'عضو منذ {year}',

  // ---- Rates ----
  'rates.title': 'الأسعار المباشرة',
  'rates.subtitle': 'تُحدَّث كل 60 ثانية',
  'rates.perUsd': 'لكل 1 دولار أمريكي',
  'rates.feeFrom': 'الرسوم تبدأ من {fee}',

  // ---- Help ----
  'help.title': 'مركز المساعدة',
  'help.subtitle': 'إجابات بالعربية والإنجليزية، على مدار الساعة.',
  'help.contact': 'التحدث إلى موظف',
  'help.q1': 'كم يستغرق التحويل؟',
  'help.a1':
    'تصل تحويلات المحفظة الإلكترونية عادةً خلال ثوانٍ. أما التحويلات البنكية فتستغرق حتى يوم عمل واحد، والاستلام النقدي يكون جاهزًا فور حصولك على الرقم المرجعي.',
  'help.q2': 'ما هي رسومكم؟',
  'help.a2':
    'رسوم ثابتة قدرها {fee} على التحويلات حتى 1000 دولار، و0.9% لما يزيد عن ذلك. السعر الذي تراه قبل التأكيد هو السعر الذي تحصل عليه.',
  'help.q3': 'هل يمكنني إلغاء تحويل؟',
  'help.a3':
    'يمكنك الإلغاء ما دام التحويل قيد الانتظار. أما بعد استلام الأموال فلا يمكن التراجع عنه، لذا يرجى التحقق من التفاصيل في شاشة المراجعة.',
  'help.q4': 'إلى أي الدول يمكنني الإرسال؟',
  'help.a4':
    'نرسل من الولايات المتحدة إلى أكثر من 130 دولة، من بينها الصومال وكينيا وإثيوبيا وجيبوتي وأوغندا والمملكة المتحدة.',
  'help.q5': 'هل أموالي آمنة؟',
  'help.a5':
    '{brand} شركة تحويل أموال مرخَّصة مقرها {city}، {state}. كل تحويل مشفَّر من طرف إلى طرف ومشمول بضمان استرداد الأموال.',

  // ---- Refer ----
  'refer.title': 'ادعُ واربح',
  'refer.subtitle': 'امنح 10 دولارات واربح 10 دولارات عن كل صديق يُجري تحويله الأول.',
  'refer.yourCode': 'رمزك',
  'refer.copy': 'نسخ الرمز',
  'refer.invite': 'دعوة الأصدقاء',
  'refer.earned': 'ما ربحته حتى الآن',

  // ---- Support ----
  'support.title': 'الدعم المباشر',
  'support.subtitle': 'أشخاص حقيقيون، بالعربية والإنجليزية.',
  'support.chat': 'بدء محادثة مباشرة',
  'support.call': 'اتصل بنا',
  'support.email': 'الدعم عبر البريد الإلكتروني',

  // ---- Desktop shell ----
  'shell.screens': 'الشاشات',
  'shell.hint': 'استخدم التطبيق تمامًا كما على الهاتف. كل شاشة تعمل فعليًا.',
  'shell.openFull': 'فتح بملء الشاشة',
  'network.offline': 'لا يوجد اتصال. تحويلك آمن وسيُستأنف.',
  // ---- Marketing site and accounts ----
  'marketing.signIn': 'تسجيل الدخول',
  'marketing.getStarted': 'ابدأ الآن',
  'marketing.openApp': 'فتح التطبيق',
  'marketing.tryDemo': 'استكشف التطبيق',
  'marketing.heroTitle': 'أرسل المال إلى الوطن، بلغتك.',
  'marketing.heroBody': 'أسعار واضحة. نسبة ثابتة واحدة. نقاط مكافآت تستخدمها لاحقًا. تحدث أو اكتب بلغتك، والتطبيق بأكمله يردّ بها.',
  'marketing.statLanguages': 'لغات مترجمة بالكامل',
  'marketing.statSupport': 'دعم، كل يوم',
  'marketing.statHidden': 'رسوم خفية',
  'marketing.calcTitle': 'تحقق من السعر',
  'marketing.youSend': 'أنت ترسل',
  'marketing.destination': 'الوجهة',
  'marketing.fee': 'رسوم التحويل',
  'marketing.rate': 'سعر الصرف',
  'marketing.totalCharged': 'الإجمالي المحصّل',
  'marketing.theyReceive': 'سيستلمون',
  'marketing.calculating': 'جارٍ الحساب…',
  'marketing.ratesUnavailable': 'الأسعار غير متاحة حاليًا.',
  'marketing.limits': 'أرسل بين {min} و {max} لكل تحويل.',
  'marketing.f1Title': 'يصل خلال دقائق',
  'marketing.f1Body': 'تصل معظم التحويلات في اليوم نفسه، ويمكنك متابعة كل خطوة من هاتفك.',
  'marketing.f2Title': 'رسوم ثابتة واحدة',
  'marketing.f2Body': 'ترى الرسوم والسعر قبل التأكيد. ما يُعرض عليك هو ما تدفعه.',
  'marketing.f3Title': 'مصمم للتدقيق',
  'marketing.f3Body': 'كل تحويل مُقيَّد بالقيد المزدوج، وكل إجراء للموظفين مسجَّل باسم شخص محدد، وليس وكيل ذكاء اصطناعي!',
  'marketing.ctaTitle': 'هل أنت مستعد للإرسال؟',
  'marketing.ctaBody': 'أنشئ حسابًا في دقيقتين. لا تتحقق من هويتك إلا عند الإرسال لأول مرة.',
  'marketing.disclaimer': 'إن XpressTend في نسخة تجريبية خاصة. تعمل المدفوعات في وضع الاختبار ولا تُنقل أموال العملاء حتى تتوفر التراخيص وشريك الدفع.',
  'auth.signInTitle': 'مرحبًا بعودتك',
  'auth.signInSubtitle': 'سجّل الدخول لإرسال المال ومتابعة تحويلاتك.',
  'auth.registerTitle': 'أنشئ حسابك',
  'auth.registerSubtitle': 'يستغرق الأمر دقيقتين. لا حاجة لبطاقة للبدء.',
  'auth.email': 'البريد الإلكتروني',
  'auth.password': 'كلمة المرور',
  'auth.firstName': 'الاسم الأول',
  'auth.lastName': 'اسم العائلة',
  'auth.signIn': 'تسجيل الدخول',
  'auth.signingIn': 'جارٍ تسجيل الدخول…',
  'auth.createAccount': 'إنشاء حساب',
  'auth.creating': 'جارٍ الإنشاء…',
  'auth.noAccount': 'جديد على XpressTend؟',
  'auth.haveAccount': 'هل لديك حساب بالفعل؟',
  'auth.passwordHint': '12 حرفًا على الأقل، مع أحرف كبيرة وصغيرة ورقم.',
  'auth.errInvalid': 'البريد الإلكتروني وكلمة المرور غير متطابقين.',
  'auth.errLocked': 'محاولات كثيرة. حاول مجددًا خلال 15 دقيقة.',
  'auth.errWeak': 'يرجى اختيار كلمة مرور أقوى.',
  'auth.errNetwork': 'تعذّر الوصول إلى XpressTend الآن.',
  'auth.errGeneric': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
  'lang.search': 'اكتب لغتك',
  'lang.noMatch': 'لا توجد نتائج.',
  'lang.previewHeading': 'معاينة فقط',
  'lang.notYetTranslated': 'الصفحة الرئيسية تتحدث هذه اللغة. وتتم ترجمة التطبيق بالكامل تاليًا.',
  'marketing.statMany': 'كثيرة',
  'shell.hq': 'المقر الرئيسي في {city}، {state} · نرسل إلى جميع أنحاء العالم',
}
