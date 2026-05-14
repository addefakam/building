import { useNavigate } from 'react-router-dom'

export default function Unauthorized() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center animate-slide-up">
        <p className="text-6xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6">You don't have permission to view this page.</p>
        <button onClick={() => navigate('/login')} className="btn-primary mx-auto">← Back to Login</button>
      </div>
    </div>
  )
}
