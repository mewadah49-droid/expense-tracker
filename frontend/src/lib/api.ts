import axios from 'axios'

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
})

export default api
