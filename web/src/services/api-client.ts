import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'

export interface ApiClientConfig {
  baseURL: string
}

export function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  let isRefreshing = false
  let refreshPromise: Promise<string | null> | null = null

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = refreshToken().then((token) => {
            isRefreshing = false
            return token
          })
        }

        try {
          const token = await refreshPromise
          if (token) {
            originalRequest._retry = true
            originalRequest.headers.Authorization = `Bearer ${token}`
            return client(originalRequest)
          }
        } catch {
          // Refresh failed, clear tokens
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          document.cookie = 'refresh_token=; path=/auth/refresh; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    },
  )

  return client
}

async function refreshToken(): Promise<string | null> {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/auth/refresh`,
      {},
      { withCredentials: true }
    )
    const data = response.data as { access_token?: string }
    return data.access_token || null
  } catch {
    return null
  }
}
