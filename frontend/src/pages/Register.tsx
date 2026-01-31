import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Mail, Lock, User, UserPlus } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.passwordConfirm) {
      toast.error('Passwords do not match')
      return
    }
    
    setIsLoading(true)
    
    try {
      await register(formData)
      toast.success('Account created! Welcome to ExpenseAI')
      navigate('/')
    } catch (error: any) {
      const errorData = error.response?.data
      const errorMessage = Object.values(errorData || {})[0]
      toast.error(Array.isArray(errorMessage) ? errorMessage[0] : 'Registration failed')
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
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 md:mb-6">Create account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label text-sm md:text-base">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  className="input-cool text-base"
                />
              </div>
              <div>
                <label className="input-label text-sm md:text-base">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="input-cool text-base"
                />
              </div>
            </div>
            
            <div>
              <label className="input-label text-sm md:text-base">
                Username *
              </label>
              <div className="input-group">
                <User className="input-group-icon w-5 h-5" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="johndoe"
                  className="input-cool text-base"
                />
              </div>
            </div>
            
            <div>
              <label className="input-label text-sm md:text-base">
                Email *
              </label>
              <div className="input-group">
                <Mail className="input-group-icon w-5 h-5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input-cool text-base"
                />
              </div>
            </div>
            
            <div>
              <label className="input-label text-sm md:text-base">
                Password *
              </label>
              <div className="input-group">
                <Lock className="input-group-icon w-5 h-5" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-cool text-base"
                />
              </div>
            </div>
            
            <div>
              <label className="input-label text-sm md:text-base">
                Confirm Password *
              </label>
              <div className="input-group">
                <Lock className="input-group-icon w-5 h-5" />
                <input
                  type="password"
                  required
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
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
              <UserPlus className="w-5 h-5" />
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
