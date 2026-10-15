import { useCallback } from 'react'
import { useI18n } from './index'

/** Supplemental interface messages; array order is Spanish, Brazilian Portuguese, Arabic. */
export const interfaceMessages: Record<string, readonly [string, string, string]> = {
  'Back to website': ['Volver al sitio web', 'Voltar ao site', 'العودة إلى الموقع'],
  'XpressTend / Interactive demo': [
    'XpressTend / Demo interactiva',
    'XpressTend / Demonstração interativa',
    'XpressTend / تجربة تفاعلية',
  ],
  'Your next move.': ['Su próximo paso.', 'Seu próximo passo.', 'خطوتك التالية.'],
  'Within reach.': ['A su alcance.', 'Ao seu alcance.', 'في متناولك.'],
  'Explore the app, choose a sample recipient and walk through a transfer. Everything in this tour stays on this screen.':
    [
      'Explore la aplicación, elija un destinatario de ejemplo y recorra una transferencia. Todo lo que haga en este recorrido permanece en esta pantalla.',
      'Explore o aplicativo, escolha um destinatário de exemplo e percorra uma transferência. Tudo neste passeio permanece nesta tela.',
      'استكشف التطبيق واختر مستلماً تجريبياً وتعرّف على خطوات التحويل. يبقى كل ما تفعله في هذه الجولة على هذه الشاشة.',
    ],
  'Create your account': ['Cree su cuenta', 'Crie sua conta', 'أنشئ حسابك'],
  'Sample data only. No account is created, no money moves, and sample amounts are not a live quote.': [
    'Solo datos de ejemplo. No se crea ninguna cuenta, no se mueve dinero y los importes no son una cotización real.',
    'Apenas dados de exemplo. Nenhuma conta é criada, nenhum dinheiro é movimentado e os valores não são uma cotação real.',
    'بيانات تجريبية فقط. لا يُنشأ أي حساب ولا تُنقل أموال، والمبالغ المعروضة ليست عرض سعر فعلياً.',
  ],
  'Interactive app demo': [
    'Demo interactiva de la aplicación',
    'Demonstração interativa do aplicativo',
    'تجربة تفاعلية للتطبيق',
  ],
  'Exit demo': ['Salir de la demo', 'Sair da demonstração', 'مغادرة التجربة'],
  Demo: ['Demo', 'Demonstração', 'تجربة'],
  'Welcome to your preview': [
    'Bienvenido a su vista previa',
    'Boas-vindas à sua prévia',
    'مرحباً بك في المعاينة',
  ],
  'Money moves.': ['El dinero se mueve.', 'O dinheiro se move.', 'المال ينتقل.'],
  'Connection stays.': ['El vínculo permanece.', 'A conexão fica.', 'والصلة تبقى.'],
  'Try the journey with sample data.': [
    'Pruebe el recorrido con datos de ejemplo.',
    'Experimente o fluxo com dados de exemplo.',
    'جرّب الخطوات باستخدام بيانات تجريبية.',
  ],
  'Send money': ['Enviar dinero', 'Enviar dinheiro', 'إرسال الأموال'],
  'Explore a sample transfer': [
    'Explore una transferencia de ejemplo',
    'Explore uma transferência de exemplo',
    'استكشف تحويلاً تجريبياً',
  ],
  'Your people': ['Sus personas', 'Suas pessoas', 'أحباؤك'],
  'Choose a recipient': ['Elija un destinatario', 'Escolha um destinatário', 'اختر مستلماً'],
  'Your activity': ['Su actividad', 'Sua atividade', 'نشاطك'],
  'Follow the journey': ['Siga el recorrido', 'Acompanhe o fluxo', 'تابع الخطوات'],
  'Clear at every step.': ['Claridad en cada paso.', 'Clareza em cada etapa.', 'وضوح في كل خطوة.'],
  'See the recipient, amount and fee before completing the demo.': [
    'Revise el destinatario, el importe y la comisión antes de completar la demo.',
    'Confira o destinatário, o valor e a tarifa antes de concluir a demonstração.',
    'راجع المستلم والمبلغ والرسوم قبل إكمال التجربة.',
  ],
  'Review your demo': ['Revise su demo', 'Revise sua demonstração', 'راجع تجربتك'],
  'Demo complete': ['Demo completada', 'Demonstração concluída', 'اكتملت التجربة'],
  Recipient: ['Destinatario', 'Destinatário', 'المستلم'],
  'Sample amount (USD)': ['Importe de ejemplo (USD)', 'Valor de exemplo (USD)', 'المبلغ التجريبي (USD)'],
  'Illustrative USD amounts. This is not a live exchange-rate quote.': [
    'Importes ilustrativos en USD. No es una cotización de cambio real.',
    'Valores ilustrativos em USD. Esta não é uma cotação de câmbio real.',
    'مبالغ توضيحية بالدولار الأمريكي. هذا ليس عرض سعر صرف فعلياً.',
  ],
  'Review demo transfer': [
    'Revisar transferencia de ejemplo',
    'Revisar transferência de exemplo',
    'مراجعة التحويل التجريبي',
  ],
  'Sample amount': ['Importe de ejemplo', 'Valor de exemplo', 'المبلغ التجريبي'],
  'Sample fee': ['Comisión de ejemplo', 'Tarifa de exemplo', 'الرسوم التجريبية'],
  'Illustrative total': ['Total ilustrativo', 'Total ilustrativo', 'الإجمالي التوضيحي'],
  'Completing this tour does not submit a transfer or charge you.': [
    'Completar este recorrido no envía ninguna transferencia ni genera cargos.',
    'Concluir este passeio não envia nenhuma transferência nem gera cobranças.',
    'لا يؤدي إكمال هذه الجولة إلى إرسال تحويل أو فرض رسوم عليك.',
  ],
  'Complete demo': ['Completar demo', 'Concluir demonstração', 'إكمال التجربة'],
  'Edit sample details': ['Editar datos de ejemplo', 'Editar dados de exemplo', 'تعديل البيانات التجريبية'],
  'You explored a sample transfer to {recipient}. No money was sent.': [
    'Exploró una transferencia de ejemplo a {recipient}. No se envió dinero.',
    'Você explorou uma transferência de exemplo para {recipient}. Nenhum dinheiro foi enviado.',
    'استكشفت تحويلاً تجريبياً إلى {recipient}. لم تُرسل أموال.',
  ],
  'View demo activity': ['Ver actividad de la demo', 'Ver atividade da demonstração', 'عرض نشاط التجربة'],
  'Create a real account': ['Crear una cuenta real', 'Criar uma conta real', 'إنشاء حساب فعلي'],
  'Sample recipients for this tour.': [
    'Destinatarios de ejemplo para este recorrido.',
    'Destinatários de exemplo para este passeio.',
    'مستلمون تجريبيون لهذه الجولة.',
  ],
  'Sample recipient': ['Destinatario de ejemplo', 'Destinatário de exemplo', 'مستلم تجريبي'],
  'This timeline contains demo activity only.': [
    'Esta cronología contiene solo actividad de ejemplo.',
    'Esta linha do tempo contém apenas atividade de demonstração.',
    'يتضمن هذا السجل نشاطاً تجريبياً فقط.',
  ],
  'Demo explored': ['Demo explorada', 'Demonstração explorada', 'تم استكشاف التجربة'],
  'No money sent': ['No se envió dinero', 'Nenhum dinheiro enviado', 'لم تُرسل أموال'],
  'Your tour starts here.': ['Su recorrido empieza aquí.', 'Seu passeio começa aqui.', 'تبدأ جولتك هنا.'],
  'Walk through a sample transfer to see its activity.': [
    'Recorra una transferencia de ejemplo para ver su actividad.',
    'Percorra uma transferência de exemplo para ver sua atividade.',
    'تعرّف على خطوات تحويل تجريبي لرؤية نشاطه.',
  ],
  'Try a demo transfer': [
    'Probar una transferencia de ejemplo',
    'Experimentar uma transferência de exemplo',
    'جرّب تحويلاً تجريبياً',
  ],
  'Interactive demo · Sample data · No money moves': [
    'Demo interactiva · Datos de ejemplo · Sin movimiento de dinero',
    'Demonstração interativa · Dados de exemplo · Sem movimentar dinheiro',
    'تجربة تفاعلية · بيانات تجريبية · لا تُنقل أموال',
  ],
  'Demo app navigation': ['Navegación de la demo', 'Navegação da demonstração', 'التنقل في التطبيق التجريبي'],
  Home: ['Inicio', 'Início', 'الرئيسية'],
  Send: ['Enviar', 'Enviar', 'إرسال'],
  People: ['Personas', 'Pessoas', 'الأشخاص'],
  Activity: ['Actividad', 'Atividade', 'النشاط'],
  'Enter a sample amount between $1 and $10,000.': [
    'Introduzca un importe de ejemplo entre 1 y 10.000 USD.',
    'Insira um valor de exemplo entre 1 e 10.000 USD.',
    'أدخل مبلغاً تجريبياً بين دولار واحد و10,000 دولار أمريكي.',
  ],
  'Forgot your password?': ['¿Olvidó su contraseña?', 'Esqueceu sua senha?', 'هل نسيت كلمة المرور؟'],
  'Privacy policy': ['Política de privacidad', 'Política de privacidade', 'سياسة الخصوصية'],
  'Contact support': ['Contactar con asistencia', 'Fale com o suporte', 'تواصل مع الدعم'],
  'Reset your password': ['Restablezca su contraseña', 'Redefina sua senha', 'أعد تعيين كلمة المرور'],
  'Enter the email address you use for XpressTend.': [
    'Introduzca el correo electrónico que utiliza en XpressTend.',
    'Insira o endereço de e-mail que você usa na XpressTend.',
    'أدخل عنوان البريد الإلكتروني الذي تستخدمه في XpressTend.',
  ],
  'If an active account matches that address, reset instructions will be emailed to it. Check your inbox and spam folder. Contact support if you need help.':
    [
      'Si hay una cuenta activa con esa dirección, recibirá instrucciones por correo. Revise su bandeja de entrada y la carpeta de correo no deseado. Contacte con asistencia si necesita ayuda.',
      'Se houver uma conta ativa com esse endereço, as instruções serão enviadas por e-mail. Confira a caixa de entrada e a pasta de spam. Fale com o suporte se precisar de ajuda.',
      'إذا كان هناك حساب نشط بهذا العنوان، فستُرسل إليه تعليمات إعادة التعيين. راجع صندوق الوارد ومجلد الرسائل غير المرغوب فيها. تواصل مع الدعم إذا احتجت إلى مساعدة.',
    ],
  'Sending…': ['Enviando…', 'Enviando…', 'جارٍ الإرسال…'],
  'Send reset instructions': ['Enviar instrucciones', 'Enviar instruções', 'إرسال تعليمات إعادة التعيين'],
  'Back to sign in': ['Volver al inicio de sesión', 'Voltar para entrar', 'العودة إلى تسجيل الدخول'],
  'The passwords do not match.': [
    'Las contraseñas no coinciden.',
    'As senhas não coincidem.',
    'كلمتا المرور غير متطابقتين.',
  ],
  'This reset link has expired or has already been used. Request a new link.': [
    'Este enlace ha caducado o ya se ha utilizado. Solicite uno nuevo.',
    'Este link expirou ou já foi usado. Solicite um novo link.',
    'انتهت صلاحية هذا الرابط أو سبق استخدامه. اطلب رابطاً جديداً.',
  ],
  'Choose a new password': ['Elija una contraseña nueva', 'Escolha uma nova senha', 'اختر كلمة مرور جديدة'],
  'Reset links expire after one hour and can be used once.': [
    'Los enlaces caducan en una hora y solo pueden utilizarse una vez.',
    'Os links expiram após uma hora e só podem ser usados uma vez.',
    'تنتهي صلاحية روابط إعادة التعيين بعد ساعة ويمكن استخدامها مرة واحدة.',
  ],
  'Your password has been reset. Sign in with your new password.': [
    'Su contraseña se ha restablecido. Inicie sesión con la nueva contraseña.',
    'Sua senha foi redefinida. Entre com a nova senha.',
    'أُعيد تعيين كلمة المرور. سجّل الدخول باستخدام كلمة المرور الجديدة.',
  ],
  'Confirm new password': [
    'Confirmar contraseña nueva',
    'Confirme a nova senha',
    'تأكيد كلمة المرور الجديدة',
  ],
  'Resetting…': ['Restableciendo…', 'Redefinindo…', 'جارٍ إعادة التعيين…'],
  'Reset password': ['Restablecer contraseña', 'Redefinir senha', 'إعادة تعيين كلمة المرور'],
  'This reset link is invalid.': [
    'Este enlace no es válido.',
    'Este link é inválido.',
    'رابط إعادة التعيين غير صالح.',
  ],
  'Sign in': ['Iniciar sesión', 'Entrar', 'تسجيل الدخول'],
  'Request a new reset link': [
    'Solicitar un nuevo enlace',
    'Solicitar um novo link',
    'طلب رابط إعادة تعيين جديد',
  ],
  'Delete your XpressTend account': [
    'Eliminar su cuenta de XpressTend',
    'Excluir sua conta XpressTend',
    'حذف حسابك في XpressTend',
  ],
  'Close your account and remove your sign-in details and profile contact information.': [
    'Cierre su cuenta y elimine sus datos de acceso y de contacto del perfil.',
    'Encerre sua conta e remova os dados de acesso e de contato do perfil.',
    'أغلق حسابك واحذف بيانات الدخول ومعلومات التواصل في ملفك الشخصي.',
  ],
  'Your account has been deleted and all sessions have been signed out. Transaction and compliance records are retained where required.':
    [
      'Su cuenta se ha eliminado y todas las sesiones se han cerrado. Los registros de transacciones y cumplimiento se conservan cuando sea obligatorio.',
      'Sua conta foi excluída e todas as sessões foram encerradas. Os registros de transações e conformidade são mantidos quando exigido.',
      'حُذف حسابك وأُغلقت جميع الجلسات. ويُحتفظ بسجلات المعاملات والامتثال حيثما كان ذلك مطلوباً.',
    ],
  'Deletion is permanent. Transaction, recipient and compliance records associated with financial activity may be retained to meet recordkeeping obligations. Transfers or unresolved funds must be settled before deletion.':
    [
      'La eliminación es permanente. Pueden conservarse registros de transacciones, destinatarios y cumplimiento vinculados a la actividad financiera para cumplir las obligaciones de conservación. Las transferencias o los fondos pendientes deben resolverse antes de eliminar la cuenta.',
      'A exclusão é permanente. Registros de transações, destinatários e conformidade associados à atividade financeira podem ser mantidos para cumprir obrigações de registro. Transferências ou fundos pendentes devem ser resolvidos antes da exclusão.',
      'الحذف نهائي. قد تُحفظ سجلات المعاملات والمستلمين والامتثال المرتبطة بالنشاط المالي للوفاء بالتزامات حفظ السجلات. يجب تسوية التحويلات أو الأموال غير المحسومة قبل الحذف.',
    ],
  'Loading your account…': ['Cargando su cuenta…', 'Carregando sua conta…', 'جارٍ تحميل حسابك…'],
  'Sign in to the account you want to delete, then confirm deletion with your password.': [
    'Inicie sesión en la cuenta que desea eliminar y confirme la eliminación con su contraseña.',
    'Entre na conta que deseja excluir e confirme a exclusão com sua senha.',
    'سجّل الدخول إلى الحساب الذي تريد حذفه، ثم أكد الحذف بكلمة مرورك.',
  ],
  'Sign in to delete your account': [
    'Iniciar sesión para eliminar su cuenta',
    'Entre para excluir sua conta',
    'سجّل الدخول لحذف حسابك',
  ],
  'Account:': ['Cuenta:', 'Conta:', 'الحساب:'],
  'I understand that deleting my account is permanent.': [
    'Entiendo que la eliminación de mi cuenta es permanente.',
    'Entendo que a exclusão da minha conta é permanente.',
    'أفهم أن حذف حسابي نهائي.',
  ],
  'Deleting…': ['Eliminando…', 'Excluindo…', 'جارٍ الحذف…'],
  'Delete my account': ['Eliminar mi cuenta', 'Excluir minha conta', 'حذف حسابي'],
  'Keep my account': ['Conservar mi cuenta', 'Manter minha conta', 'الاحتفاظ بحسابي'],
  'Your account has a pending transfer or unresolved funds. Contact support to settle it before deleting your account.':
    [
      'Su cuenta tiene una transferencia pendiente o fondos sin resolver. Contacte con asistencia para resolverlo antes de eliminarla.',
      'Sua conta tem uma transferência pendente ou fundos não resolvidos. Fale com o suporte para resolver antes de excluir a conta.',
      'يحتوي حسابك على تحويل معلق أو أموال غير محسومة. تواصل مع الدعم لتسويتها قبل حذف حسابك.',
    ],
  'Your account changed during this request. Sign in again and try once more.': [
    'Su cuenta cambió durante la solicitud. Inicie sesión de nuevo e inténtelo otra vez.',
    'Sua conta mudou durante esta solicitação. Entre novamente e tente outra vez.',
    'تغيّر حسابك أثناء هذا الطلب. سجّل الدخول مجدداً وحاول مرة أخرى.',
  ],
  'Too many attempts. Please wait a few minutes before trying again.': [
    'Demasiados intentos. Espere unos minutos antes de volver a intentarlo.',
    'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
    'محاولات كثيرة جداً. انتظر بضع دقائق قبل المحاولة مجدداً.',
  ],
  'Verify government ID and live selfie': [
    'Verificar documento oficial y autorretrato en vivo',
    'Verificar documento oficial e selfie ao vivo',
    'التحقق من الوثيقة الرسمية والصورة الذاتية المباشرة',
  ],
  'Password recovery': ['Recuperación de contraseña', 'Recuperação de senha', 'استرداد كلمة المرور'],
  'Privacy and data retention': [
    'Privacidad y conservación de datos',
    'Privacidade e retenção de dados',
    'الخصوصية والاحتفاظ بالبيانات',
  ],
  'Delete account': ['Eliminar cuenta', 'Excluir conta', 'حذف الحساب'],
  'Account status:': ['Estado de la cuenta:', 'Status da conta:', 'حالة الحساب:'],
  'Could not sign out. Please try again.': [
    'No se pudo cerrar la sesión. Inténtelo de nuevo.',
    'Não foi possível sair. Tente novamente.',
    'تعذر تسجيل الخروج. حاول مجدداً.',
  ],
  'Verify your identity': ['Verifique su identidad', 'Verifique sua identidade', 'تحقق من هويتك'],
  'A secure start.': ['Un comienzo seguro.', 'Um começo seguro.', 'بداية آمنة.'],
  'Verify your government ID and complete a live selfie before sending money.': [
    'Verifique su documento oficial y complete un autorretrato en vivo antes de enviar dinero.',
    'Verifique seu documento oficial e faça uma selfie ao vivo antes de enviar dinheiro.',
    'تحقق من وثيقتك الرسمية وأكمل صورة ذاتية مباشرة قبل إرسال الأموال.',
  ],
  'Status:': ['Estado:', 'Status:', 'الحالة:'],
  'Government-issued ID': [
    'Documento oficial de identidad',
    'Documento oficial de identidade',
    'وثيقة هوية رسمية',
  ],
  'Use a valid, unexpired identity document. Your legal name must match your XpressTend account.': [
    'Utilice un documento de identidad válido y vigente. Su nombre legal debe coincidir con el de su cuenta de XpressTend.',
    'Use um documento de identidade válido e dentro da validade. Seu nome legal deve corresponder ao da conta XpressTend.',
    'استخدم وثيقة هوية صالحة وغير منتهية. يجب أن يطابق اسمك القانوني الاسم في حساب XpressTend.',
  ],
  'Live selfie check': [
    'Comprobación de autorretrato en vivo',
    'Verificação de selfie ao vivo',
    'فحص الصورة الذاتية المباشرة',
  ],
  'Follow the camera prompts to confirm you are present and match the person on the ID.': [
    'Siga las indicaciones de la cámara para confirmar su presencia y que coincide con la persona del documento.',
    'Siga as instruções da câmera para confirmar sua presença e a correspondência com a pessoa no documento.',
    'اتبع تعليمات الكاميرا لتأكيد حضورك ومطابقتك للشخص في الوثيقة.',
  ],
  'Identity verification is being activated. Transfers remain unavailable until verification is complete.': [
    'Se está activando la verificación de identidad. Las transferencias siguen sin estar disponibles hasta completarla.',
    'A verificação de identidade está sendo ativada. As transferências permanecem indisponíveis até a conclusão da verificação.',
    'يجري تفعيل التحقق من الهوية. تظل التحويلات غير متاحة حتى اكتمال التحقق.',
  ],
  'I agree to submit my identity document and biometric selfie to Persona for identity verification. Review':
    [
      'Acepto enviar mi documento y autorretrato biométrico a Persona para verificar mi identidad. Consulte',
      'Concordo em enviar meu documento e minha selfie biométrica à Persona para verificar minha identidade. Consulte',
      'أوافق على إرسال وثيقة هويتي وصورتي الذاتية البيومترية إلى Persona للتحقق من الهوية. راجع',
    ],
  'Persona’s privacy policy': [
    'la política de privacidad de Persona',
    'a política de privacidade da Persona',
    'سياسة خصوصية Persona',
  ],
  'and XpressTend’s': ['y la de XpressTend:', 'e a da XpressTend:', 'وسياسة XpressTend:'],
  'privacy policy': ['política de privacidad', 'política de privacidade', 'سياسة الخصوصية'],
  'before continuing.': ['antes de continuar.', 'antes de continuar.', 'قبل المتابعة.'],
  'Preparing secure verification…': [
    'Preparando la verificación segura…',
    'Preparando verificação segura…',
    'جارٍ إعداد التحقق الآمن…',
  ],
  'Start ID and selfie verification': [
    'Iniciar verificación de documento y autorretrato',
    'Iniciar verificação de documento e selfie',
    'بدء التحقق من الوثيقة والصورة الذاتية',
  ],
  'Continue securely with Persona': [
    'Continuar de forma segura con Persona',
    'Continuar com segurança na Persona',
    'المتابعة بأمان مع Persona',
  ],
  'I’ve finished. Check my verification': [
    'He terminado. Comprobar mi verificación',
    'Concluí. Verificar meu resultado',
    'انتهيت. تحقق من نتيجتي',
  ],
  'Results update after the provider completes its checks. Some cases require review. XpressTend does not store your ID images or selfie in its application database.':
    [
      'Los resultados se actualizan cuando el proveedor termina sus comprobaciones. Algunos casos requieren revisión. XpressTend no almacena imágenes del documento ni del autorretrato en la base de datos de la aplicación.',
      'Os resultados são atualizados após as verificações do provedor. Alguns casos exigem análise. A XpressTend não armazena imagens do documento ou da selfie no banco de dados do aplicativo.',
      'تُحدّث النتائج بعد إكمال المزود فحوصاته. تتطلب بعض الحالات مراجعة. لا تحفظ XpressTend صور وثيقتك أو صورتك الذاتية في قاعدة بيانات التطبيق.',
    ],
  'Cannot load verification status. Please retry.': [
    'No se pudo cargar el estado de verificación. Inténtelo de nuevo.',
    'Não foi possível carregar o status da verificação. Tente novamente.',
    'تعذر تحميل حالة التحقق. حاول مجدداً.',
  ],
  'Unable to check verification.': [
    'No se pudo comprobar la verificación.',
    'Não foi possível verificar o resultado.',
    'تعذر فحص نتيجة التحقق.',
  ],
  'Saved details are for test records. Delivery services are not connected.': [
    'Los datos guardados son para registros de prueba. Los servicios de entrega no están conectados.',
    'Os dados salvos são para registros de teste. Os serviços de entrega não estão conectados.',
    'البيانات المحفوظة مخصصة لسجلات الاختبار. خدمات التسليم غير متصلة.',
  ],
  'Mobile wallet': ['Monedero móvil', 'Carteira móvel', 'محفظة هاتف محمول'],
  'Bank account': ['Cuenta bancaria', 'Conta bancária', 'حساب مصرفي'],
  'Cash pickup': ['Recogida de efectivo', 'Retirada em dinheiro', 'استلام نقدي'],
  unverified: ['Sin verificar', 'Não verificado', 'غير متحقق'],
  pending: ['Pendiente', 'Pendente', 'معلق'],
  verified: ['Verificado', 'Verificado', 'تم التحقق'],
  failed: ['Fallido', 'Falhou', 'فشل'],
  active: ['Activo', 'Ativo', 'نشط'],
  unavailable: ['No disponible', 'Indisponível', 'غير متاح'],

  'Can I send real money?': [
    '¿Puedo enviar dinero real?',
    'Posso enviar dinheiro real?',
    'هل يمكنني إرسال أموال فعلية؟',
  ],
  'Customer money movement is unavailable. Test transfers do not charge a bank or card and do not deliver funds.':
    [
      'El movimiento de dinero de clientes no está disponible. Las transferencias de prueba no cargan importes a bancos o tarjetas ni entregan fondos.',
      'A movimentação de dinheiro de clientes está indisponível. Transferências de teste não cobram de bancos ou cartões nem entregam fundos.',
      'نقل أموال العملاء غير متاح. لا تفرض التحويلات التجريبية رسوماً على بنك أو بطاقة ولا تسلّم أموالاً.',
    ],
  'Where are my recipients and transfer records?': [
    '¿Dónde están mis destinatarios y registros de transferencias?',
    'Onde estão meus destinatários e registros de transferências?',
    'أين مستلموّي وسجلات تحويلاتي؟',
  ],
  'Your account shows only your saved recipients and API transfer records. If loading fails, retry instead of relying on sample data.':
    [
      'Su cuenta muestra solo sus destinatarios guardados y los registros de transferencias de la API. Si falla la carga, vuelva a intentarlo; no utilice datos de ejemplo.',
      'Sua conta mostra apenas seus destinatários salvos e os registros de transferências da API. Se o carregamento falhar, tente novamente em vez de usar dados de exemplo.',
      'يعرض حسابك المستلمين المحفوظين وسجلات التحويلات من الخدمة فقط. إذا فشل التحميل، أعد المحاولة بدلاً من الاعتماد على بيانات تجريبية.',
    ],
  'How do I recover or delete my account?': [
    '¿Cómo recupero o elimino mi cuenta?',
    'Como recupero ou excluo minha conta?',
    'كيف أسترد حسابي أو أحذفه؟',
  ],
  'Use Password recovery or Delete account in Profile. Required financial records may be retained under the privacy policy.':
    [
      'Utilice Recuperación de contraseña o Eliminar cuenta en Perfil. Los registros financieros obligatorios pueden conservarse conforme a la política de privacidad.',
      'Use Recuperação de senha ou Excluir conta no Perfil. Registros financeiros obrigatórios podem ser mantidos conforme a política de privacidade.',
      'استخدم استرداد كلمة المرور أو حذف الحساب في الملف الشخصي. قد تُحفظ السجلات المالية المطلوبة وفق سياسة الخصوصية.',
    ],
  'Use the email or phone contact below for account support.': [
    'Utilice el correo o el teléfono que figuran a continuación para obtener ayuda con su cuenta.',
    'Use o e-mail ou telefone abaixo para obter ajuda com sua conta.',
    'استخدم البريد الإلكتروني أو رقم الهاتف أدناه للحصول على دعم الحساب.',
  ],
  'Transfer pricing': ['Precios de las transferencias', 'Preços das transferências', 'تسعير التحويلات'],
  'Live customer exchange and delivery services are unavailable. Test transfers request a current server quote for supported destinations.':
    [
      'Los servicios reales de cambio y entrega para clientes no están disponibles. Las transferencias de prueba solicitan al servidor una cotización actual para los destinos admitidos.',
      'Os serviços reais de câmbio e entrega para clientes estão indisponíveis. Transferências de teste solicitam ao servidor uma cotação atual para destinos aceitos.',
      'خدمات الصرف والتسليم الفعلية للعملاء غير متاحة. تطلب التحويلات التجريبية عرض سعر حالياً من الخادم للوجهات المدعومة.',
    ],
  'Open test quote form': [
    'Abrir formulario de cotización de prueba',
    'Abrir formulário de cotação de teste',
    'فتح نموذج التسعير التجريبي',
  ],
  'Account help': ['Ayuda con la cuenta', 'Ajuda com a conta', 'مساعدة الحساب'],
  Referrals: ['Recomendaciones', 'Indicações', 'الإحالات'],
  'The referral rewards program is not available. No referral earnings or redeemable referral code have been issued.':
    [
      'El programa de recompensas por recomendaciones no está disponible. No se han generado ganancias ni códigos canjeables.',
      'O programa de recompensas por indicações não está disponível. Não foram emitidos ganhos ou códigos resgatáveis.',
      'برنامج مكافآت الإحالة غير متاح. لم تصدر أرباح إحالة أو رموز قابلة للاسترداد.',
    ],
  'Test transfer only. No bank or card is charged and no money is delivered.': [
    'Solo transferencia de prueba. No se carga ningún importe a un banco o tarjeta ni se entrega dinero.',
    'Apenas transferência de teste. Nenhum banco ou cartão é cobrado e nenhum dinheiro é entregue.',
    'تحويل تجريبي فقط. لا يُخصم أي مبلغ من بنك أو بطاقة ولا تُسلّم أموال.',
  ],
  'Your account password authorizes a test record. Compliance review is required; no funds move.': [
    'La contraseña de su cuenta autoriza un registro de prueba. Se requiere revisión de cumplimiento; no se mueven fondos.',
    'A senha da sua conta autoriza um registro de teste. É necessária análise de conformidade; nenhum fundo é movimentado.',
    'تخوّل كلمة مرور حسابك إنشاء سجل تجريبي. تلزم مراجعة الامتثال؛ ولا تُنقل أموال.',
  ],
  'Authorize with your account password': [
    'Autorizar con la contraseña de su cuenta',
    'Autorizar com a senha da sua conta',
    'التخويل بكلمة مرور حسابك',
  ],
  'Test transfers only. Bank, wallet, cash pickup, and airtime delivery are unavailable.': [
    'Solo transferencias de prueba. No están disponibles las entregas a bancos, monederos, recogida de efectivo ni recargas.',
    'Apenas transferências de teste. Entregas em bancos, carteiras, retirada em dinheiro e recargas estão indisponíveis.',
    'تحويلات تجريبية فقط. التسليم إلى البنوك والمحافظ والاستلام النقدي وشحن الرصيد غير متاح.',
  ],
  'USD · US Dollar': ['USD · Dólar estadounidense', 'USD · Dólar americano', 'USD · دولار أمريكي'],
  'Test funding only. No bank or card will be charged.': [
    'Solo fondos de prueba. No se cargará ningún importe a un banco o tarjeta.',
    'Apenas fundos de teste. Nenhum banco ou cartão será cobrado.',
    'تمويل تجريبي فقط. لن يُخصم أي مبلغ من بنك أو بطاقة.',
  ],
  'Payment methods are unavailable. This test will not charge a bank or card.': [
    'Los métodos de pago no están disponibles. Esta prueba no cargará importes a un banco o tarjeta.',
    'As formas de pagamento estão indisponíveis. Este teste não cobrará de um banco ou cartão.',
    'وسائل الدفع غير متاحة. لن تخصم هذه التجربة من بنك أو بطاقة.',
  ],
  'Test transfer recorded': [
    'Transferencia de prueba registrada',
    'Transferência de teste registrada',
    'سُجّل التحويل التجريبي',
  ],
  'Pending review for {recipient}. No money has been delivered.': [
    'Pendiente de revisión para {recipient}. No se ha entregado dinero.',
    'Aguardando análise para {recipient}. Nenhum dinheiro foi entregue.',
    'بانتظار المراجعة للمستلم {recipient}. لم تُسلّم أموال.',
  ],
  'Test record': ['Registro de prueba', 'Registro de teste', 'سجل تجريبي'],
  'Pending review': ['Pendiente de revisión', 'Aguardando análise', 'بانتظار المراجعة'],
  completed: ['Completado', 'Concluído', 'مكتمل'],
  cancelled: ['Cancelado', 'Cancelado', 'ملغى'],

  'Checking identity and sanctions…': [
    'Comprobando identidad y sanciones…',
    'Verificando identidade e sanções…',
    'جارٍ فحص الهوية والعقوبات…',
  ],
  'Identity and sanctions checks passed.': [
    'Comprobaciones de identidad y sanciones superadas.',
    'Verificações de identidade e sanções aprovadas.',
    'اجتازت فحوص الهوية والعقوبات.',
  ],
  'Compliance review is required before sending.': [
    'Se requiere una revisión de cumplimiento antes de enviar.',
    'É necessária análise de conformidade antes do envio.',
    'تلزم مراجعة الامتثال قبل الإرسال.',
  ],
  'Identity verification and current sanctions clearance are required. Open Profile to verify your ID or contact support.':
    [
      'Se requiere verificar la identidad y superar una comprobación de sanciones actualizada. Abra Perfil para verificar su documento o contacte con asistencia.',
      'São necessárias verificação de identidade e aprovação atualizada de sanções. Abra o Perfil para verificar seu documento ou fale com o suporte.',
      'يلزم التحقق من الهوية واجتياز فحص عقوبات سارٍ. افتح الملف الشخصي للتحقق من وثيقتك أو تواصل مع الدعم.',
    ],
  'Saved payout details': ['Datos de pago guardados', 'Dados de pagamento salvos', 'بيانات الصرف المحفوظة'],
  'Not available in test mode': [
    'No disponible en modo de prueba',
    'Indisponível no modo de teste',
    'غير متاح في وضع الاختبار',
  ],
  'Choose a recipient for a test quote': [
    'Elija un destinatario para una cotización de prueba',
    'Escolha um destinatário para uma cotação de teste',
    'اختر مستلماً للحصول على تسعير تجريبي',
  ],
  'Account services are temporarily unavailable. Please try again.': [
    'Los servicios de la cuenta no están disponibles temporalmente. Inténtelo de nuevo.',
    'Os serviços da conta estão temporariamente indisponíveis. Tente novamente.',
    'خدمات الحساب غير متاحة مؤقتاً. حاول مجدداً.',
  ],
  'Could not load your account.': [
    'No se pudo cargar su cuenta.',
    'Não foi possível carregar sua conta.',
    'تعذر تحميل حسابك.',
  ],
  'Sign in to save a recipient.': [
    'Inicie sesión para guardar un destinatario.',
    'Entre para salvar um destinatário.',
    'سجّل الدخول لحفظ مستلم.',
  ],
  'A current transfer quote is unavailable.': [
    'No hay una cotización de transferencia vigente disponible.',
    'Uma cotação atual de transferência está indisponível.',
    'لا يتوفر عرض سعر تحويل سارٍ.',
  ],
  'A transfer request is already being processed.': [
    'Ya se está procesando una solicitud de transferencia.',
    'Uma solicitação de transferência já está sendo processada.',
    'تجري معالجة طلب تحويل بالفعل.',
  ],
  'A test transfer is currently unavailable.': [
    'La transferencia de prueba no está disponible en este momento.',
    'Uma transferência de teste está indisponível no momento.',
    'التحويل التجريبي غير متاح حالياً.',
  ],
  'Enter your account password to authorize this test.': [
    'Introduzca la contraseña de su cuenta para autorizar esta prueba.',
    'Insira a senha da sua conta para autorizar este teste.',
    'أدخل كلمة مرور حسابك لتخويل هذه التجربة.',
  ],
  'The previous transfer request could not be confirmed. Check your activity before creating another test.': [
    'No se pudo confirmar la solicitud anterior. Revise su actividad antes de crear otra prueba.',
    'Não foi possível confirmar a solicitação anterior. Confira sua atividade antes de criar outro teste.',
    'تعذر تأكيد طلب التحويل السابق. راجع نشاطك قبل إنشاء تجربة أخرى.',
  ],
  'The earlier payment status must be checked in your activity before another test can be created.': [
    'Debe comprobar el estado del pago anterior en su actividad antes de crear otra prueba.',
    'É necessário conferir o status do pagamento anterior na sua atividade antes de criar outro teste.',
    'يجب التحقق من حالة الدفع السابق في نشاطك قبل إنشاء تجربة أخرى.',
  ],
  'The earlier transfer expiry could not be verified. Check your activity before trying again.': [
    'No se pudo verificar el vencimiento de la transferencia anterior. Revise su actividad antes de volver a intentarlo.',
    'Não foi possível verificar a validade da transferência anterior. Confira sua atividade antes de tentar novamente.',
    'تعذر التحقق من انتهاء صلاحية التحويل السابق. راجع نشاطك قبل المحاولة مجدداً.',
  ],
  'The earlier payment result could not be confirmed. Check your activity before creating another test.': [
    'No se pudo confirmar el resultado del pago anterior. Revise su actividad antes de crear otra prueba.',
    'Não foi possível confirmar o resultado do pagamento anterior. Confira sua atividade antes de criar outro teste.',
    'تعذر تأكيد نتيجة الدفع السابق. راجع نشاطك قبل إنشاء تجربة أخرى.',
  ],
  'The earlier test quote expired. A new quote is being requested; review it before trying again.': [
    'La cotización de prueba anterior ha caducado. Se está solicitando una nueva; revísela antes de volver a intentarlo.',
    'A cotação de teste anterior expirou. Uma nova cotação está sendo solicitada; revise-a antes de tentar novamente.',
    'انتهت صلاحية التسعير التجريبي السابق. يجري طلب تسعير جديد؛ راجعه قبل المحاولة مجدداً.',
  ],
  'Your quote expired. A new test quote is being requested; review it before continuing.': [
    'Su cotización ha caducado. Se está solicitando una nueva cotización de prueba; revísela antes de continuar.',
    'Sua cotação expirou. Uma nova cotação de teste está sendo solicitada; revise-a antes de continuar.',
    'انتهت صلاحية عرض السعر. يجري طلب تسعير تجريبي جديد؛ راجعه قبل المتابعة.',
  ],
  'The transfer could not be verified. Check your activity before trying again.': [
    'No se pudo verificar la transferencia. Revise su actividad antes de volver a intentarlo.',
    'Não foi possível verificar a transferência. Confira sua atividade antes de tentar novamente.',
    'تعذر التحقق من التحويل. راجع نشاطك قبل المحاولة مجدداً.',
  ],
  'The transfer request could not be confirmed. Check your activity before trying again.': [
    'No se pudo confirmar la solicitud de transferencia. Revise su actividad antes de volver a intentarlo.',
    'Não foi possível confirmar a solicitação de transferência. Confira sua atividade antes de tentar novamente.',
    'تعذر تأكيد طلب التحويل. راجع نشاطك قبل المحاولة مجدداً.',
  ],
  'The test transfer status could not be verified. Check your activity.': [
    'No se pudo verificar el estado de la transferencia de prueba. Revise su actividad.',
    'Não foi possível verificar o status da transferência de teste. Confira sua atividade.',
    'تعذر التحقق من حالة التحويل التجريبي. راجع نشاطك.',
  ],
  'A current exchange rate is unavailable.': [
    'No hay un tipo de cambio vigente disponible.',
    'Uma taxa de câmbio atual está indisponível.',
    'لا يتوفر سعر صرف سارٍ.',
  ],
  'That password was not accepted.': [
    'No se ha aceptado esa contraseña.',
    'Essa senha não foi aceita.',
    'لم تُقبل كلمة المرور.',
  ],
  'The payment result could not be confirmed.': [
    'No se pudo confirmar el resultado del pago.',
    'Não foi possível confirmar o resultado do pagamento.',
    'تعذر تأكيد نتيجة الدفع.',
  ],

  'The conversational assistant is unavailable for customer accounts. Contact support for account help.': [
    'El asistente conversacional no está disponible para cuentas de clientes. Contacte con asistencia para obtener ayuda con su cuenta.',
    'O assistente de conversação está indisponível para contas de clientes. Fale com o suporte para obter ajuda com sua conta.',
    'المساعد الحواري غير متاح لحسابات العملاء. تواصل مع الدعم للمساعدة في حسابك.',
  ],
  'Voice commands': ['Comandos de voz', 'Comandos de voz', 'الأوامر الصوتية'],
  'Voice recognition is not available for customer accounts. Use the transfer form to create a test record; no audio is recorded.':
    [
      'El reconocimiento de voz no está disponible para cuentas de clientes. Utilice el formulario de transferencia para crear un registro de prueba; no se graba audio.',
      'O reconhecimento de voz está indisponível para contas de clientes. Use o formulário de transferência para criar um registro de teste; nenhum áudio é gravado.',
      'التعرّف على الصوت غير متاح لحسابات العملاء. استخدم نموذج التحويل لإنشاء سجل تجريبي؛ ولا يُسجّل صوت.',
    ],
  'Open test transfer form': [
    'Abrir formulario de transferencia de prueba',
    'Abrir formulário de transferência de teste',
    'فتح نموذج التحويل التجريبي',
  ],
  'Test amount': ['Importe de prueba', 'Valor de teste', 'المبلغ التجريبي'],
  'Money delivered': ['Dinero entregado', 'Dinheiro entregue', 'الأموال المسلّمة'],
  'None — test mode': ['Ninguno — modo de prueba', 'Nenhum — modo de teste', 'لا شيء — وضع الاختبار'],
  'compliance hold': [
    'Retenido para revisión de cumplimiento',
    'Retido para análise de conformidade',
    'معلق لمراجعة الامتثال',
  ],
  'pending payment': ['Pendiente de pago', 'Pagamento pendente', 'بانتظار الدفع'],
  refunded: ['Reembolsado', 'Reembolsado', 'مسترد'],
  processing: ['En proceso', 'Em processamento', 'قيد المعالجة'],
  'payout pending': ['Pago al destinatario pendiente', 'Pagamento ao destinatário pendente', 'بانتظار الصرف'],
  paid: ['Pagado', 'Pago', 'مدفوع'],
  'Loading your recipients…': [
    'Cargando sus destinatarios…',
    'Carregando seus destinatários…',
    'جارٍ تحميل المستلمين…',
  ],
  'Add a recipient before creating a test transfer.': [
    'Añada un destinatario antes de crear una transferencia de prueba.',
    'Adicione um destinatário antes de criar uma transferência de teste.',
    'أضف مستلماً قبل إنشاء تحويل تجريبي.',
  ],
  'Getting a test quote…': [
    'Obteniendo una cotización de prueba…',
    'Obtendo uma cotação de teste…',
    'جارٍ الحصول على تسعير تجريبي…',
  ],
  'Enter a positive amount with up to two decimal places.': [
    'Introduzca un importe positivo con un máximo de dos decimales.',
    'Insira um valor positivo com até duas casas decimais.',
    'أدخل مبلغاً موجباً يتضمن منزلتين عشريتين كحد أقصى.',
  ],
  'Sign in to create a test transfer.': [
    'Inicie sesión para crear una transferencia de prueba.',
    'Entre para criar uma transferência de teste.',
    'سجّل الدخول لإنشاء تحويل تجريبي.',
  ],
  'Choose one of your saved recipients before continuing.': [
    'Elija uno de sus destinatarios guardados antes de continuar.',
    'Escolha um dos seus destinatários salvos antes de continuar.',
    'اختر أحد المستلمين المحفوظين قبل المتابعة.',
  ],
  'Transfers to this recipient’s country are currently unavailable.': [
    'Las transferencias al país de este destinatario no están disponibles actualmente.',
    'As transferências para o país deste destinatário estão indisponíveis no momento.',
    'التحويلات إلى بلد هذا المستلم غير متاحة حالياً.',
  ],
  'This account cannot create transfers.': [
    'Esta cuenta no puede crear transferencias.',
    'Esta conta não pode criar transferências.',
    'لا يمكن لهذا الحساب إنشاء تحويلات.',
  ],
  'Identity verification is required before a test transfer.': [
    'Se requiere verificar la identidad antes de una transferencia de prueba.',
    'É necessário verificar a identidade antes de uma transferência de teste.',
    'يلزم التحقق من الهوية قبل إجراء تحويل تجريبي.',
  ],
  'A current transfer quote is required before continuing.': [
    'Se requiere una cotización de transferencia vigente antes de continuar.',
    'É necessária uma cotação atual de transferência antes de continuar.',
    'يلزم عرض سعر تحويل سارٍ قبل المتابعة.',
  ],
}
export function useInterfaceCopy() {
  const { lang } = useI18n()
  const index = lang === 'es' ? 0 : lang === 'pt-BR' ? 1 : 2
  return useCallback(
    (source: string, vars?: Record<string, string | number>) => {
      const text = lang === 'en' ? source : (interfaceMessages[source]?.[index] ?? source)
      return text.replace(/\{(\w+)\}/g, (match, key: string) =>
        vars?.[key] === undefined ? match : lang === 'ar' ? `\u2068${vars[key]}\u2069` : String(vars[key]),
      )
    },
    [lang, index],
  )
}
