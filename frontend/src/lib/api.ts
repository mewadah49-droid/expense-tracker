import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

// Get the API URL
const getApiUrl = () => {
  // Use VITE_API_URL if set (for production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Fallback for development
  const hostname = window.location.hostname
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'

  // If accessing from network IP (not localhost), use that IP for backend
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:8000`
  }
  return 'http://localhost:8000'
}

export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Always use demo token for now
    config.headers.Authorization = `Bearer demo-token`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = useAuthStore.getState().refreshToken
      
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${getApiUrl()}/api/auth/token/refresh/`,
            { refresh: refreshToken }
          )
          
          const { access } = response.data
          
          useAuthStore.setState({ accessToken: access })
          originalRequest.headers.Authorization = `Bearer ${access}`
          
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout user
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
