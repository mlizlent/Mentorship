import { createClient } from './api-client'

export const apiClient = createClient(import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1')
