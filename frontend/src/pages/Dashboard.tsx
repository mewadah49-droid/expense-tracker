import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/60 via-transparent to-slate-100/30"
        />

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
  <div className="space-y-8">
    <div className="h-12 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl w-1/3 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl animate-pulse" />
      ))}
    </div>
  </div>
)

// Clean White Glassmorphism 3D Budget Modal
function BudgetModal({ currentBudget, onClose, onSave }: BudgetModalProps) {
  const [budget, setBudget] = useState(currentBudget > 0 ? currentBudget.toString() : '')
  const queryClient = useQueryClient()
  const modalRef = useRef<HTMLDivElement>(null)

  // 3D tilt for modal
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-0.5, 0.5], ['3deg', '-3deg'])
  const rotateY = useTransform(x, [-0.5, 0.5], ['-3deg', '3deg'])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!modalRef.current) return
    const rect = modalRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((event.clientX - centerX) / (rect.width / 2))
    y.set((event.clientY - centerY) / (rect.height / 2))
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const updateBudget = useMutation({
    mutationFn: async (amount: number) => {
      localStorage.setItem('monthly_budget', amount.toString())
      return { monthly_budget: amount }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Budget updated successfully!')
      onSave()
    },
    onError: () => {
      toast.error('Failed to update budget')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(budget)
    if (!isNaN(amount) && amount > 0) {
      updateBudget.mutate(amount)
    } else {
      toast.error('Please enter a valid budget amount')
    }
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-200/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Soft ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-slate-100/50 via-white/30 to-gray-100/50 rounded-full blur-3xl" />
      </div>

      <motion.div
        ref={modalRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* White Glass Card */}
        <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl shadow-slate-300/50 overflow-hidden">
          {/* Subtle top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-300 via-gray-300 to-slate-300" />

          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-slate-50/30 pointer-events-none" />

          {/* Clean Header */}
          <div className="relative p-8 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <motion.h2
                  className="text-2xl font-bold text-slate-800 flex items-center gap-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
                    <Target className="w-6 h-6 text-slate-700" />
                  </div>
                  {currentBudget > 0 ? 'Edit Budget' : 'Set Budget'}
                </motion.h2>
                <motion.p
                  className="text-slate-500 mt-2 text-sm font-medium"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Manage your monthly spending limit
                </motion.p>
              </div>

              <motion.button
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors shadow-sm"
              >
                <X className="w-5 h-5 text-slate-600" />
              </motion.button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative p-8 space-y-6">
            {/* Clean Input */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 ml-1">
                <Wallet className="w-4 h-4 text-slate-500" />
                Monthly Budget Amount
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-300 to-gray-300 rounded-2xl opacity-30 group-hover:opacity-60 blur transition duration-500 group-focus-within:opacity-80" />
                <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group-focus-within:border-slate-400 transition-colors">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-5 bg-transparent text-2xl font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Clean Tips Card */}
            <motion.div
              className="relative bg-slate-50/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-5"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 mb-2 text-sm">Budgeting Tips</p>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      Follow the 50/30/20 rule for needs/wants/savings
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      Review and adjust based on past 3 months spending
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      Keep 10% buffer for unexpected expenses
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all shadow-sm"
              >
                Cancel
              </motion.button>

              <motion.button
                type="submit"
                disabled={updateBudget.isPending}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 relative py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-500/25 disabled:opacity-50 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {updateBudget.isPending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Budget
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </form>
        </div>

        {/* Soft shadow layers for 3D effect */}
        <div className="absolute -inset-4 bg-slate-300/20 rounded-[2rem] blur-2xl -z-10" />
        <div className="absolute -inset-8 bg-slate-200/20 rounded-[3rem] blur-3xl -z-20" />
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default function Dashboard() {
  const [showBudgetModal, setShowBudgetModal] = useState(false)

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/dashboard/')
      const savedBudget = localStorage.getItem('monthly_budget')
      return {
        ...response.data,
        monthly_budget: savedBudget ? parseFloat(savedBudget) : 0,
      }
    },
  })

  const monthlyBudget = stats?.monthly_budget || 0
  const totalSpent = stats?.total_spent || 0
  const totalIncome = stats?.total_income || 0

  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - totalSpent : totalIncome - totalSpent

  const hasBudget = monthlyBudget > 0
  const budgetPercentage = hasBudget ? Math.min(Math.max((totalSpent / monthlyBudget) * 100, 0), 100) : 0

  const isOverspent = remainingBudget < 0
  const overspentAmount = Math.abs(remainingBudget)

  const getBudgetStatus = () => {
    if (!hasBudget) return { label: 'No Budget', color: 'slate', icon: '📋' }
    if (isOverspent) return { label: 'Overspent', color: 'rose', icon: '🚨' }
    if (budgetPercentage > 90) return { label: 'Critical', color: 'rose', icon: '⚠️' }
    if (budgetPercentage > 75) return { label: 'Warning', color: 'amber', icon: '⚡' }
    if (budgetPercentage > 50) return { label: 'On Track', color: 'blue', icon: '📊' }
    return { label: 'Great', color: 'emerald', icon: '✓' }
  }

  const budgetStatus = getBudgetStatus()

  if (isLoading) return <PremiumSkeleton />

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
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
              Dashboard
            </h1>
          </motion.div>
          <p className="text-slate-500 text-base md:text-lg">Your financial overview</p>
        </div>

        {/* Clean White Glassmorphism Edit Budget Button */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowBudgetModal(true)}
          className="group relative px-6 py-3 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300"
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          <span className="relative flex items-center gap-2.5 font-semibold text-slate-700">
            <div className="p-1.5 bg-slate-100 group-hover:bg-slate-200 rounded-lg transition-colors border border-slate-200">
              <Settings className="w-4 h-4 text-slate-600 group-hover:rotate-90 transition-transform duration-500" />
            </div>
            {hasBudget ? 'Edit Budget' : 'Set Budget'}
          </span>
        </motion.button>
      </motion.div>

      {/* No Budget Warning - Clean Style */}


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
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              +12.5%
            </span>
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
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isOverspent ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30' : 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-500/30'}`}
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
            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${budgetStatus.color === 'rose' ? 'text-rose-600 bg-rose-50 border-rose-200' : budgetStatus.color === 'amber' ? 'text-amber-600 bg-amber-50 border-amber-200' : budgetStatus.color === 'emerald' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : budgetStatus.color === 'blue' ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
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
                  className={`absolute inset-y-0 left-0 rounded-full ${isOverspent || budgetPercentage > 90 ? 'bg-gradient-to-r from-rose-400 to-rose-600' : budgetPercentage > 75 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : budgetPercentage > 50 ? 'bg-gradient-to-r from-blue-400 to-sky-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
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