import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

// Get the API URL - use current host's IP if accessing from network
const getApiUrl = () => {
  const hostname = window.location.hostname
  // If accessing from network IP (not localhost), use that IP for backend
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8000`
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8000'
}

export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
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
