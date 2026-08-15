<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useGoogleIdToken } from '~/composables/useGoogleIdToken'
import { clearCachedApiFetch } from '~/composables/useCachedApiFetch'

const authStore = useAuthStore()
const googleButton = ref<HTMLElement | null>(null)
const errorMessage = ref('')
const isLoading = ref(false)

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

const { renderGoogleButton } = useGoogleIdToken()

const handleGoogleLogin = async (idToken: string) => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await useApiFetch<{ token: string }>('/login', {
      method: 'POST',
      body: { id_token: idToken }
    })

    if (!response?.token) {
      throw new Error('Login succeeded but token was not returned')
    }

    clearCachedApiFetch()
    sessionStorage.setItem('authToken', response.token)
    await authStore.initialize()
    navigateTo('/')
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value = apiError.data?.error || apiError.data?.message || apiError.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!googleButton.value) return

  try {
    await renderGoogleButton(googleButton.value, handleGoogleLogin, 'signin_with')
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value = apiError.message || 'Failed to load Google sign-in'
  }
})
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Sign in with Google"
      description="Use your Google account to get a backend-issued JWT."
    />
    <UPageSection>
      <div class="max-w-md mx-auto space-y-4">
        <p class="text-sm text-muted">
          This app uses Google Sign-In only. No password form is used here.
        </p>
        <div
          ref="googleButton"
          class="flex justify-center"
        />
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="soft"
          title="Login failed"
          :description="errorMessage"
        />
        <p
          v-if="isLoading"
          class="text-center text-sm text-muted"
        >
          Signing you in...
        </p>
      </div>
    </UPageSection>
  </UContainer>
</template>
