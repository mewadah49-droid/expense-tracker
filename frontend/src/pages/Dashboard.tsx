import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { motion, useSpring, useTransform, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Brain,
  Layers,
  Zap,
  Crown,
  AlertTriangle,
  X,
  Save,
  Receipt,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// 3D Tilt Card Component
function TiltCard({ children, className, color = "indigo", index = 0 }: any) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"])
  
  const glowX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"])
  const glowY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"])
  
  // FIXED: useMotionTemplate called at top level
  const background = useMotionTemplate`radial-gradient(circle at ${glowX} ${glowY}, rgba(99,102,241,0.4), transparent 50%)`
  
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
    indigo: "from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/25",
    emerald: "from-emerald-400 via-teal-500 to-cyan-500 shadow-emerald-500/25",
    rose: "from-rose-400 via-pink-500 to-orange-400 shadow-rose-500/25",
    amber: "from-amber-400 via-orange-500 to-yellow-400 shadow-amber-500/25",
  }
  
  const borderGradient = colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.indigo
  
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 30 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative group ${className}`}
    >
      <div 
        className="relative h-full bg-white rounded-3xl border border-slate-200/60 shadow-xl transition-shadow duration-300 group-hover:shadow-2xl overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div
          className={`absolute -inset-0.5 bg-gradient-to-r ${borderGradient} rounded-3xl opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-500`}
          style={{ background }}
        />
        
        <div 
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.1) 50%, transparent 54%)",
            transform: "translateZ(1px)",
          }}
        />
        
        <div className="relative h-full p-6" style={{ transform: "translateZ(40px)" }}>
          {children}
        </div>
        
        <motion.div
          className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
          animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
    </motion.div>
  )
}

// Animated counter
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (current) => 
    `${prefix}${Math.floor(Math.abs(current)).toLocaleString()}${suffix}`
  )
  
  useEffect(() => {
    spring.set(Math.abs(value))
  }, [value, spring])

  return <motion.span className="tabular-nums">{display}</motion.span>
}

// Premium tooltip
const PremiumTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-md border border-indigo-100 p-4 rounded-2xl shadow-2xl shadow-indigo-500/10"
      >
        <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-slate-900 font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {formatCurrency(payload[0].value)}
        </p>
      </motion.div>
    )
  }
  return null
}

// Loading skeleton
const PremiumSkeleton = () => (
  <div className="space-y-8">
    <div className="h-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl w-1/3 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-96 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl animate-pulse" />
      <div className="h-96 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl animate-pulse" />
    </div>
  </div>
)

export default function Dashboard() {
  const [hoveredChart, setHoveredChart] = useState<number | null>(null)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const queryClient = useQueryClient()
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/api/users/dashboard/')
      return response.data
    },
  })
  
  const { data: insights } = useQuery({
    queryKey: ['spending-insights'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/insights/')
      return response.data
    },
  })
  
  const { data: forecast } = useQuery({
    queryKey: ['spending-forecast'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/forecast/')
      return response.data
    },
  })
  
  // Safe calculations
  const monthlyBudget = stats?.monthly_budget || 0
  const totalSpent = stats?.total_spent || 0
  const totalIncome = stats?.total_income || 0
  
  const remainingBudget = monthlyBudget > 0 
    ? monthlyBudget - totalSpent 
    : totalIncome - totalSpent
  
  const hasBudget = monthlyBudget > 0
  const budgetPercentage = hasBudget 
    ? Math.min(Math.max((totalSpent / monthlyBudget) * 100, 0), 100)
    : 0
  
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
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
  
  if (isLoading) return <PremiumSkeleton />

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12 max-w-7xl mx-auto"
      style={{ perspective: "1000px" }}
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
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </motion.div>
          <p className="text-slate-500 text-base md:text-lg">Your financial empire at a glance</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05, rotateX: -5 }}
          whileTap={{ scale: 0.95 }}
          className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold shadow-xl shadow-indigo-500/25 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <span className="relative flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Insights
          </span>
        </motion.button>
      </motion.div>

      {/* No Budget Warning */}
      {!hasBudget && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-amber-800 font-medium">No monthly budget set</p>
            <p className="text-amber-600 text-sm">Set a budget to track your spending progress</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBudgetModal(true)}
            className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-xl font-medium text-sm"
          >
            Set Budget
          </motion.button>
        </motion.div>
      )}

      {/* 3D Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ transformStyle: "preserve-3d" }}>
        {/* Total Spent */}
        <TiltCard color="rose" index={0}>
          <div className="flex items-start justify-between mb-4">
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30"
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
            transition={{ delay: 0.3, type: "spring" }}
          >
            <AnimatedNumber value={totalSpent} prefix="₹" />
          </motion.p>
          <p className="text-xs md:text-sm font-medium text-slate-500">Total Spent</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-200 via-pink-200 to-transparent opacity-50" />
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
            transition={{ delay: 0.4, type: "spring" }}
          >
            <AnimatedNumber value={totalIncome} prefix="₹" />
          </motion.p>
          <p className="text-xs md:text-sm font-medium text-slate-500">Total Income</p>
        </TiltCard>

        {/* Remaining Budget */}
        <TiltCard color={isOverspent ? "rose" : "indigo"} index={2}>
          <div className="flex items-start justify-between mb-4">
            <motion.div 
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                isOverspent 
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'
              }`}
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Wallet className="w-7 h-7 text-white" />
            </motion.div>
            {isOverspent ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-5 h-5 text-amber-400" />
              </motion.div>
            )}
          </div>
          
          <motion.p 
            className={`text-4xl font-bold mb-1 ${isOverspent ? 'text-rose-600' : 'text-slate-800'}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {isOverspent && <span className="text-2xl">-</span>}
            <AnimatedNumber value={Math.abs(remainingBudget)} prefix="₹" />
          </motion.p>
          
          <p className="text-sm font-medium text-slate-500">
            {isOverspent ? 'Overspent' : hasBudget ? 'Remaining Budget' : 'Net Balance'}
          </p>
          
          {isOverspent && (
            <p className="text-xs text-rose-500 mt-1">
              Over budget by {formatCurrency(overspentAmount)}
            </p>
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
            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${
              budgetStatus.color === 'rose' 
                ? 'text-rose-600 bg-rose-50 border-rose-200' 
                : budgetStatus.color === 'amber'
                ? 'text-amber-600 bg-amber-50 border-amber-200'
                : budgetStatus.color === 'emerald'
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : budgetStatus.color === 'blue'
                ? 'text-blue-600 bg-blue-50 border-blue-200'
                : 'text-slate-600 bg-slate-50 border-slate-200'
            }`}>
              {budgetStatus.icon} {budgetStatus.label}
            </span>
          </div>
          
          <div className="flex items-end gap-2 mb-2">
            <motion.p 
              className="text-4xl font-bold text-slate-800"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              {hasBudget ? (
                isOverspent ? '>100' : budgetPercentage.toFixed(0)
              ) : (
                '--'
              )}%
            </motion.p>
            <span className="text-sm text-slate-400 mb-2">
              {hasBudget ? 'used' : 'N/A'}
            </span>
          </div>
          
          {hasBudget ? (
            <>
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    isOverspent || budgetPercentage > 90
                      ? 'bg-gradient-to-r from-rose-400 to-rose-600' 
                      : budgetPercentage > 75 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                      : budgetPercentage > 50
                      ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {formatCurrency(totalSpent)} of {formatCurrency(monthlyBudget)}
              </p>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-slate-400">
                Set a monthly budget to track progress
              </p>
            </div>
          )}
        </TiltCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ perspective: "2000px" }}>
        {/* Spending Forecast */}
        <motion.div
          initial={{ opacity: 0, rotateX: 10, y: 50 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          onMouseEnter={() => setHoveredChart(0)}
          onMouseLeave={() => setHoveredChart(null)}
          className="relative group"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-indigo-500" />
                  Spending Forecast
                </h2>
                <p className="text-slate-500 mt-1">AI-Powered predictions</p>
              </div>
              {forecast?.trend && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`px-4 py-2 rounded-xl font-bold text-sm border ${
                    forecast.trend === 'increasing' 
                      ? 'bg-rose-50 text-rose-600 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}
                >
                  {forecast.trend === 'increasing' ? (
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 inline mr-1" />
                  )}
                  {forecast.trend}
                </motion.div>
              )}
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...(forecast?.historical_data || []), ...(forecast?.predictions?.map((p: any) => ({
                  month: p.month,
                  spending: p.predicted_spending,
                })) || [])]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<PremiumTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="spending"
                    stroke="url(#lineGradient)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorSpending)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {forecast?.model_accuracy && (
              <div className="mt-6 flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                <Brain className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">
                  Prediction accuracy: <span className="text-indigo-600 font-bold">{forecast.model_accuracy}%</span>
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, rotateX: 10, y: 50 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          onMouseEnter={() => setHoveredChart(1)}
          onMouseLeave={() => setHoveredChart(null)}
          className="relative group"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Target className="w-6 h-6 text-pink-500" />
              Spending by Category
            </h2>
            <p className="text-slate-500 mb-8">Where your money goes</p>
            
            <div className="h-72 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insights?.top_categories || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="amount"
                    nameKey="name"
                  >
                    {insights?.top_categories?.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke="white"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PremiumTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">{insights?.top_categories?.length || 0}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Categories</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-6">
              {insights?.top_categories?.slice(0, 5).map((cat: any, i: number) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm cursor-pointer"
                  style={{ 
                    backgroundColor: `${COLORS[i]}15`, 
                    color: COLORS[i],
                    border: `2px solid ${COLORS[i]}30`
                  }}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className="opacity-60 text-xs">
                    {totalSpent > 0 ? Math.round((cat.amount / totalSpent) * 100) : 0}%
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
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

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  )
}

// Budget Modal Component
function BudgetModal({
  currentBudget,
  onClose,
  onSave,
}: {
  currentBudget: number
  onClose: () => void
  onSave: () => void
}) {
  const [budget, setBudget] = useState(currentBudget.toString())
  const queryClient = useQueryClient()

  const updateBudget = useMutation({
    mutationFn: async (amount: number) => {
      const response = await api.patch('/api/users/profile/', {
        monthly_budget: amount,
      })
      return response.data
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
    if (amount > 0) {
      updateBudget.mutate(amount)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6" />
                Set Monthly Budget
              </h2>
              <p className="text-amber-100 mt-1">Track your spending goals</p>
            </div>
            <motion.button 
              whileHover={{ rotate: 90 }}
              onClick={onClose}
              className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-500" />
              Monthly Budget Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
                ₹
              </span>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="50000"
                className="w-full pl-10 pr-4 py-4 bg-amber-50 border-2 border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-lg font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">💡 Budget Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Start with your monthly income minus fixed expenses</li>
                  <li>• Leave room for savings (aim for 20% of income)</li>
                  <li>• Track progress and adjust as needed</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={updateBudget.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updateBudget.isPending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Budget
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}