import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, formatRelativeDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Plus,
  Search,
  Sparkles,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Calendar,
  Store,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react'

interface Transaction {
  id: number
  amount: number
  description: string
  merchant: string
  transaction_type: 'expense' | 'income'
  category: number
  category_name: string
  category_icon: string
  ai_categorized: boolean
  ai_confidence: number
  date: string
  source: string
}

// Fixed 3D Tilt Card Component
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"])
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const xPct = (event.clientX - rect.left) / rect.width - 0.5
    const yPct = (event.clientY - rect.top) / rect.height - 0.5
    x.set(xPct)
    y.set(yPct)
  }
  
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  )
}

export default function Transactions() {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all')
  const [search, setSearch] = useState('')
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filter, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('transaction_type', filter)
      if (search) params.append('search', search)
      
      const response = await api.get(`/api/transactions/transactions/?${params}`)
      // Handle both array and {results: array} formats
      return Array.isArray(response.data) ? response.data : response.data.results || []
    },
  })
  
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/api/transactions/categories/')
      return Array.isArray(response.data) ? response.data : response.data.results || []
    },
  })
  
  const addTransaction = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/api/transactions/transactions/', data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setShowAddModal(false)
      
      if (data.ai_categorized) {
        toast.success(`AI categorized as "${data.category_name}"`, { icon: '🤖' })
      } else {
        toast.success('Transaction added!')
      }
    },
    onError: () => {
      toast.error('Failed to add transaction')
    },
  })

  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.patch(`/api/transactions/transactions/${id}/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setEditingTransaction(null)
      toast.success('Transaction updated!')
    },
    onError: () => {
      toast.error('Failed to update transaction')
    },
  })

  const deleteTransaction = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/transactions/transactions/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Transaction deleted!')
    },
    onError: () => {
      toast.error('Failed to delete transaction')
    },
  })

  console.log('Transactions:', transactions) // Debug log

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12 max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Transactions
            </h1>
          </div>
          <p className="text-slate-500 text-base md:text-lg">Track every penny with AI precision</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
          {(['all', 'expense', 'income'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-6 py-3 rounded-xl font-semibold transition-all capitalize relative',
                filter === type
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-800'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List - FIXED VISIBILITY */}
      <div className="space-y-3 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl font-semibold text-slate-700 mb-2">No transactions found</p>
            <p className="text-slate-500">Add your first transaction to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn: Transaction, index: number) => (
              <TiltCard key={txn.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-lg flex-shrink-0',
                      txn.transaction_type === 'income' 
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' 
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700'
                    )}>
                      {txn.category_icon || '📦'}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-slate-800 text-base md:text-lg truncate">{txn.description}</p>
                        {txn.ai_categorized && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          {txn.merchant || txn.category_name}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block" />
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeDate(txn.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Amount & Actions Row */}
                  <div className="flex items-center justify-between md:justify-end gap-4 pl-16 md:pl-0">
                    {/* Amount */}
                    <div className={cn(
                      'flex items-center gap-1 font-bold text-lg md:text-xl flex-shrink-0',
                      txn.transaction_type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                    )}>
                      {txn.transaction_type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
                      )}
                      {formatCurrency(txn.amount)}
                    </div>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTransaction(txn)
                      }}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this transaction?')) {
                          deleteTransaction.mutate(txn.id)
                        }
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showAddModal && (
          <TransactionModal
            categories={categories}
            onClose={() => setShowAddModal(false)}
            onSubmit={(data) => addTransaction.mutate(data)}
            isLoading={addTransaction.isPending}
          />
        )}
      </AnimatePresence>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <TransactionModal
            transaction={editingTransaction}
            categories={categories}
            onClose={() => setEditingTransaction(null)}
            onSubmit={(data) => updateTransaction.mutate({ id: editingTransaction.id, data })}
            isLoading={updateTransaction.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Modal Component (Simplified for visibility)
function TransactionModal({
  transaction,
  categories,
  onClose,
  onSubmit,
  isLoading,
}: {
  transaction?: Transaction
  categories: any[]
  onClose: () => void
  onSubmit: (data: any) => void
  isLoading: boolean
}) {
  const isEditMode = !!transaction
  
  const [formData, setFormData] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    merchant: transaction?.merchant || '',
    transaction_type: transaction?.transaction_type || 'expense',
    category: transaction?.category?.toString() || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      category: formData.category ? parseInt(formData.category) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">
            {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Lunch at Starbucks"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as 'expense' | 'income' })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category (optional)</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50"
            >
              <option value="">🤖 Auto-categorize with AI</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 mt-6"
          >
            {isLoading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Transaction' : 'Add Transaction')}
          </button>
        </form>
      </motion.div>
    </div>
  )
}