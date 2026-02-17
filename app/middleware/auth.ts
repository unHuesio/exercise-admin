import { useAuthStore } from "~/stores/auth";


export default defineNuxtRouteMiddleware((to, from) => {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
        console.warn('No auth token found - redirecting to login')
        return navigateTo('/login')
    }
})