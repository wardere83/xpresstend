import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AppLock } from './native/AppLock'
import { NativeShell } from './native/NativeShell'
import { I18nProvider } from './i18n'
import { AccountDataProvider } from './state/AccountData'
import { TransferProvider } from './state/TransferContext'
import { AuthProvider } from './auth/AuthContext'
import { Login, Register } from './auth/AuthScreens'
import { AdminConsole } from './admin/AdminConsole'
import { InviteAccept } from './admin/InviteAccept'
import { Marketing } from './marketing/Marketing'
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
      <AppLock>
      <AuthProvider>
        <AccountDataProvider>
        <TransferProvider>
          <HashRouter>
            <NativeShell />
            <Routes>
              {/* Public shopfront and the way in. */}
              <Route path="/" element={<Marketing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Staff console — its own login, never the customer session. */}
              <Route path="/admin" element={<AdminConsole />} />
              <Route path="/invite/:token" element={<InviteAccept />} />

              {/* The product. */}
              <Route element={<AppLayout />}>
                <Route path="/app" element={<Home />} />
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
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </TransferProvider>
        </AccountDataProvider>
      </AuthProvider>
      </AppLock>
    </I18nProvider>
  )
}
