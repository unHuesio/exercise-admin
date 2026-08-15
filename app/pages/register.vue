<script setup lang="ts">
import { useGoogleIdToken } from '~/composables/useGoogleIdToken'

const googleButton = ref<HTMLElement | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

const { renderGoogleButton } = useGoogleIdToken()

const handleGoogleRegister = async (idToken: string) => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await useApiFetch<{ message?: string }>('/register', {
      method: 'POST',
      body: { id_token: idToken }
    })

    successMessage.value = response?.message || 'Google user registered successfully'
    navigateTo('/login')
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value = apiError.data?.error || apiError.data?.message || apiError.message || 'Registration failed'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!googleButton.value) return

  try {
    await renderGoogleButton(googleButton.value, handleGoogleRegister, 'signup_with')
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value = apiError.message || 'Failed to load Google sign-up'
  }
})
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Register"
      description="Create your account with Google."
    />
    <UPageSection>
      <div class="max-w-md mx-auto space-y-4">
        <p class="text-sm text-muted">
          Register by sharing your Google ID token with the backend.
        </p>
        <div
          ref="googleButton"
          class="flex justify-center"
        />
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="soft"
          title="Registration failed"
          :description="errorMessage"
        />
        <UAlert
          v-if="successMessage"
          color="success"
          variant="soft"
          title="Registered"
          :description="successMessage"
        />
        <p
          v-if="isLoading"
          class="text-center text-sm text-muted"
        >
          Creating your account...
        </p>
      </div>
    </UPageSection>
  </UContainer>
</template>
