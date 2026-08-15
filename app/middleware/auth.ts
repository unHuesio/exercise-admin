import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  authStore.initialize()

  if (!authStore.isLoggedIn) {
    console.warn('No auth token found - redirecting to login')
    return navigateTo('/login')
  }
})
