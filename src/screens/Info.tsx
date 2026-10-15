import { useNavigate } from 'react-router-dom'
import { Headphones, Mail, Phone } from 'lucide-react'
import { PrimaryButton, ScreenHeader } from '../components/ui'
import { brand } from '../config/brand'
import { useI18n } from '../i18n'
import { Unavailable } from './Unavailable'

export function Rates() {
  return <Unavailable title="Transfer pricing" message="Live customer exchange and delivery services are unavailable. Test transfers request a current server quote for supported destinations." to="/send" action="Open test quote form" />
}

export function Help() {
  const navigate = useNavigate()
  return <div className="flex flex-1 flex-col overflow-hidden">
    <ScreenHeader title="Account help" onBack={() => navigate(-1)} />
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      <section className="card space-y-4 p-4 text-[13px] leading-relaxed text-ink-700">
        <div><h2 className="font-bold">Can I send real money?</h2><p>Customer money movement is unavailable. Test transfers do not charge a bank or card and do not deliver funds.</p></div>
        <div><h2 className="font-bold">Where are my recipients and transfer records?</h2><p>Your account shows only your saved recipients and API transfer records. If loading fails, retry instead of relying on sample data.</p></div>
        <div><h2 className="font-bold">How do I recover or delete my account?</h2><p>Use Password recovery or Delete account in Profile. Required financial records may be retained under the privacy policy.</p></div>
      </section>
      <div className="mt-5"><PrimaryButton onClick={() => navigate('/support')}>Contact support</PrimaryButton></div>
    </div>
  </div>
}

export function Refer() {
  return <Unavailable title="Referrals" message="The referral rewards program is not available. No referral earnings or redeemable referral code have been issued." />
}

export function Support() {
  const { t } = useI18n()
  const navigate = useNavigate()
  return <div className="flex flex-1 flex-col overflow-hidden">
    <ScreenHeader title={t('support.title')} onBack={() => navigate(-1)} />
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
      <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3.5">
        <Headphones size={18} className="text-brand-600" />
        <p className="text-[12.5px] font-semibold text-brand-700">Use the email or phone contact below for account support.</p>
      </div>
      <div className="card mt-4 divide-y divide-ink-200/60 overflow-hidden">
        <a href={`tel:${brand.support.phone.replace(/[^\d+]/g, '')}`} className="flex w-full items-center gap-3 px-4 py-4 text-start transition hover:bg-brand-50/70">
          <Phone size={19} className="text-brand-600" />
          <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-ink-900">{t('support.call')}</span><span className="block text-[12px] text-ink-500"><bdi>{brand.support.phone}</bdi></span></span>
        </a>
        <a href={`mailto:${brand.support.email}`} className="flex w-full items-center gap-3 px-4 py-4 text-start transition hover:bg-brand-50/70">
          <Mail size={19} className="text-brand-600" />
          <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-ink-900">{t('support.email')}</span><span className="block text-[12px] text-ink-500"><bdi>{brand.support.email}</bdi></span></span>
        </a>
      </div>
      <p className="mt-6 text-center text-[11.5px] leading-relaxed text-ink-500">
        <bdi>{brand.name}</bdi><br />{brand.hq.city}, {brand.hq.state}, {brand.hq.country}<br />{brand.legal.licence}
      </p>
    </div>
  </div>
}
