import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Landing Page Settings
  const [settings, setSettings] = useState({
    landingHeadline: 'Excellence in Commercial Property Management',
    landingSubtext: 'Empowering managers with state-of-the-art tools for billing, assets, and tenant relations.',
    landingImageUrl: '/building_image.png'
  })
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    api.get('/settings').then(res => {
      if (Object.keys(res.data).length > 0) {
        setSettings(s => ({ ...s, ...res.data }))
      }
    }).finally(() => setSettingsLoading(false))
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.patch('/auth/profile', { fullName, profileImageUrl, password })
      toast.success('Profile updated / ፕሮፋይል ተሻሽሏል')
      await refreshUser()
      setPassword('')
    } catch {
      toast.error('Failed to update / ማሻሻል አልተሳካም')
    } finally { setLoading(false) }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/settings', { settings })
      toast.success('Landing page updated / ገጹ ተሻሽሏል')
    } catch {
      toast.error('Failed / አልተሳካም')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-slide-up pb-20">
      {/* Profile Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-brand-500/20 shadow-2xl bg-surface-card">
              <img 
                src={profileImageUrl || '/manager_photo.png'} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">{user?.fullName || 'Manager / ስራ አስኪያጅ'}</h1>
            <p className="text-slate-400 mt-1 uppercase tracking-[0.2em] text-xs font-black">Administrator / አስተዳዳሪ</p>
            <div className="mt-3 flex items-center gap-2 text-green-400">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider">Account Active</span>
            </div>
          </div>
        </div>

        <div className="card p-8 border-brand-500/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>👤</span> Account Settings / የአካውንት ቅንብሮች
          </h2>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label">Full Name / ሙሉ ስም</label>
                <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Manager Name" />
              </div>
              <div>
                <label className="label">Profile Photo URL / የፎቶ ሊንክ</label>
                <input className="input" value={profileImageUrl} onChange={e => setProfileImageUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label">Email Address / ኢሜይል</label>
                <input className="input opacity-50 cursor-not-allowed" value={user?.email} disabled />
              </div>
              <div>
                <label className="label text-brand-400">Change Password / የይለፍ ቃል ቀይር</label>
                <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary px-8 h-12 text-sm font-bold shadow-lg shadow-brand-500/20">
                {loading ? '⏳' : 'Save Changes / አስቀምጥ'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Landing Page Settings */}
      <section className="space-y-8 pt-8 border-t border-surface-border">
        <div>
          <h2 className="text-2xl font-black text-white">Landing Page Customization / የገጽ ማሻሻያ</h2>
          <p className="text-slate-400 text-sm mt-1">Control the images and text visible on the login screen</p>
        </div>

        <div className="card p-8 border-brand-500/10 bg-brand-500/[0.02]">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <label className="label">Main Headline / ዋና ርዕስ</label>
              <input className="input h-14 text-lg" value={settings.landingHeadline} 
                onChange={e => setSettings(s => ({...s, landingHeadline: e.target.value}))} />
            </div>
            <div>
              <label className="label">Sub-text / ዝርዝር መግለጫ</label>
              <textarea className="input min-h-[100px] py-4" value={settings.landingSubtext} 
                onChange={e => setSettings(s => ({...s, landingSubtext: e.target.value}))} />
            </div>
            <div>
              <label className="label">Background Image / የጀርባ ፎቶ</label>
              <div className="flex gap-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="input flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20 text-slate-400 cursor-pointer"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSettings(s => ({...s, landingImageUrl: reader.result}));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div className="w-20 h-14 rounded-xl border border-surface-border overflow-hidden bg-surface shrink-0">
                  {settings.landingImageUrl && (
                    <img src={settings.landingImageUrl} className="w-full h-full object-cover" alt="Preview" />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">Tip: Upload a high-resolution image from your computer. / ከኮምፒውተርዎ ላይ ጥራት ያለው ፎቶ ይጫኑ</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary bg-white text-brand-900 hover:bg-slate-200 px-8 h-12 text-sm font-bold">
                {loading ? '⏳' : 'Update Landing Page / ገጹን አሻሽል'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
