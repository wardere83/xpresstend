import { useInterfaceCopy } from '../i18n/interfaceCopy'
import { Unavailable } from './Unavailable'
export function Voice() {
  const p = useInterfaceCopy()
  return (
    <Unavailable
      title={p('Voice commands')}
      message={p(
        'Voice recognition is not available for customer accounts. Use the transfer form to create a test record; no audio is recorded.',
      )}
      to="/send"
      action={p('Open test transfer form')}
    />
  )
}
