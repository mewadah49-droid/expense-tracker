import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import App from './App'
import './index.css'

// Splash Screen with GPU-accelerated animations
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.2) 0%, transparent 50%)',
            'radial-gradient(circle at 60% 40%, rgba(168,85,247,0.2) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 60%, rgba(99,102,241,0.2) 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Logo Animation */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, duration: 0.8 }}
        className="relative z-10"
      >
        <motion.div
          className="text-7xl filter drop-shadow-[0_0_40px_rgba(99,102,241,0.6)]"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          💰
        </motion.div>
        {/* Orbiting particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-indigo-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
            style={{ translateX: 50 + i * 20 }}
          />
        ))}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-6 text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent bg-[length:200%_auto]"
        style={{ animation: 'gradient-shift 3s ease infinite' }}
      >
        ExpenseAI
      </motion.h1>

      {/* Progress bar */}
      <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%]"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          style={{ animation: 'shimmer 2s linear infinite' }}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-xs text-white/40 font-medium tracking-widest uppercase"
      >
        Initializing AI Engine...
      </motion.p>
    </motion.div>
  )
}

// Enhanced QueryClient with smart defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})

// Custom toast styles matching our glassmorphism theme
const toastConfig = {
  duration: 4000,
  style: {
    background: 'rgba(18, 18, 26, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#fff',
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
    fontSize: '14px',
    fontWeight: 500,
    maxWidth: '400px',
  },
  success: {
    icon: '✨',
    style: {
      borderLeft: '4px solid #10b981',
      boxShadow: '0 20px 50px -12px rgba(16, 185, 129, 0.25)',
    },
  },
  error: {
    icon: '❌',
    style: {
      borderLeft: '4px solid #f43f5e',
      boxShadow: '0 20px 50px -12px rgba(244, 63, 94, 0.25)',
    },
  },
  loading: {
    icon: '⏳',
    style: {
      borderLeft: '4px solid #6366f1',
      boxShadow: '0 20px 50px -12px rgba(99, 102, 241, 0.25)',
    },
  },
}

function Root() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AnimatePresence mode="wait">
            {isLoading && (
              <SplashScreen key="splash" onComplete={() => setIsLoading(false)} />
            )}
          </AnimatePresence>

          {!isLoading && (
            <motion.div
              key="app"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <App />
            </motion.div>
          )}

          <Toaster 
            position="top-right"
            toastOptions={toastConfig}
            containerStyle={{
              top: 20,
              right: 20,
            }}
          />
          
          {/* Add ReactQueryDevtools in development if you have it */}
          {/* {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />} */}
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  )
}

// Inject global keyframes
const styleSheet = document.createElement('style')
styleSheet.innerText = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  /* Custom selection color */
  ::selection {
    background: rgba(99, 102, 241, 0.3);
    color: white;
  }
  /* Hide scrollbar but keep functionality */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`
document.head.appendChild(styleSheet)

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)