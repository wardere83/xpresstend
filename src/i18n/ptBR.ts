import type { en } from './en'

/** Português (Brasil). Everyday remittance wording — direct, warm, no jargon. */
export const ptBR: Record<keyof typeof en, string> = {
  // ---- Generic ----
  'common.continue': 'Continuar',
  'common.cancel': 'Cancelar',
  'common.done': 'Concluído',
  'common.confirm': 'Confirmar',
  'common.viewAll': 'Ver tudo',
  'common.seeAll': 'Ver todos',
  'common.close': 'Fechar',
  'common.back': 'Voltar',
  'common.yes': 'Sim',
  'common.no': 'Não',
  'common.edit': 'Editar',
  'common.online': 'Online',
  'common.instant': 'Na hora',
  'common.completed': 'Concluída',
  'common.pending': 'Pendente',
  'common.language': 'Idioma',
  'common.secure': '100% seguro e criptografado',
  'common.search': 'Buscar',

  // ---- Bottom navigation ----
  'nav.home': 'Início',
  'nav.recipients': 'Destinatários',
  'nav.activity': 'Atividade',
  'nav.profile': 'Perfil',
  'nav.speak': 'Falar',

  // ---- Home ----
  'home.greeting': 'Olá, {name}',
  'home.subtitle': 'Como podemos ajudar você hoje?',
  'home.voiceTitle': 'Toque no microfone para falar',
  'home.voiceSubtitle': 'Fale em português ou inglês',
  'home.sendMoney': 'Enviar dinheiro',
  'home.sendMoneySub': 'Rápido, seguro e confiável',
  'home.recentTransaction': 'Transferência recente',
  'home.recipients': 'Destinatários',
  'home.quickActions': 'Ações rápidas',
  'home.noTransactions': 'Nenhuma transferência ainda — a primeira leva cerca de um minuto.',

  // ---- Services ----
  'service.mobileMoney': 'Mobile Money',
  'service.bankTransfer': 'Transferência bancária',
  'service.cashPickup': 'Retirada em dinheiro',
  'service.airtime': 'Recargas e contas',
  'service.mobileMoneySub': 'Direto para uma carteira digital',
  'service.bankTransferSub': 'Para uma conta bancária',
  'service.cashPickupSub': 'Retire com um agente',
  'service.airtimeSub': 'Recarregue um celular ou pague uma conta',

  // ---- Quick actions ----
  'quick.help': 'Central de ajuda',
  'quick.helpSub': 'Respostas para as dúvidas mais comuns',
  'quick.rates': 'Taxas',
  'quick.ratesSub': 'Ver taxas ao vivo',
  'quick.refer': 'Indique e ganhe',
  'quick.referSub': 'Convide amigos e ganhe recompensas',
  'quick.support': 'Suporte ao vivo',
  'quick.supportSub': 'Atendimento 24/7. Estamos aqui para ajudar',

  // ---- Voice assistant ----
  'voice.title': 'Assistente de voz',
  'voice.listening': 'Ouvindo...',
  'voice.speakNow': 'Pode falar',
  'voice.trySaying': 'Experimente dizer:',
  'voice.sample1': 'Enviar US$ 100 para a minha mãe',
  'voice.sample2': 'Quanto eu enviei no mês passado?',
  'voice.sample3': 'Adicionar novo destinatário',
  'voice.sample4': 'Qual é a taxa de câmbio hoje?',
  'voice.poweredBy': 'Com tecnologia {brand} AI',
  'voice.stop': 'Parar',
  'voice.secondsLeft': 'Você tem {seconds} segundos',
  'voice.tapToStart': 'Toque para começar',

  // ---- Assistant chat ----
  'chat.title': '{assistant}',
  'chat.placeholder': 'Digite sua mensagem...',
  'chat.greeting': 'Olá! Como posso ajudar você hoje?',
  'chat.userSend500': 'Quero enviar US$ 500 para a minha mãe.',
  'chat.botConfirmIntro':
    'Certo! Você está enviando {amount} para {name}. Carteira digital com final {last4}. Está correto?',
  'chat.confirmDetails': 'Confirme os dados',
  'chat.looksGood': 'Está tudo certo. Deseja continuar?',
  'chat.rateQuestion': 'Qual é a taxa de câmbio hoje?',
  'chat.rateAnswer':
    '1 USD = {rate} xelins somalis. As taxas de câmbio podem mudar. Confira as taxas ao vivo antes de enviar.',
  'chat.fallback':
    'Posso enviar dinheiro, adicionar um destinatário, consultar a taxa ou rastrear uma transferência. O que você prefere?',
  'chat.suggest.send': 'Enviar dinheiro',
  'chat.suggest.rate': 'Consultar taxa',
  'chat.suggest.track': 'Rastrear transferência',

  // ---- Transfer fields ----
  'field.recipient': 'Destinatário',
  'field.mobileWallet': 'Carteira digital',
  'field.country': 'País',
  'field.youSend': 'Você envia',
  'field.fee': 'Taxa',
  'field.recipientGets': 'O destinatário recebe',
  'field.delivery': 'Entrega',
  'field.total': 'Total',
  'field.to': 'Para',
  'field.exchangeRate': 'Taxa de câmbio',
  'field.availableBalance': 'Saldo disponível',
  'field.estimated': 'Estimado',
  'field.summary': 'Resumo',
  'field.referenceId': 'Código de referência',
  'field.dateTime': 'Data e hora',
  'field.paymentMethod': 'Forma de pagamento',

  // ---- Send money ----
  'send.title': 'Enviar dinheiro',
  'send.from': 'De (você envia)',
  'send.toGets': 'Para (o destinatário recebe)',
  'send.chooseRecipient': 'Escolher destinatário',
  'send.changeRecipient': 'Alterar',
  'send.amountTooHigh': 'O valor é maior que o seu saldo disponível.',
  'send.amountTooLow': 'Digite um valor acima da taxa de {fee}.',

  // ---- Payment methods ----
  'pay.bank': 'Conta bancária',
  'pay.debit': 'Cartão de débito',
  'pay.applePay': 'Apple Pay',
  'pay.googlePay': 'Google Pay',

  // ---- Review ----
  'review.title': 'Revisar e confirmar',
  'review.important': 'Importante',
  'review.importantBody':
    'Confira se todos os dados estão corretos. Depois de enviada, a transferência não pode ser cancelada.',
  'review.securityCheck': 'Verificação de segurança',
  'review.securityBody':
    'Para sua segurança, você precisará confirmar com Face ID ou PIN para concluir esta transferência.',
  'review.faceId': 'Face ID',
  'review.pin': 'PIN',
  'review.send': 'Enviar {amount}',
  'review.verifying': 'Verificando...',

  // ---- Success ----
  'success.title': 'Dinheiro enviado!',
  'success.subtitle': '{amount} foi enviado para {name}',
  'success.youSent': 'Você enviou',
  'success.share': 'Compartilhar comprovante',
  'success.sendAnother': 'Enviar outra',
  'success.copied': 'Copiado',

  // ---- Recipients ----
  'recipients.title': 'Destinatários',
  'recipients.add': 'Adicionar novo destinatário',
  'recipients.favourites': 'Favoritos',
  'recipients.all': 'Todos os destinatários',
  'recipients.searchPlaceholder': 'Buscar por nome ou número',
  'recipients.empty': 'Nenhum destinatário corresponde a essa busca.',
  'recipients.sendTo': 'Enviar para {name}',

  // ---- Activity ----
  'activity.title': 'Atividade',
  'activity.thisMonth': 'Este mês',
  'activity.sentThisMonth': 'Enviado este mês',
  'activity.transfers': '{count} transferências',
  'activity.empty': 'Nada por aqui ainda.',
  'activity.filterAll': 'Todas',
  'activity.filterSent': 'Enviadas',
  'activity.filterPending': 'Pendentes',

  // ---- Profile ----
  'profile.title': 'Perfil',
  'profile.verified': 'Conta verificada',
  'profile.personal': 'Dados pessoais',
  'profile.security': 'Segurança e PIN',
  'profile.payment': 'Formas de pagamento',
  'profile.language': 'Idioma',
  'profile.notifications': 'Notificações',
  'profile.help': 'Central de ajuda',
  'profile.legal': 'Termos e privacidade',
  'profile.signOut': 'Sair',
  'profile.member': 'Cliente desde {year}',

  // ---- Rates ----
  'rates.title': 'Taxas ao vivo',
  'rates.subtitle': 'Atualizadas a cada 60 segundos',
  'rates.perUsd': 'por 1 USD',
  'rates.feeFrom': 'Taxa a partir de {fee}',

  // ---- Help ----
  'help.title': 'Central de ajuda',
  'help.subtitle': 'Respostas em português e inglês, 24 horas por dia.',
  'help.contact': 'Falar com uma pessoa',
  'help.q1': 'Quanto tempo leva uma transferência?',
  'help.a1':
    'Transferências para carteira digital costumam chegar em segundos. Transferências bancárias levam até 1 dia útil, e a retirada em dinheiro fica disponível assim que você recebe o código de referência.',
  'help.q2': 'Quais são as taxas?',
  'help.a2':
    'Uma taxa fixa de {fee} em transferências de até US$ 1.000, e 0,9% acima disso. A taxa que você vê antes de confirmar é a taxa que vale.',
  'help.q3': 'Posso cancelar uma transferência?',
  'help.a3':
    'Você pode cancelar enquanto a transferência ainda estiver pendente. Depois que o dinheiro é retirado, não é mais possível reverter, então confira os dados na tela de revisão.',
  'help.q4': 'Para quais países posso enviar?',
  'help.a4':
    'Enviamos dos Estados Unidos para mais de 130 países, incluindo Somália, Quênia, Etiópia, Djibuti, Uganda e Reino Unido.',
  'help.q5': 'Meu dinheiro está seguro?',
  'help.a5':
    'A {brand} é uma empresa de transferência de valores licenciada, com sede em {city}, {state}. Toda transferência é criptografada de ponta a ponta e coberta pela nossa garantia de reembolso.',

  // ---- Refer ----
  'refer.title': 'Indique e ganhe',
  'refer.subtitle': 'Dê US$ 10 e ganhe US$ 10 por cada amigo que fizer a primeira transferência.',
  'refer.yourCode': 'Seu código',
  'refer.copy': 'Copiar código',
  'refer.invite': 'Convidar amigos',
  'refer.earned': 'Ganho até agora',

  // ---- Support ----
  'support.title': 'Suporte ao vivo',
  'support.subtitle': 'Pessoas de verdade, em português e inglês.',
  'support.chat': 'Iniciar chat ao vivo',
  'support.call': 'Ligar para nós',
  'support.email': 'Suporte por e-mail',

  // ---- Desktop shell ----
  'shell.screens': 'Telas',
  'shell.hint': 'Use o app como no celular — todas as telas estão funcionando.',
  'shell.openFull': 'Abrir em tela cheia',
  'network.offline': 'Sem conexão — sua transferência está segura e será retomada.',
  'shell.hq': 'Sede em {city}, {state} · Enviamos para o mundo todo',
}
