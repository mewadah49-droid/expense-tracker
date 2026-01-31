import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { motion, useSpring, useTransform, useMotionValue, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Crown,
  AlertTriangle,
  X,
  Save,
  Settings,
  RefreshCw,
} from 'lucide-react'

// Types
interface TiltCardProps {
  children: React.ReactNode
  className?: string
  color?: 'slate' | 'emerald' | 'rose' | 'amber' | 'blue'
  index?: number
}

interface DashboardStats {
  total_spent: number
  total_income: number
  monthly_budget: number
  income_change_percentage?: number
}

interface BudgetModalProps {
  currentBudget: number
  onClose: () => void
  onSave: () => void
}

// 3D Tilt Card Component
function TiltCard({ children, className = '', color = 'slate', index = 0 }: TiltCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)

  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg'])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const xPct = mouseX / rect.width - 0.5
    const yPct = mouseY / rect.height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const colorSchemes = {
    slate: 'from-slate-400 via-gray-400 to-zinc-400 shadow-slate-500/20',
    emerald: 'from-emerald-400 via-teal-500 to-cyan-500 shadow-emerald-500/25',
    rose: 'from-rose-400 via-red-500 to-orange-400 shadow-rose-500/25',
    amber: 'from-amber-400 via-orange-500 to-yellow-400 shadow-amber-500/25',
    blue: 'from-blue-400 via-sky-500 to-cyan-400 shadow-blue-500/25',
  }

  const borderGradient = colorSchemes[color]

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative group ${className}`}
    >
      <div
        className="relative h-full bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-slate-200/60 overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className={`absolute -inset-0.5 bg-gradient-to-r ${borderGradient} rounded-3xl opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500`}
        />

        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/60 via-transparent to-slate-100/30" />

        <div className="relative h-full p-6" style={{ transform: 'translateZ(40px)' }}>
          {children}
        </div>

        <motion.div
          className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-white to-slate-100 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity"
          animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
    </motion.div>
  )
}

// Animated counter
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (current) =>
    `${prefix}${Math.floor(Math.abs(current)).toLocaleString()}${suffix}`
  )

  useEffect(() => {
    spring.set(Math.abs(value))
  }, [value, spring])

  return <motion.span className="tabular-nums">{display}</motion.span>
}

// Loading skeleton
const PremiumSkeleton = () => (
  <div className="space-y-8 px-4 sm:px-6 lg:px-8">
    <div className="h-12 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl w-1/3 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl animate-pulse" />
      ))}
    </div>
  </div>
)

// Error component
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="p-4 bg-rose-100 rounded-full mb-4">
      <AlertTriangle className="w-8 h-8 text-rose-600" />
    </div>
    <h3 className="text-xl font-semibold text-slate-800 mb-2">Failed to load dashboard</h3>
    <p className="text-slate-500 mb-4 text-center">Something went wrong while fetching your data.</p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onRetry}
      className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-medium"
    >
      <RefreshCw className="w-4 h-4" />
      Try Again
    </motion.button>
  </div>
)

// Check if touch device (SSR-safe)
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  return isTouch
}

// Optimized Budget Modal - 60fps Mobile Performance
function BudgetModal({ currentBudget, onClose, onSave }: BudgetModalProps) {
  const [budget, setBudget] = useState(currentBudget > 0 ? currentBudget.toString() : '')
  const [mounted, setMounted] = useState(false)
  const queryClient = useQueryClient()
  const isTouchDevice = useIsTouchDevice()

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 },
    },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
  }

  const updateUser = useAuthStore((state) => state.updateUser)

  const updateBudget = useMutation({
    mutationFn: async (amount: number) => {
      const response = await api.patch('/api/users/profile/', {
        monthly_budget: amount,
      })
      return response.data
    },
    onSuccess: (data) => {
      // Safely call updateUser if it exists
      if (typeof updateUser === 'function') {
        updateUser({ monthlyBudget: data.monthly_budget })
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Budget updated!')
      onSave()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update budget')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(budget)
    if (!isNaN(amount) && amount > 0) {
      updateBudget.mutate(amount)
    } else {
      toast.error('Enter a valid amount')
    }
  }

  // Don't render portal on SSR
  if (!mounted) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm"
      onClick={onClose}
      style={{ willChange: 'opacity' }}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`relative w-full max-w-md ${!isTouchDevice ? 'hover:scale-[1.01]' : ''} transition-transform`}
        onClick={(e) => e.stopPropagation()}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-200 rounded-xl">
                  <Target className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {currentBudget > 0 ? 'Edit Budget' : 'Set Budget'}
                  </h2>
                  <p className="text-slate-500 text-sm">Monthly spending limit</p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-600" />
              </motion.button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Input */}
            <div className="space-y-2">
              <label htmlFor="budget-input" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-500" />
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">₹</span>
                <input
                  id="budget-input"
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xl font-bold text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
                  style={{ transform: 'translateZ(0)' }}
                  autoFocus
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <motion.button
                type="button"
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </motion.button>

              <motion.button
                type="submit"
                disabled={updateBudget.isPending}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {updateBudget.isPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ willChange: 'transform' }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default function Dashboard() {
  const [showBudgetModal, setShowBudgetModal] = useState(false)

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/dashboard/')
      return response.data
    },
  })

  const monthlyBudget = stats?.monthly_budget ?? 0
  const totalSpent = stats?.total_spent ?? 0
  const totalIncome = stats?.total_income ?? 0
  const incomeChangePercentage = stats?.income_change_percentage

  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - totalSpent : totalIncome - totalSpent

  const hasBudget = monthlyBudget > 0
  const budgetPercentage = hasBudget ? Math.min(Math.max((totalSpent / monthlyBudget) * 100, 0), 100) : 0

  const isOverspent = remainingBudget < 0
  const overspentAmount = Math.abs(remainingBudget)

  const getBudgetStatus = () => {
    if (!hasBudget) return { label: 'No Budget', color: 'slate' as const, icon: '📋' }
    if (isOverspent) return { label: 'Overspent', color: 'rose' as const, icon: '🚨' }
    if (budgetPercentage > 90) return { label: 'Critical', color: 'rose' as const, icon: '⚠️' }
    if (budgetPercentage > 75) return { label: 'Warning', color: 'amber' as const, icon: '⚡' }
    if (budgetPercentage > 50) return { label: 'On Track', color: 'blue' as const, icon: '📊' }
    return { label: 'Great', color: 'emerald' as const, icon: '✓' }
  }

  const budgetStatus = getBudgetStatus()

  if (isLoading) return <PremiumSkeleton />

  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      style={{ perspective: '1000px' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <motion.div
            className="flex items-center gap-3 mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-lg shadow-slate-500/25">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Dashboard</h1>
          </motion.div>
          <p className="text-slate-500 text-base md:text-lg">Your financial overview</p>
        </div>

        {/* Edit Budget Button */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowBudgetModal(true)}
          className="group relative px-6 py-3 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <span className="relative flex items-center gap-2.5 font-semibold text-slate-700">
            <div className="p-1.5 bg-slate-100 group-hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
              <Settings className="w-4 h-4 text-slate-600 group-hover:rotate-90 transition-transform duration-500" />
            </div>
            {hasBudget ? 'Edit Budget' : 'Set Budget'}
          </span>
        </motion.button>
      </motion.div>

      {/* No Budget Warning */}
      {!hasBudget && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 font-medium">No monthly budget set</p>
            <p className="text-amber-600 text-sm">Set a budget to track your spending progress</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBudgetModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            Set Budget
          </motion.button>
        </motion.div>
      )}

      {/* 3D Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ transformStyle: 'preserve-3d' }}>
        {/* Total Spent */}
        <TiltCard color="rose" index={0}>
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <TrendingDown className="w-7 h-7 text-white" />
            </motion.div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" />
              This month
            </span>
          </div>
          <motion.p
            className="text-2xl md:text-4xl font-bold text-slate-800 mb-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <AnimatedNumber value={totalSpent} prefix="₹" />
          </motion.p>
          <p className="text-xs md:text-sm font-medium text-slate-500">Total Spent</p>
        </TiltCard>

        {/* Total Income */}
        <TiltCard color="emerald" index={1}>
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <TrendingUp className="w-7 h-7 text-white" />
            </motion.div>
            {incomeChangePercentage !== undefined && (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${
                  incomeChangePercentage >= 0
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    : 'text-rose-600 bg-rose-50 border-rose-200'
                }`}
              >
                {incomeChangePercentage >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {incomeChangePercentage >= 0 ? '+' : ''}
                {incomeChangePercentage.toFixed(1)}%
              </span>
            )}
          </div>
          <motion.p
            className="text-2xl md:text-4xl font-bold text-slate-800 mb-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            <AnimatedNumber value={totalIncome} prefix="₹" />
          </motion.p>
          <p className="text-xs md:text-sm font-medium text-slate-500">Total Income</p>
        </TiltCard>

        {/* Remaining Budget */}
        <TiltCard color={isOverspent ? 'rose' : 'slate'} index={2}>
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                isOverspent
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30'
                  : 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-500/30'
              }`}
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Wallet className="w-7 h-7 text-white" />
            </motion.div>
            {isOverspent ? (
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </motion.div>
            ) : (
              <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Zap className="w-5 h-5 text-amber-400" />
              </motion.div>
            )}
          </div>

          <motion.p
            className={`text-2xl md:text-4xl font-bold mb-1 ${isOverspent ? 'text-rose-600' : 'text-slate-800'}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            {isOverspent && <span className="text-xl md:text-2xl">-</span>}
            <AnimatedNumber value={Math.abs(remainingBudget)} prefix="₹" />
          </motion.p>

          <p className="text-xs md:text-sm font-medium text-slate-500">
            {isOverspent ? 'Overspent' : hasBudget ? 'Remaining Budget' : 'Net Balance'}
          </p>

          {isOverspent && (
            <p className="text-xs text-rose-500 mt-1">Over budget by {formatCurrency(overspentAmount)}</p>
          )}
        </TiltCard>

        {/* Budget Progress */}
        <TiltCard color="amber" index={3}>
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Target className="w-7 h-7 text-white" />
            </motion.div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${
                budgetStatus.color === 'rose'
                  ? 'text-rose-600 bg-rose-50 border-rose-200'
                  : budgetStatus.color === 'amber'
                    ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : budgetStatus.color === 'emerald'
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                      : budgetStatus.color === 'blue'
                        ? 'text-blue-600 bg-blue-50 border-blue-200'
                        : 'text-slate-600 bg-slate-50 border-slate-200'
              }`}
            >
              {budgetStatus.icon} {budgetStatus.label}
            </span>
          </div>

          <div className="flex items-end gap-2 mb-2">
            <motion.p
              className="text-2xl md:text-4xl font-bold text-slate-800"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
            >
              {hasBudget ? (isOverspent ? '>100' : budgetPercentage.toFixed(0)) : '--'}%
            </motion.p>
            <span className="text-sm text-slate-400 mb-2">{hasBudget ? 'used' : 'N/A'}</span>
          </div>

          {hasBudget ? (
            <>
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    isOverspent || budgetPercentage > 90
                      ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                      : budgetPercentage > 75
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : budgetPercentage > 50
                          ? 'bg-gradient-to-r from-blue-400 to-sky-500'
                          : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {formatCurrency(totalSpent)} of {formatCurrency(monthlyBudget)}
              </p>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-slate-400">Set a monthly budget to track progress</p>
            </div>
          )}
        </TiltCard>
      </div>

      {/* Budget Modal */}
      <AnimatePresence>
        {showBudgetModal && (
          <BudgetModal
            currentBudget={monthlyBudget}
            onClose={() => setShowBudgetModal(false)}
            onSave={() => setShowBudgetModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}