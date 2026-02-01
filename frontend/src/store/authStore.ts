import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  monthlyBudget: number
  currency: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  init: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  logout: () => void // Keep for interface compatibility if used elsewhere, but effectively resets
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: true, // Always authenticated in Single User Mode

      init: async () => {
        try {
          // Fetch the default user from backend
          const response = await api.get('/api/users/profile/')
          set({
            user: {
              id: response.data.id,
              username: response.data.username,
              email: response.data.email,
              firstName: response.data.first_name,
              lastName: response.data.last_name,
              monthlyBudget: response.data.monthly_budget,
              currency: response.data.currency,
            },
            isAuthenticated: true
          })
        } catch (error) {
          console.error('Failed to init user, falling back to local mock:', error)
          // Fallback to mock user for local development
          set({
            user: {
              id: 1,
              username: 'local_dev',
              email: 'dev@example.com',
              firstName: 'Local',
              lastName: 'Dev',
              monthlyBudget: 5000, // Default mock budget
              currency: 'INR',
            },
            isAuthenticated: true
          })
        }
      },

      logout: () => {
        // No-op or reset
        set({ user: null })
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
