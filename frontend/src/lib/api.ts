import axios from 'axios'

// Get the API URL
const getApiUrl = () => {
  // Use environment variable if available (set by Render)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Check if we're in production (not localhost)
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'

  if (isProduction) {
    // Fallback to the known production backend URL
    return 'https://expense-tracker-api-db8z.onrender.com'
  }

  // Development
  return 'http://localhost:8000'
}

const apiUrl = getApiUrl()
console.log('-------------------------------------------')
console.log('Expense Tracker API Config')
console.log('Environment:', window.location.hostname === 'localhost' ? 'Development (Local)' : 'Production')
console.log('Active API URL:', apiUrl)
console.log('-------------------------------------------')

export const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    console.log('API Data:', response.data)
    if (response.request?.responseURL) {
      console.log('Final URL:', response.request.responseURL)
    }
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data, error.config?.url)
    return Promise.reject(error)
  }
)

export default api
