import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  await authStore.initialize()

  if (!authStore.isAdmin) {
    console.warn('No admin role found - redirecting to login')
    return navigateTo('/login')
  }
})
