import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  CreditCard, 
  Bell, 
  Save, 
  Mail, 
  Wallet,
  Sparkles,
  Shield,
  Palette,
  Check,
  Loader2,
  TrendingUp,
  Moon,
  Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Settings() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    monthlyBudget: user?.monthlyBudget || 0,
    currency: user?.currency || 'INR',
  })

  // Fetch preferences
  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const response = await api.get('/api/users/preferences/')
      return response.data
    },
  })

  const [prefs, setPrefs] = useState({
    ai_categorization_enabled: true,
    auto_budget_alerts: true,
    email_notifications: true,
    weekly_report: true,
    dark_mode: false,
  })

  // Update prefs when data loads
  useEffect(() => {
    if (preferences) {
      setPrefs(preferences)
    }
  }, [preferences])

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/api/users/profile/', {
        first_name: data.firstName,
        last_name: data.lastName,
        monthly_budget: data.monthlyBudget,
        currency: data.currency,
      })
      return response.data
    },
    onSuccess: (data) => {
      updateUser({
        firstName: data.first_name,
        lastName: data.last_name,
        monthlyBudget: data.monthly_budget,
        currency: data.currency,
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Profile updated successfully!')
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/api/users/preferences/', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Preferences saved!')
    },
  })

  const currencies = [
    { value: 'INR', label: 'INR (₹)', flag: '🇮🇳' },
    { value: 'USD', label: 'USD ($)', flag: '🇺🇸' },
    { value: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
    { value: 'GBP', label: 'GBP (£)', flag: '🇬🇧' },
  ]

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-slate-500 text-base md:text-lg">Manage your account and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'budget', label: 'Budget', icon: Wallet },
            { id: 'preferences', label: 'Preferences', icon: Sparkles },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white border border-slate-200 rounded-3xl p-4 md:p-8 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg shadow-indigo-500/25">
                {profile.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Profile Information</h2>
                <p className="text-slate-500 text-sm md:text-base">Update your personal details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="Doe"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400">Email cannot be changed</p>
              </div>
            </div>

            <motion.button
              onClick={() => updateProfile.mutate(profile)}
              disabled={updateProfile.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {updateProfile.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
            </motion.button>
          </motion.div>
        )}

        {activeTab === 'budget' && (
          <motion.div
            key="budget"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white border border-slate-200 rounded-3xl p-4 md:p-8 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Budget Settings</h2>
                <p className="text-slate-500 text-sm md:text-base">Set your monthly spending limits</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Monthly Budget
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
                    {profile.currency === 'INR' ? '₹' : 
                     profile.currency === 'USD' ? '$' : 
                     profile.currency === 'EUR' ? '€' : '£'}
                  </span>
                  <input
                    type="number"
                    value={profile.monthlyBudget}
                    onChange={(e) => setProfile({ ...profile, monthlyBudget: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-bold text-xl"
                    placeholder="50000"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Set a realistic monthly budget to track your expenses effectively
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  Currency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {currencies.map((curr) => (
                    <motion.button
                      key={curr.value}
                      onClick={() => setProfile({ ...profile, currency: curr.value })}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                        profile.currency === curr.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-indigo-200 text-slate-600'
                      )}
                    >
                      <span className="text-2xl">{curr.flag}</span>
                      <span className="font-semibold">{curr.label}</span>
                      {profile.currency === curr.value && (
                        <Check className="w-5 h-5 ml-auto text-indigo-500" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <motion.button
              onClick={() => updateProfile.mutate(profile)}
              disabled={updateProfile.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {updateProfile.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Budget Settings
            </motion.button>
          </motion.div>
        )}

        {activeTab === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* AI Features */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-pink-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">AI Features</h2>
                  <p className="text-slate-500">Smart automation settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <ToggleSetting
                  icon={Sparkles}
                  label="AI Auto-Categorization"
                  description="Let AI automatically categorize your transactions based on description"
                  checked={prefs.ai_categorization_enabled}
                  onChange={(checked) => {
                    setPrefs({ ...prefs, ai_categorization_enabled: checked })
                    updatePreferences.mutate({ ai_categorization_enabled: checked })
                  }}
                  color="amber"
                />

                <ToggleSetting
                  icon={TrendingUp}
                  label="Smart Forecasting"
                  description="Use AI to predict future spending patterns"
                  checked={true}
                  disabled
                  color="indigo"
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
                  <p className="text-slate-500">Manage your alerts and reports</p>
                </div>
              </div>

              <div className="space-y-4">
                <ToggleSetting
                  icon={Wallet}
                  label="Budget Alerts"
                  description="Get notified when you're close to your budget limit (80%, 90%, 100%)"
                  checked={prefs.auto_budget_alerts}
                  onChange={(checked) => {
                    setPrefs({ ...prefs, auto_budget_alerts: checked })
                    updatePreferences.mutate({ auto_budget_alerts: checked })
                  }}
                  color="rose"
                />

                <ToggleSetting
                  icon={Mail}
                  label="Email Notifications"
                  description="Receive email updates about your spending and account activity"
                  checked={prefs.email_notifications}
                  onChange={(checked) => {
                    setPrefs({ ...prefs, email_notifications: checked })
                    updatePreferences.mutate({ email_notifications: checked })
                  }}
                  color="blue"
                />

                <ToggleSetting
                  icon={Check}
                  label="Weekly Report"
                  description="Get a weekly summary of your expenses every Monday"
                  checked={prefs.weekly_report}
                  onChange={(checked) => {
                    setPrefs({ ...prefs, weekly_report: checked })
                    updatePreferences.mutate({ weekly_report: checked })
                  }}
                  color="emerald"
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Appearance</h2>
                  <p className="text-slate-500">Customize your experience</p>
                </div>
              </div>

              <div className="space-y-4">
                <ToggleSetting
                  icon={prefs.dark_mode ? Moon : Sun}
                  label="Dark Mode"
                  description="Switch between light and dark themes"
                  checked={prefs.dark_mode}
                  onChange={(checked) => {
                    setPrefs({ ...prefs, dark_mode: checked })
                    // Theme switching logic would go here
                  }}
                  color="slate"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Premium Toggle Component
function ToggleSetting({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  color = 'indigo'
}: {
  icon: any
  label: string
  description: string
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  color?: 'indigo' | 'amber' | 'rose' | 'blue' | 'emerald' | 'slate'
}) {
  const colorSchemes = {
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    slate: 'bg-slate-600',
  }

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className={cn(
        'flex items-center justify-between p-5 rounded-2xl border-2 transition-all',
        checked 
          ? 'bg-slate-50 border-slate-200' 
          : 'bg-white border-slate-100',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          checked ? `${colorSchemes[color]} bg-opacity-10` : 'bg-slate-100'
        )}>
          <Icon className={cn(
            'w-5 h-5',
            checked ? colorSchemes[color].replace('bg-', 'text-') : 'text-slate-400'
          )} />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{label}</p>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      
      <button
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        className={cn(
          'w-14 h-8 rounded-full transition-all duration-300 flex items-center p-1',
          checked ? colorSchemes[color] : 'bg-slate-200'
        )}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            'w-6 h-6 rounded-full bg-white shadow-md',
            checked ? 'translate-x-6' : 'translate-x-0'
          )}
        />
      </button>
    </motion.div>
  )
}