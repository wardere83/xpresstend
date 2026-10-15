import { Unavailable } from './Unavailable'

export function Assistant() {
  return <Unavailable title="Account help" message="The conversational assistant is unavailable for customer accounts. Contact support for account help." to="/support" action="Contact support" />
}
