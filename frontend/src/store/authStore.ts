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
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

interface RegisterData {
  username: string
  email: string
  password: string
  passwordConfirm: string
  firstName?: string
  lastName?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        const response = await api.post('/api/auth/token/', {
          username: email,
          password,
        })
        
        const { access, refresh } = response.data
        
        // Fetch user profile
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`
        const profileResponse = await api.get('/api/users/profile/')
        
        set({
          accessToken: access,
          refreshToken: refresh,
          user: {
            id: profileResponse.data.id,
            username: profileResponse.data.username,
            email: profileResponse.data.email,
            firstName: profileResponse.data.first_name,
            lastName: profileResponse.data.last_name,
            monthlyBudget: profileResponse.data.monthly_budget,
            currency: profileResponse.data.currency,
          },
          isAuthenticated: true,
        })
      },
      
      register: async (data: RegisterData) => {
        await api.post('/api/users/register/', {
          username: data.username,
          email: data.email,
          password: data.password,
          password_confirm: data.passwordConfirm,
          first_name: data.firstName,
          last_name: data.lastName,
        })
        
        // Auto-login after registration
        await get().login(data.email, data.password)
      },
      
      logout: () => {
        delete api.defaults.headers.common['Authorization']
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
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
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
