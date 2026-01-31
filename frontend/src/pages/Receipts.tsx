import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  Upload,
  Scan,
  Check,
  X,
  AlertCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Camera,
  FileImage,
  Zap,
  Trash2,
  Receipt,
  Calendar,
} from 'lucide-react'

interface Receipt {
  id: number
  image_url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  merchant_name: string
  total_amount: number
  receipt_date: string
  items: { name: string; quantity: number; price: number }[]
  ai_confidence: number
  suggested_category: string
  created_at: string
  error_message: string
}

// 3D Tilt Card Component
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"])
  
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
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function Receipts() {
  const queryClient = useQueryClient()
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const response = await api.get('/api/receipts/')
      return Array.isArray(response.data) ? response.data : response.data.results || []
    },
  })
  
  const uploadReceipt = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await api.post('/api/receipts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      toast.success('Receipt uploaded! AI is processing...', { icon: '📸' })
    },
    onError: () => {
      toast.error('Failed to upload receipt')
    },
  })
  
  const createTransaction = useMutation({
    mutationFn: async ({ receiptId, data }: { receiptId: number; data: any }) => {
      const response = await api.post(`/api/receipts/${receiptId}/create_transaction/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setSelectedReceipt(null)
      toast.success('Transaction created!', { icon: '✅' })
    },
  })
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadReceipt.mutate(acceptedFiles[0])
    }
  }, [uploadReceipt])
  
  const { getRootProps, getInputProps, isDragActive, isDragAccept } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  })
  
  const getStatusConfig = (status: Receipt['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: Check,
          color: 'text-emerald-400 bg-emerald-50 border-emerald-200',
          gradient: 'from-emerald-400 to-teal-500',
          shadow: 'shadow-emerald-500/25'
        }
      case 'processing':
        return {
          icon: Clock,
          color: 'text-amber-400 bg-amber-50 border-amber-200',
          gradient: 'from-amber-400 to-orange-500',
          shadow: 'shadow-amber-500/25'
        }
      case 'failed':
        return {
          icon: X,
          color: 'text-rose-400 bg-rose-50 border-rose-200',
          gradient: 'from-rose-400 to-pink-500',
          shadow: 'shadow-rose-500/25'
        }
      default:
        return {
          icon: Clock,
          color: 'text-slate-400 bg-slate-50 border-slate-200',
          gradient: 'from-slate-400 to-slate-500',
          shadow: 'shadow-slate-500/25'
        }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12 max-w-6xl mx-auto"
    >
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Receipt Scanner
            </h1>
          </div>
          <p className="text-slate-500 text-lg">
            AI-powered OCR extraction for automatic expense tracking
          </p>
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl"
        >
          <Zap className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-700">
            {receipts?.filter((r: Receipt) => r.status === 'processing').length || 0} Processing
          </span>
        </motion.div>
      </motion.div>

      {/* Premium Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div
          {...getRootProps()}
          className={cn(
            'relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300',
            isDragAccept
              ? 'border-indigo-500 bg-indigo-50 shadow-2xl shadow-indigo-500/20'
              : isDragActive
              ? 'border-indigo-400 bg-indigo-50/50'
              : 'border-slate-300 bg-white hover:border-indigo-300 hover:shadow-xl'
          )}
        >
          <input {...getInputProps()} />
          
          {/* Background gradient animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5"
            animate={{ x: ['0%', '100%', '0%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="relative p-12 text-center">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              {isDragActive ? (
                <FileImage className="w-10 h-10 text-white" />
              ) : (
                <Scan className="w-10 h-10 text-white" />
              )}
            </motion.div>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              {isDragActive ? 'Drop your receipt here' : 'Upload a receipt'}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Drag and drop an image, or click to browse. Our AI will extract merchant, items, and total automatically.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25"
            >
              <Upload className="w-5 h-5" />
              Choose File
            </motion.button>
            
            <p className="mt-4 text-xs text-slate-400">
              Supports JPEG, PNG, WebP • Max 10MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* Recent Receipts Grid */}
      <div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"
        >
          <Receipt className="w-6 h-6 text-indigo-500" />
          Recent Receipts
        </motion.h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : receipts?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200 border-dashed"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              📸
            </motion.div>
            <p className="text-xl font-semibold text-slate-700 mb-2">No receipts yet</p>
            <p className="text-slate-500">Upload your first receipt to get started!</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {receipts?.map((receipt: Receipt, index: number) => {
              const statusConfig = getStatusConfig(receipt.status)
              const StatusIcon = statusConfig.icon
              
              return (
                <TiltCard key={receipt.id}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    onClick={() => receipt.status === 'completed' && setSelectedReceipt(receipt)}
                    className={cn(
                      'relative bg-white rounded-3xl overflow-hidden border-2 transition-all cursor-pointer group',
                      receipt.status === 'completed' 
                        ? 'border-slate-200 hover:border-indigo-300 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10' 
                        : 'border-slate-100 opacity-75'
                    )}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      {receipt.image_url ? (
                        <motion.img
                          src={receipt.image_url}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <Receipt className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-lg',
                            statusConfig.color
                          )}
                        >
                          <motion.div
                            animate={receipt.status === 'processing' ? { rotate: 360 } : {}}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <StatusIcon className="w-4 h-4" />
                          </motion.div>
                          <span className="text-xs font-bold capitalize">{receipt.status}</span>
                        </motion.div>
                      </div>

                      {/* Gradient Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      {receipt.status === 'completed' ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-800 text-lg truncate pr-2">
                              {receipt.merchant_name || 'Unknown Merchant'}
                            </h3>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {receipt.receipt_date
                                ? formatDate(receipt.receipt_date)
                                : formatDate(receipt.created_at)}
                            </span>
                            <span className="text-xl font-bold text-slate-800">
                              {formatCurrency(receipt.total_amount || 0)}
                            </span>
                          </div>
                          
                          {/* AI Confidence Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                                <Sparkles className="w-3 h-3" />
                                AI Confidence
                              </span>
                              <span className="text-slate-600 font-bold">
                                {(receipt.ai_confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(receipt.ai_confidence * 100)}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                              />
                            </div>
                          </div>
                        </>
                      ) : receipt.status === 'failed' ? (
                        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-medium">
                            {receipt.error_message || 'Processing failed'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Clock className="w-5 h-5 text-amber-500" />
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium text-amber-700">Processing receipt...</p>
                            <p className="text-xs text-amber-600">AI is extracting data</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </TiltCard>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <ReceiptDetailModal
            receipt={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
            onCreateTransaction={(data) =>
              createTransaction.mutate({ receiptId: selectedReceipt.id, data })
            }
            isLoading={createTransaction.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ReceiptDetailModal({
  receipt,
  onClose,
  onCreateTransaction,
  isLoading,
}: {
  receipt: Receipt
  onClose: () => void
  onCreateTransaction: (data: any) => void
  isLoading: boolean
}) {
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
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-64 bg-slate-100">
          <img
            src={receipt.image_url}
            alt="Receipt"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="absolute bottom-4 left-6 text-white">
            <h2 className="text-3xl font-bold mb-1">{receipt.merchant_name || 'Unknown Merchant'}</h2>
            <p className="text-white/80 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {receipt.receipt_date ? formatDate(receipt.receipt_date) : 'Date not detected'}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Total & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
              <p className="text-sm text-emerald-600 font-semibold mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-emerald-700">
                {formatCurrency(receipt.total_amount || 0)}
              </p>
            </div>
            
            {receipt.suggested_category && (
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                <p className="text-sm text-indigo-600 font-semibold mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Category
                </p>
                <p className="text-2xl font-bold text-indigo-700">{receipt.suggested_category}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          {receipt.items?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-400" />
                Extracted Items ({receipt.items.length})
              </h3>
              <div className="space-y-2">
                {receipt.items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                        {item.quantity}x
                      </span>
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{formatCurrency(item.price)}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onCreateTransaction({})}
              disabled={isLoading}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-xl transition-shadow"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="w-5 h-5" />
                </motion.div>
              ) : (
                <Check className="w-5 h-5" />
              )}
              {isLoading ? 'Creating...' : 'Create Transaction'}
            </button>
            
            <button
              onClick={onClose}
              className="px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}