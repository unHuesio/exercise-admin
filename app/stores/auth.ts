import { defineStore } from 'pinia'
import {jwtDecode} from 'jwt-decode'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        isLoggedIn: false,
        isAdmin: false,
    }),
    actions: {
        initialize() {
            if (typeof window !== 'undefined') {
                const token = sessionStorage.getItem('authToken')
                const payload = token ? jwtDecode(token) : { roles: [] }
                this.isLoggedIn = !!token
                this.isAdmin = payload?.roles.find((role: string) => role === 'admin') !== undefined
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