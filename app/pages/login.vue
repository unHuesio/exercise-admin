<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'
import auth from '~/middleware/auth';

const authStore = useAuthStore();

const schema = v.pipe(
  v.object({
    email: v.pipe(v.string(), v.email('Invalid email')),
    password: v.pipe(v.string(), v.minLength(8, 'Must be at least 8 characters')),
  })
)

type Schema = v.InferOutput<typeof schema>

const state = reactive({
  email: '',
  password: '',
})

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  event.preventDefault()
  const result = v.safeParse(schema, state)
  if (result.success) {
    // Here you would typically send the data to your backend API
    try {
        const response = await useApiFetch<{ token: string }>('/login', {
            method: 'POST',
            body: result.output,
        })
        console.log('Login successful')
        sessionStorage.setItem('authToken', response?.token || '')
        authStore.initialize()
        // redirect to home page or dashboard
        navigateTo('/')
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Login failed'
        console.error('Login failed:', message)
    }
    } else {
    console.error('Validation errors:', result.issues)
    // You can also display these errors to the user
  }
}
</script>
<template>
    <UContainer>
        <UPageHeader
        title="Login"
        description="Log in to your account to get started with our awesome app."
      />
        <UPageSection>
            <UForm class="max-w-md mx-auto space-y-6" :schema="schema" :state="state" @submit="handleSubmit">
                <UFormField label="Email" name="email">
                    <UInput v-model="state.email" type="email" placeholder="Enter your email" />
                </UFormField>
                <UFormField label="Password" name="password">
                    <UInput v-model="state.password" type="password" placeholder="Enter your password" />
                </UFormField>
                <UButton type="submit" color="primary" class="w-full">Login</UButton>
            </UForm>
        </UPageSection>
    </UContainer>
</template>