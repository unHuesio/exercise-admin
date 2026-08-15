<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: ['auth', 'admin']
})

const schema = v.pipe(
  v.object({
    name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
    email: v.pipe(v.string(), v.minLength(1, 'Email is required'))
  })
)

type Schema = v.InferOutput<typeof schema>

const state = reactive({
  name: '',
  email: ''
})

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  event.preventDefault()
  const result = v.safeParse(schema, state)
  console.log('Form data:', state)
  if (result.success) {
    console.log('Form data is valid:', result.output)
    try {
      await useApiFetch(`/applications`, {
        method: 'POST',
        body: result.output
      })
      console.log('Application created successfully')
      navigateTo('/applications')
    } catch (error: unknown) {
      const apiError = error as ApiError
      const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to create application'
      console.error('Failed to create application:', message)
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
      title="Register Application"
    />
    <UPageSection>
      <UForm
        class="max-w-md mx-auto space-y-6"
        :schema="schema"
        :state="state"
        @submit="handleSubmit"
      >
        <UFormField
          label="Name"
          name="name"
        >
          <UInput
            v-model="state.name"
            type="text"
            placeholder="Enter name"
          />
        </UFormField>
        <UFormField
          label="Email"
          name="email"
        >
          <UInput
            v-model="state.email"
            type="email"
            placeholder="Enter email"
          />
        </UFormField>
        <UButton
          type="submit"
          color="primary"
          class="w-full"
        >
          Save Changes
        </UButton>
      </UForm>
    </UPageSection>
  </UContainer>
</template>
