import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

type DecodedToken = {
  roles?: string[]
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false,
    isAdmin: false
  }),
  actions: {
    initialize() {
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('authToken')
        const payload: DecodedToken = token ? jwtDecode<DecodedToken>(token) : { roles: [] }
        this.isLoggedIn = !!token
        this.isAdmin = payload.roles?.includes('admin') ?? false
      }
    },
    logout() {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('authToken')
        this.isLoggedIn = false
        this.isAdmin = false
      }
    }
  }
})
