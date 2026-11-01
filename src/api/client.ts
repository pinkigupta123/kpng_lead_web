import axios from 'axios'
import { useAuth } from '../store/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) useAuth.getState().clearAuth()
    return Promise.reject(error)
  },
)

export const errMsg = (e: any, fallback = 'Something went wrong') => {
  const d = e?.response?.data
  if (d?.errors) return Object.values(d.errors).flat().join(' ')
  return d?.message || (e?.code === 'ECONNABORTED' ? 'Server is waking up, try again.' : fallback)
}

export default api
