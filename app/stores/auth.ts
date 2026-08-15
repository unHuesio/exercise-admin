import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

type DecodedToken = {
  roles?: string[]
  isAdmin?: boolean
  is_admin?: boolean
}

type MeResponse = {
  isAdmin?: boolean
  is_admin?: boolean
  roles?: string[]
  role?: string
  user?: {
    isAdmin?: boolean
    is_admin?: boolean
    roles?: string[]
    role?: string
  }
}

type AdminSource = {
  isAdmin?: boolean
  is_admin?: boolean
  roles?: string[]
  role?: string
}

let initializePromise: Promise<void> | null = null

const resolveIsAdmin = (value?: AdminSource) => {
  if (!value) {
    return false
  }

  if (typeof value.isAdmin === 'boolean') {
    return value.isAdmin
  }

  if (typeof value.is_admin === 'boolean') {
    return value.is_admin
  }

  if (Array.isArray(value.roles)) {
    return value.roles.includes('admin')
  }

  return value.role === 'admin'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false,
    isAdmin: false,
    lastToken: null as string | null,
    sessionLoaded: false
  }),
  actions: {
    async initialize() {
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('authToken')

        if (!token) {
          this.isLoggedIn = false
          this.isAdmin = false
          this.lastToken = null
          this.sessionLoaded = true
          return
        }

        if (this.sessionLoaded && this.lastToken === token) {
          return
        }

        if (initializePromise) {
          return initializePromise
        }

        initializePromise = (async () => {
          this.isLoggedIn = true
          this.lastToken = token
          this.sessionLoaded = false

          try {
            const payload = jwtDecode<DecodedToken>(token)
            this.isAdmin = resolveIsAdmin(payload)
          } catch {
            this.isAdmin = false
          }

          try {
            const me = await useApiFetch<MeResponse>('/me', {
              method: 'GET'
            })

            this.isAdmin = resolveIsAdmin(me) || resolveIsAdmin(me?.user) || this.isAdmin
          } catch {
            // Keep JWT-derived admin state if /me is unavailable or rate-limited.
          } finally {
            this.sessionLoaded = true
          }
        })().finally(() => {
          initializePromise = null
        })

        return initializePromise
      }
    },
    logout() {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('authToken')
        this.isLoggedIn = false
        this.isAdmin = false
        this.lastToken = null
        this.sessionLoaded = false
      }
    }
  }
})
