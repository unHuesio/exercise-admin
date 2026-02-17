import type { UseFetchOptions } from 'nuxt/app';

export function useApiFetch<T = unknown>(path: string, options?: { method?: string; body?: any; headers?: Record<string, string> }) {
  const config = useRuntimeConfig()
  const url = `${config.public.apiBaseUrl}${path}`
  const token = sessionStorage.getItem('authToken') || null
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options?.headers || {})
  }
  return $fetch<T>(url, {
    method: (options?.method || 'GET') as 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'get' | 'head' | 'patch' | 'post' | 'put' | 'delete' | 'connect' | 'options' | 'trace',
    body: options?.body,
    headers: defaultHeaders,
    async onResponseError({ response }) {
        if (response.status === 401 ||
            response.status === 403 ||
            response._data?.error === 'Token expired' ||
            response._data?.message === 'Token expired'
        ) {
            console.warn('Unauthorized access - redirecting to login')
            if(typeof window !== 'undefined') sessionStorage.removeItem('authToken')
            navigateTo('/login')
        }
  } })
}