<script setup>
import { useAuthStore } from '~/stores/auth'

const route = useRoute()

const authStore = useAuthStore()

onMounted(() => {
  void authStore.initialize()
})

function logout() {
  authStore.logout()
  navigateTo('/login')
}

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Nuxt Starter Template'
const description = 'A production-ready starter template powered by Nuxt UI. Build beautiful, accessible, and performant applications in minutes, not hours.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})

const items = computed(() => {
  const baseItems = [
    {
      label: 'Exercises',
      to: '/exercise',
      active: route.path.startsWith('/exercise')
    }
  ]

  if (authStore.isAdmin) {
    baseItems.push(
      {
        label: 'Permissions',
        to: '/permissions',
        active: route.path.startsWith('/permissions')
      },
      {
        label: 'Applications',
        to: '/applications',
        active: route.path.startsWith('/applications')
      }
    )
  }
  return baseItems
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          Gym Admin
        </NuxtLink>
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <UButton
          to="/register"
          icon="i-lucide-user-plus"
          aria-label="Register a new account"
          color="neutral"
          variant="ghost"
        >
          Register
        </UButton>

        <UButton
          v-if="!authStore.isLoggedIn"
          to="/login"
          icon="i-lucide-monitor"
          aria-label="Log in to dashboard"
          color="neutral"
          variant="ghost"
        >
          Login
        </UButton>
        <UButton
          v-else
          icon="i-lucide-log-out"
          aria-label="Log out"
          color="neutral"
          variant="ghost"
          @click="logout"
        >
          Logout
        </UButton>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator icon="i-simple-icons-nuxtdotjs" />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Built with Nuxt UI • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          to="https://github.com/nuxt-ui-templates/starter"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
