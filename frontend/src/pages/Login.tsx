import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Mail, Lock, LogIn } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="auth-container">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">
            💰 ExpenseAI
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">AI-Powered Expense Tracking</p>
        </div>
        
        {/* Form */}
        <div className="auth-card">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 md:mb-6">Welcome back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label text-sm md:text-base">
                Email
              </label>
              <div className="input-group">
                <Mail className="input-group-icon w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-cool text-base"
                />
              </div>
            </div>
            
            <div>
              <label className="input-label text-sm md:text-base">
                Password
              </label>
              <div className="input-group">
                <Lock className="input-group-icon w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-cool text-base"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 md:py-4 text-base md:text-lg"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
