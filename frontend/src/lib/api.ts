import axios from 'axios'

// Get the API URL
const getApiUrl = () => {
  // Check if we're in production (not localhost)
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  
  if (isProduction) {
    // Always use the production backend URL
    return 'https://expense-tracker-api-h99f.onrender.com'
  }
  
  // Development
  return 'http://localhost:8000'
}

const apiUrl = getApiUrl()
console.log('API URL:', apiUrl)

export const api = axios.create({
  baseURL: getApiUrl(),
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
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data, error.config?.url)
    return Promise.reject(error)
  }
)

export default api
