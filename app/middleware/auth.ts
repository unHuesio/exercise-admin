import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  await authStore.initialize()
  if (!authStore.isLoggedIn) {
    console.warn('No auth token found - redirecting to login')
    return navigateTo('/login')
  }
})
