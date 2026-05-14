import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import api from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [showMfa, setShowMfa] = useState(false)
  const [showRecover, setShowRecover] = useState(false)
  const [recoverForm, setRecoverForm] = useState({ email: '', newPassword: '' })
  const [tempToken, setTempToken] = useState('')
  const [loading, setLoading] = useState(false)
  const { setLoginData } = useAuth()
  const navigate = useNavigate()

  const [settings, setSettings] = useState({
    landingHeadline: 'Excellence in Commercial Property Management',
    landingSubtext: 'Empowering managers with state-of-the-art tools for billing, assets, and tenant relations.',
    landingImageUrl: '/building_image.png'
  })

  useEffect(() => {
    api.get('/settings').then(res => {
      if (Object.keys(res.data).length > 0) {
        setSettings(s => ({ ...s, ...res.data }))
      }
    }).catch(() => {})
  }, [])

  const loginProcess = async (e, credentials) => {
    if (e) e.preventDefault()
    setLoading(true)
    const loginEmail = credentials?.email || email
    const loginPass = credentials?.password || password

    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPass })
      if (res.data.requiresMfa) {
        setShowMfa(true)
        setTempToken(res.data.preToken)
        toast.success('MFA Required / ማረጋገጫ ያስፈልጋል')
      } else {
        setLoginData(res.data.user, res.data.token)
        toast.success('Welcome back! / በደህና መጡ!')
        const role = res.data.user.role
        navigate(role === 'TENANT' ? '/tenant' : role === 'MANAGER' ? '/manager' : '/board')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed / መግባት አልተሳካም')
    } finally { setLoading(false) }
  }

  const handleRecover = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/recover', recoverForm)
      toast.success(res.data.message)
      setShowRecover(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Recovery failed / ማግኘት አልተሳካም')
    } finally { setLoading(false) }
  }

  const quickLogin = (type) => {
    const creds = type === 'MANAGER' 
      ? { email: 'manager@plc.com', password: 'Manager@123' }
      : { email: 'board@plc.com', password: 'Board@123' }
    
    setEmail(creds.email)
    setPassword(creds.password)
    loginProcess(null, creds)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      <div className="flex items-center justify-center p-8 bg-surface-card/30 backdrop-blur-3xl">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-lg shadow-brand-500/20">
              <span className="text-3xl text-white">🏢</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic tracking-tighter">Building Portal / መግቢያ</h1>
            <p className="text-slate-400 mt-2 font-medium tracking-wide">Secure Access System / ደህንነቱ የተጠበቀ መግቢያ</p>
          </div>

          <div className="card p-8 border-brand-500/20 bg-surface-card/80">
            {showRecover ? (
              <form onSubmit={handleRecover} className="space-y-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-white mb-1">Account Recovery / አካውንት ማግኛ</h2>
                  <p className="text-sm text-slate-400 italic">Only active accounts can recover / ንቁ አካውንቶች ብቻ ማግኘት ይችላሉ</p>
                </div>
                <div>
                  <label className="label">Registered Email / ኢሜይል</label>
                  <input type="email" required className="input h-12" placeholder="name@company.com"
                    value={recoverForm.email} onChange={e => setRecoverForm(f => ({...f, email: e.target.value}))} />
                </div>
                <div>
                  <label className="label">New Password / አዲስ የይለፍ ቃል</label>
                  <input type="password" required className="input h-12" placeholder="••••••••"
                    value={recoverForm.newPassword} onChange={e => setRecoverForm(f => ({...f, newPassword: e.target.value}))} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center h-14 text-lg font-bold">
                  {loading ? '⏳' : 'Reset Password / የይለፍ ቃል ቀይር'}
                </button>
                <button type="button" onClick={() => setShowRecover(false)} className="text-sm text-slate-400 hover:text-white w-full text-center">
                  ← Back to Login / ወደ መግቢያ ይመለሱ
                </button>
              </form>
            ) : !showMfa ? (
              <form onSubmit={(e) => loginProcess(e)} className="space-y-6">
                <div>
                  <label className="label">Email Address / ኢሜይል</label>
                  <input type="email" required className="input h-12" placeholder="name@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label mb-0">Password / የይለፍ ቃል</label>
                    <button type="button" onClick={() => setShowRecover(true)} className="text-[10px] text-brand-400 hover:underline uppercase font-bold tracking-wider">
                      Forgot? / ጠፋብኝ?
                    </button>
                  </div>
                  <input type="password" required className="input h-12" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center h-14 text-lg font-bold shadow-xl shadow-brand-500/20">
                  {loading ? '⏳' : 'Sign In / ግባ'}
                </button>

                <div className="pt-6 border-t border-surface-border">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4 font-black text-center">Quick Access / ፈጣን መግቢያ</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => quickLogin('MANAGER')} disabled={loading}
                      className="text-xs p-4 bg-surface/50 hover:bg-brand-500/10 text-slate-300 rounded-2xl border border-surface-border transition-all text-center group">
                      <p className="font-black text-brand-400 uppercase tracking-tight mb-1">Manager</p>
                      <span className="text-[9px] text-slate-500 font-bold">ስራ አስኪያጅ</span>
                    </button>
                    <button type="button" onClick={() => quickLogin('BOARD')} disabled={loading}
                      className="text-xs p-4 bg-surface/50 hover:bg-indigo-500/10 text-slate-300 rounded-2xl border border-surface-border transition-all text-center group">
                      <p className="font-black text-indigo-400 uppercase tracking-tight mb-1">Board</p>
                      <span className="text-[9px] text-slate-500 font-bold">የቦርድ አባል</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => loginProcess(e)} className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-lg font-bold text-white mb-1">MFA Security Check / ደህንነት ማረጋገጫ</p>
                  <p className="text-sm text-slate-400">Enter 6-digit code / ባለ 6 አሃዝ ኮድ ያስገቡ</p>
                </div>
                <input type="text" required maxLength={6} className="input text-center text-4xl tracking-[0.5em] font-mono h-20 bg-surface/50 border-brand-500/50"
                  placeholder="000000" value={mfaCode} onChange={e => setMfaCode(e.target.value)} />
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center h-14 text-lg font-bold">
                  {loading ? '⏳' : 'Verify Code / ኮድ አረጋግጥ'}
                </button>
                <button type="button" onClick={() => setShowMfa(false)} className="text-sm text-slate-400 hover:text-white w-full text-center py-2">
                  ← Back to Login / ወደ መግቢያ ይመለሱ
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden">
        <img src={settings.landingImageUrl} alt="Building" className="absolute inset-0 w-full h-full object-cover duration-700" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-surface/10 to-surface"></div>
        <div className="absolute bottom-12 left-12 right-12">
          <div className="p-8 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl">
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight uppercase italic">{settings.landingHeadline}</h2>
            <p className="text-slate-300 text-lg font-medium leading-relaxed max-w-lg">{settings.landingSubtext}</p>
            <div className="mt-8 flex gap-4">
              <div className="h-1.5 w-12 bg-brand-500 rounded-full"></div>
              <div className="h-1.5 w-1.5 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
