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
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Target,
} from 'lucide-react'

// Spring config
const springConfig = { type: "spring", stiffness: 300, damping: 30 }
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
              {entry.name === 'spending' ? 'Actual' : 'Predicted'}:
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
  
  const { data: forecast } = useQuery({
    queryKey: ['spending-forecast'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/forecast/?months=6')
      return response.data
    },
  })
  
  const { data: anomalies } = useQuery({
    queryKey: ['anomalies'],
    queryFn: async () => {
      const response = await api.get('/api/analytics/anomalies/')
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
  
  const chartData = [
    ...(forecast?.historical_data?.map((d: any) => ({
      ...d,
      predicted: null,
    })) || []),
    ...(forecast?.predictions?.map((p: any) => ({
      month: p.month,
      spending: null,
      predicted: p.predicted_spending,
      lower: p.lower_bound,
      upper: p.upper_bound,
    })) || []),
  ]

  const metrics = [
    {
      id: 1,
      title: "Spending Trend",
      icon: forecast?.trend === 'increasing' ? TrendingUp : forecast?.trend === 'decreasing' ? TrendingDown : Activity,
      value: forecast?.trend || 'Stable',
      subtext: `Monthly change: ${formatCurrency(Math.abs(forecast?.monthly_change || 0))}`,
      trend: forecast?.trend,
      color: forecast?.trend === 'increasing' ? 'text-rose-600' : forecast?.trend === 'decreasing' ? 'text-emerald-600' : 'text-amber-600',
      bgGradient: forecast?.trend === 'increasing' ? 'from-rose-400 to-pink-600' : forecast?.trend === 'decreasing' ? 'from-emerald-400 to-teal-600' : 'from-amber-400 to-orange-600',
      bgColor: forecast?.trend === 'increasing' ? 'bg-rose-50' : forecast?.trend === 'decreasing' ? 'bg-emerald-50' : 'bg-amber-50',
    },
    {
      id: 2,
      title: "Prediction Accuracy",
      icon: Brain,
      value: `${forecast?.model_accuracy?.toFixed(1) || 0}%`,
      subtext: `Based on ${forecast?.historical_months || 0} months of data`,
      color: "text-indigo-600",
      bgGradient: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-50",
      isAI: true,
    },
    {
      id: 3,
      title: "Unusual Transactions",
      icon: AlertTriangle,
      value: anomalies?.count || 0,
      subtext: "Detected in the last 30 days",
      color: "text-amber-600",
      bgGradient: "from-amber-400 to-orange-600",
      bgColor: "bg-amber-50",
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
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Analytics
          </h1>
        </div>
        <p className="text-slate-500 text-base md:text-lg max-w-2xl">
          AI-powered insights and predictions for your finances
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  
                  {metric.isAI && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-200 font-medium"
                    >
                      <Zap className="w-3 h-3" />
                      AI
                    </motion.div>
                  )}
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
                        color: metric.trend === 'increasing' ? '#f43f5e' : '#10b981'
                      }}
                    >
                      {metric.trend === 'increasing' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
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
                <Target className="w-6 h-6 text-indigo-500" />
                Spending Forecast
              </h2>
              <p className="text-slate-500">6-month AI prediction model</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-sm text-slate-500">Historical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-500">Predicted</span>
              </div>
            </div>
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  fill="url(#colorActual)"
                  animationDuration={2000}
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  name="predicted"
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fill="url(#colorPredicted)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Predictions Table */}
      <AnimatePresence>
        {forecast?.predictions?.length > 0 && (
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-500" />
              Predicted Monthly Spending
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-4 text-slate-400 font-medium text-sm">Month</th>
                    <th className="pb-4 text-slate-400 font-medium text-sm">Predicted</th>
                    <th className="pb-4 text-slate-400 font-medium text-sm">Range</th>
                    <th className="pb-4 text-slate-400 font-medium text-sm">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {forecast.predictions.map((pred: any, idx: number) => (
                    <motion.tr 
                      key={pred.month}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ backgroundColor: 'rgba(99,102,241,0.03)' }}
                      className="group cursor-pointer"
                    >
                      <td className="py-4 text-slate-800 font-medium">{pred.month}</td>
                      <td className="py-4 text-emerald-600 font-bold text-lg">
                        {formatCurrency(pred.predicted_spending)}
                      </td>
                      <td className="py-4 text-slate-500 text-sm">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                          {formatCurrency(pred.lower_bound)} - {formatCurrency(pred.upper_bound)}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pred.confidence}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </div>
                          <span className="text-indigo-600 font-medium">{pred.confidence}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anomalies */}
      <AnimatePresence>
        {anomalies?.anomalies?.length > 0 && (
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              Unusual Transactions
            </h2>
            <div className="grid gap-4">
              {anomalies.anomalies.map((anomaly: any, idx: number) => (
                <motion.div
                  key={anomaly.transaction_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-between p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className="p-3 bg-white rounded-xl shadow-sm"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      </motion.div>
                      <div>
                        <p className="text-slate-800 font-semibold text-lg mb-1">{anomaly.description}</p>
                        <p className="text-slate-500 text-sm">
                          {anomaly.merchant || anomaly.category} • {anomaly.date}
                        </p>
                        <motion.p 
                          className="text-xs text-amber-600 mt-2 flex items-center gap-1 font-medium"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Zap className="w-3 h-3" />
                          {anomaly.reason}
                        </motion.p>
                      </div>
                    </div>
                    <motion.p 
                      className="text-2xl font-bold text-slate-800"
                      whileHover={{ scale: 1.1, color: '#f43f5e' }}
                    >
                      {formatCurrency(anomaly.amount)}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Insights */}
      <AnimatePresence>
        {insights?.recommendations?.length > 0 && (
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              AI Insights
            </h2>
            <div className="grid gap-4">
              {insights.recommendations.map((rec: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  <div className="relative p-6 bg-white border border-indigo-100 rounded-2xl shadow-sm flex items-start gap-4">
                    <div className="mt-1">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-indigo-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    </div>
                    <p className="text-slate-700 text-lg leading-relaxed font-medium">{rec}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}