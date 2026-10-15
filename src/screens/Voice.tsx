import { Unavailable } from './Unavailable'

export function Voice() {
  return <Unavailable title="Voice commands" message="Voice recognition is not available for customer accounts. Use the transfer form to create a test record; no audio is recorded." to="/send" action="Open test transfer form" />
}
