import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Receipt,
  Calendar,
  DollarSign,
} from 'lucide-react'

// Spring config
const springConfig = { type: "spring" as const, stiffness: 300, damping: 30 }
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: springConfig }
}

// Animated number
function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (current) => `${prefix}${current.toFixed(1)}`)

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return <motion.span>{display}</motion.span>
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-xl border border-indigo-100 p-4 rounded-xl shadow-2xl shadow-indigo-500/10"
      >
        <p className="text-slate-500 text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 font-medium">
              Spending:
            </span>
            <span className="text-slate-900 font-bold">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </motion.div>
    )
  }
  return null
}

export default function Analytics() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const { data: trends } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/trends/?months=6')
      return response.data
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['category-breakdown'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/categories/?days=30')
      return response.data
    },
  })

  const { data: topExpenses } = useQuery({
    queryKey: ['top-expenses'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/top-expenses/?days=30&limit=5')
      return response.data
    },
  })

  const { data: comparison } = useQuery({
    queryKey: ['spending-comparison'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/comparison/')
      return response.data
    },
  })

  const { data: weekly } = useQuery({
    queryKey: ['weekly-analytics'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/weekly/')
      return response.data
    },
  })

  const { data: daily } = useQuery({
    queryKey: ['daily-analytics'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/daily/')
      return response.data
    },
  })

  const chartData = trends?.trends || []

  const metrics = [
    {
      id: 1,
      title: "Current Month",
      icon: Calendar,
      value: formatCurrency(comparison?.current_month?.total || 0),
      subtext: `${comparison?.current_month?.count || 0} transactions`,
      trend: comparison?.change?.direction,
      color: "text-indigo-600",
      bgGradient: "from-indigo-400 to-purple-600",
      bgColor: "bg-indigo-50",
    },
    {
      id: 2,
      title: "Monthly Average",
      icon: BarChart3,
      value: formatCurrency(trends?.average_monthly_spending || 0),
      subtext: `Based on ${trends?.total_months || 0} months`,
      color: "text-emerald-600",
      bgGradient: "from-emerald-400 to-teal-600",
      bgColor: "bg-emerald-50",
    },
    {
      id: 3,
      title: "Top Category",
      icon: PieChartIcon,
      value: categories?.top_category?.category || 'N/A',
      subtext: categories?.top_category ? formatCurrency(categories.top_category.amount) : 'No data',
      color: "text-purple-600",
      bgGradient: "from-purple-400 to-pink-600",
      bgColor: "bg-purple-50",
    },
    {
      id: 4,
      title: "Spending Trend",
      icon: trends?.trend_direction === 'increase' ? TrendingUp : trends?.trend_direction === 'decrease' ? TrendingDown : Activity,
      value: trends?.trend_direction || 'Stable',
      subtext: comparison?.change ? `${comparison.change.direction === 'increase' ? '+' : ''}${comparison.change.percentage}% vs last month` : 'No change',
      trend: trends?.trend_direction,
      color: trends?.trend_direction === 'increase' ? 'text-rose-600' : trends?.trend_direction === 'decrease' ? 'text-emerald-600' : 'text-amber-600',
      bgGradient: trends?.trend_direction === 'increase' ? 'from-rose-400 to-pink-600' : trends?.trend_direction === 'decrease' ? 'from-emerald-400 to-teal-600' : 'from-amber-400 to-orange-600',
      bgColor: trends?.trend_direction === 'increase' ? 'bg-rose-50' : trends?.trend_direction === 'decrease' ? 'bg-emerald-50' : 'bg-amber-50',
    }
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg"
          >
            <BarChart3 className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Analytics
          </h1>
        </div>
        <p className="text-slate-500 text-base md:text-lg max-w-2xl">
          Insights and trends from your spending data
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            variants={itemVariants}
            onHoverStart={() => setHoveredCard(index)}
            onHoverEnd={() => setHoveredCard(null)}
            whileHover={{ scale: 1.02, y: -5 }}
            className="relative group"
          >
            <div className="relative bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-xl transition-all overflow-hidden">
              {/* Background glow */}
              <motion.div
                className={`absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br ${metric.bgGradient} rounded-full opacity-10 blur-2xl`}
                animate={{
                  scale: hoveredCard === index ? 1.2 : 1,
                }}
                transition={{ duration: 0.5 }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    className={`p-3 rounded-xl ${metric.bgColor} shadow-sm`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <metric.icon className={`w-6 h-6 ${metric.color}`} />
                  </motion.div>
                </div>

                <p className="text-slate-500 text-sm mb-1">{metric.title}</p>
                <motion.h3
                  className={`text-2xl md:text-3xl font-bold ${metric.color} mb-2`}
                  key={metric.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {typeof metric.value === 'number' ? (
                    <AnimatedNumber value={metric.value} prefix="" />
                  ) : (
                    metric.value.charAt(0).toUpperCase() + metric.value.slice(1)
                  )}
                </motion.h3>

                <div className="flex items-center gap-2">
                  {metric.trend && (
                    <motion.div
                      initial={false}
                      animate={{
                        color: metric.trend === 'increase' ? '#f43f5e' : '#10b981'
                      }}
                    >
                      {metric.trend === 'increase' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </motion.div>
                  )}
                  <p className="text-sm text-slate-400">{metric.subtext}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Chart */}
      <motion.div variants={itemVariants} className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl opacity-20 blur-xl" />
        <div className="relative bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-500" />
                Monthly Spending Trends
              </h2>
              <p className="text-slate-500">Last 6 months of spending</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-sm text-slate-500">Spending</span>
              </div>
            </div>
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="spending"
                  name="spending"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#colorSpending)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Category Breakdown and Top Expenses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <AnimatePresence>
          {categories?.breakdown?.length > 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChartIcon className="w-6 h-6 text-purple-500" />
                Category Breakdown
              </h2>

              <div className="space-y-4">
                {categories.breakdown.slice(0, 5).map((item: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="relative group"
                  >
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-slate-800 font-semibold">{item.category}</p>
                          <p className="text-slate-500 text-sm">{item.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-900 font-bold text-lg">{formatCurrency(item.amount)}</p>
                        <p className="text-slate-500 text-sm">{item.percentage}%</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Expenses */}
        <AnimatePresence>
          {topExpenses?.expenses?.length > 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-rose-500" />
                Top Expenses
              </h2>

              <div className="space-y-4">
                {topExpenses.expenses.map((expense: any, idx: number) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="relative group"
                  >
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <span className="text-xl">{expense.category_icon}</span>
                        </div>
                        <div>
                          <p className="text-slate-800 font-semibold">{expense.description}</p>
                          <p className="text-slate-500 text-sm">
                            {expense.merchant} • {expense.date_display}
                          </p>
                        </div>
                      </div>
                      <motion.p
                        className="text-xl font-bold text-slate-800"
                        whileHover={{ scale: 1.1, color: '#f43f5e' }}
                      >
                        {formatCurrency(expense.amount)}
                      </motion.p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Month Comparison */}
      <AnimatePresence>
        {comparison && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-indigo-500" />
              Month-over-Month Comparison
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-indigo-50 rounded-2xl">
                <p className="text-slate-500 text-sm mb-2">{comparison.current_month?.month}</p>
                <p className="text-3xl font-bold text-indigo-600 mb-1">
                  {formatCurrency(comparison.current_month?.total || 0)}
                </p>
                <p className="text-slate-500 text-sm">{comparison.current_month?.count} transactions</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl">
                <p className="text-slate-500 text-sm mb-2">{comparison.previous_month?.month}</p>
                <p className="text-3xl font-bold text-slate-600 mb-1">
                  {formatCurrency(comparison.previous_month?.total || 0)}
                </p>
                <p className="text-slate-500 text-sm">{comparison.previous_month?.count} transactions</p>
              </div>

              <div className={`p-6 rounded-2xl ${comparison.change?.direction === 'increase' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                <p className="text-slate-500 text-sm mb-2">Change</p>
                <div className="flex items-center gap-2 mb-1">
                  {comparison.change?.direction === 'increase' ? (
                    <ArrowUpRight className="w-6 h-6 text-rose-600" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-emerald-600" />
                  )}
                  <p className={`text-3xl font-bold ${comparison.change?.direction === 'increase' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {comparison.change?.percentage}%
                  </p>
                </div>
                <p className="text-slate-500 text-sm">
                  {comparison.change?.direction === 'increase' ? '+' : ''}{formatCurrency(Math.abs(comparison.change?.amount || 0))}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Analytics */}
      <AnimatePresence>
        {weekly && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-500" />
              Weekly Spending (Last 7 Days)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-purple-50 rounded-2xl">
                <p className="text-slate-500 text-sm mb-2">This Week</p>
                <p className="text-3xl font-bold text-purple-600 mb-1">
                  {formatCurrency(weekly.current_week?.total || 0)}
                </p>
                <p className="text-slate-500 text-sm">{weekly.current_week?.count} transactions</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl">
                <p className="text-slate-500 text-sm mb-2">Previous Week</p>
                <p className="text-3xl font-bold text-slate-600 mb-1">
                  {formatCurrency(weekly.previous_week?.total || 0)}
                </p>
                <p className="text-slate-500 text-sm">{weekly.previous_week?.count} transactions</p>
              </div>

              <div className={`p-6 rounded-2xl ${weekly.change?.direction === 'increase' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                <p className="text-slate-500 text-sm mb-2">Change</p>
                <div className="flex items-center gap-2 mb-1">
                  {weekly.change?.direction === 'increase' ? (
                    <ArrowUpRight className="w-6 h-6 text-rose-600" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-emerald-600" />
                  )}
                  <p className={`text-3xl font-bold ${weekly.change?.direction === 'increase' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {weekly.change?.percentage}%
                  </p>
                </div>
                <p className="text-slate-500 text-sm">
                  {weekly.change?.direction === 'increase' ? '+' : ''}{formatCurrency(Math.abs(weekly.change?.amount || 0))}
                </p>
              </div>
            </div>

            {/* Daily breakdown chart */}
            {weekly.daily_breakdown && weekly.daily_breakdown.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly.daily_breakdown} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="spending"
                      fill="#a855f7"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Analytics */}
      <AnimatePresence>
        {daily && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Daily Spending
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-blue-50 rounded-2xl">
                <p className="text-slate-500 text-sm mb-2">Today</p>
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  {formatCurrency(daily.today?.total || 0)}
                </p>
                <p className="text-slate-500 text-sm">{daily.today?.count} transactions</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl">
                <p className="text-slate-500 text-sm mb-2">Yesterday</p>
                <p className="text-3xl font-bold text-slate-600 mb-1">
                  {formatCurrency(daily.yesterday?.total || 0)}
                </p>
                <p className="text-slate-500 text-sm">{daily.yesterday?.count} transactions</p>
              </div>

              <div className="p-6 bg-indigo-50 rounded-2xl">
                <p className="text-slate-500 text-sm mb-2">Daily Average</p>
                <p className="text-3xl font-bold text-indigo-600 mb-1">
                  {formatCurrency(daily.monthly_daily_average || 0)}
                </p>
                <p className="text-slate-500 text-sm">This month</p>
              </div>

              <div className={`p-6 rounded-2xl ${daily.change?.direction === 'increase' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                <p className="text-slate-500 text-sm mb-2">Change</p>
                <div className="flex items-center gap-2 mb-1">
                  {daily.change?.direction === 'increase' ? (
                    <ArrowUpRight className="w-6 h-6 text-rose-600" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-emerald-600" />
                  )}
                  <p className={`text-3xl font-bold ${daily.change?.direction === 'increase' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {daily.change?.percentage}%
                  </p>
                </div>
                <p className="text-slate-500 text-sm">vs yesterday</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Original Month Comparison - keeping for reference */}
      <AnimatePresence>
        {comparison && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-indigo-500" />
              Month-over-Month Comparison
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-indigo-50 rounded-2xl">
                <p className="text-slate-500 text-sm mb-2">{comparison.current_month?.month}</p>
                <p className="text-3xl font-bold text-indigo-600 mb-1">
                  {formatCurrency(comparison.current_month?.total || 0)}
                </p>
                <p className="text-slate-500 text-sm">{comparison.current_month?.count} transactions</p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl">
                <p className="text-slate-500 text-sm mb-2">{comparison.previous_month?.month}</p>
                <p className="text-3xl font-bold text-slate-600 mb-1">
                  {formatCurrency(comparison.previous_month?.total || 0)}
                </p>
                <p className="text-slate-500 text-sm">{comparison.previous_month?.count} transactions</p>
              </div>

              <div className={`p-6 rounded-2xl ${comparison.change?.direction === 'increase' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                <p className="text-slate-500 text-sm mb-2">Change</p>
                <div className="flex items-center gap-2 mb-1">
                  {comparison.change?.direction === 'increase' ? (
                    <ArrowUpRight className="w-6 h-6 text-rose-600" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6 text-emerald-600" />
                  )}
                  <p className={`text-3xl font-bold ${comparison.change?.direction === 'increase' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {comparison.change?.percentage}%
                  </p>
                </div>
                <p className="text-slate-500 text-sm">
                  {comparison.change?.direction === 'increase' ? '+' : ''}{formatCurrency(Math.abs(comparison.change?.amount || 0))}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}