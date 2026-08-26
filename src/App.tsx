import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { NativeShell } from './native/NativeShell'
import { I18nProvider } from './i18n'
import { TransferProvider } from './state/TransferContext'
import { Home } from './screens/Home'
import { Voice } from './screens/Voice'
import { Assistant } from './screens/Assistant'
import { SendMoney } from './screens/SendMoney'
import { Review } from './screens/Review'
import { Success } from './screens/Success'
import { Recipients } from './screens/Recipients'
import { Activity } from './screens/Activity'
import { Profile } from './screens/Profile'
import { Help, Rates, Refer, Support } from './screens/Info'

export default function App() {
  return (
    <I18nProvider>
      <TransferProvider>
        <HashRouter>
          <NativeShell />
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="voice" element={<Voice />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="send" element={<SendMoney />} />
              <Route path="review" element={<Review />} />
              <Route path="success" element={<Success />} />
              <Route path="recipients" element={<Recipients />} />
              <Route path="activity" element={<Activity />} />
              <Route path="profile" element={<Profile />} />
              <Route path="rates" element={<Rates />} />
              <Route path="help" element={<Help />} />
              <Route path="refer" element={<Refer />} />
              <Route path="support" element={<Support />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </TransferProvider>
    </I18nProvider>
  )
}
