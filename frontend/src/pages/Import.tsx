import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation } from '@tanstack/react-query'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  total_errors: number
}

export default function Import() {
  const [result, setResult] = useState<ImportResult | null>(null)

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/transactions/transactions/import_csv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
    onSuccess: (data) => {
      setResult(data)
      if (data.imported > 0) {
        toast.success(`Successfully imported ${data.imported} transactions!`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to import CSV')
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setResult(null)
      importMutation.mutate(acceptedFiles[0])
    }
  }, [importMutation])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  const downloadSample = () => {
    const csv = `Date,Description,Amount,Type
2024-01-15,Starbucks Coffee,-5.50,expense
2024-01-14,Salary Deposit,3500.00,income
2024-01-13,Amazon Purchase,-89.99,expense
2024-01-12,Uber Ride,-24.50,expense
2024-01-11,Netflix Subscription,-15.99,expense`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Import Transactions</h1>
        <p className="text-slate-500 mt-2">
          Upload a CSV file from your bank to import transactions automatically
        </p>
      </div>

      {/* Info Card */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">📋 CSV Format</h3>
        <p className="text-slate-600 mb-4">
          Your CSV should have columns for <span className="text-indigo-600 font-medium">Date</span>, 
          <span className="text-indigo-600 font-medium"> Description</span>, and 
          <span className="text-indigo-600 font-medium"> Amount</span>. We support most bank export formats.
        </p>
        
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-slate-600 mb-4 border border-slate-100">
          <p className="text-slate-400"># Example format:</p>
          <p>Date,Description,Amount</p>
          <p>2024-01-15,Starbucks Coffee,-5.50</p>
          <p>2024-01-14,Amazon Purchase,-89.99</p>
        </div>

        <button
          onClick={downloadSample}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Download Sample CSV
        </button>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`card p-12 text-center cursor-pointer transition-all border-2 border-dashed ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'
        } ${importMutation.isPending ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        
        {importMutation.isPending ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
              <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-slate-800 font-medium">Processing your file...</p>
            <p className="text-slate-500 text-sm">AI is categorizing your transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-800 font-medium">
                {isDragActive ? 'Drop your CSV here' : 'Drag & drop your bank CSV here'}
              </p>
              <p className="text-slate-500 text-sm mt-1">or click to browse files</p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            {result.imported > 0 ? (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-500" />
            )}
            <h3 className="text-lg font-semibold text-slate-800">Import Results</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <p className="text-slate-600 text-sm">Transactions Imported</p>
              <p className="text-2xl font-bold text-emerald-600">{result.imported}</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
              <p className="text-slate-600 text-sm">Errors</p>
              <p className="text-2xl font-bold text-rose-600">{result.total_errors}</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="alert alert-danger">
              <p className="font-medium mb-2">Issues found:</p>
              <ul className="text-sm space-y-1">
                {result.errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-slate-500 text-sm">
            ✨ All imported transactions have been automatically categorized by AI
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Tips</h3>
        <ul className="space-y-2 text-slate-600">
          <li>• Most banks let you export transactions as CSV from their website</li>
          <li>• We auto-detect common date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)</li>
          <li>• Negative amounts are treated as expenses, positive as income</li>
          <li>• Each transaction is automatically categorized by AI</li>
          <li>• You can recategorize any transaction later from the Transactions page</li>
        </ul>
      </div>
    </div>
  )
}
