import { defineStore } from 'pinia'
import { clearCachedApiFetch } from '~/composables/useCachedApiFetch'

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
          this.lastToken = token
          this.sessionLoaded = false
          // Fail closed for admin until /me confirms; token presence only implies a pending session.
          this.isLoggedIn = true
          this.isAdmin = false

          try {
            const me = await useApiFetch<MeResponse>('/me', {
              method: 'GET'
            })

            this.isLoggedIn = true
            this.isAdmin = resolveIsAdmin(me) || resolveIsAdmin(me?.user)
          } catch {
            // Never trust client-decoded JWT claims. Admin requires a successful /me.
            this.isAdmin = false
            if (!sessionStorage.getItem('authToken')) {
              this.isLoggedIn = false
              this.lastToken = null
            }
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
        clearCachedApiFetch()
        this.isLoggedIn = false
        this.isAdmin = false
        this.lastToken = null
        this.sessionLoaded = false
      }
    }
  }
})
