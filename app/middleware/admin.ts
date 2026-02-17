import { useAuthStore } from "~/stores/auth";


export default defineNuxtRouteMiddleware((to, from) => {
    const authStore = useAuthStore();
    if (!authStore.isAdmin) {
            console.warn('No admin role found - redirecting to login')
            return navigateTo('/login')
    }
})