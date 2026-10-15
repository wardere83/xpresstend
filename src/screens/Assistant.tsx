import { useInterfaceCopy } from '../i18n/interfaceCopy'
import { Unavailable } from './Unavailable'
export function Assistant() {
  const p = useInterfaceCopy()
  return (
    <Unavailable
      title={p('Account help')}
      message={p(
        'The conversational assistant is unavailable for customer accounts. Contact support for account help.',
      )}
      to="/support"
      action={p('Contact support')}
    />
  )
}
