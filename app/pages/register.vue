<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

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
        const response = await useApiFetch('/register', {
            method: 'POST',
            body: result.output,
        })
        console.log('Registration successful')
        // redirect to login page
        navigateTo('/login')
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Registration failed'
        console.error('Registration failed:', message)
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
        title="Register"
        description="Create your account to get started with our awesome app."
      />
        <UPageSection>
            <UForm class="max-w-md mx-auto space-y-6" :schema="schema" :state="state" @submit="handleSubmit">
                <UFormField label="Email" name="email">
                    <UInput v-model="state.email" type="email" placeholder="Enter your email" />
                </UFormField>
                <UFormField label="Password" name="password">
                    <UInput v-model="state.password" type="password" placeholder="Enter your password" />
                </UFormField>
                <UButton type="submit" color="primary" class="w-full">Register</UButton>
            </UForm>
        </UPageSection>
    </UContainer>
</template>