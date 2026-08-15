<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: ['auth', 'admin']
})

const schema = v.pipe(
  v.object({
    user: v.pipe(
      v.string(),
      v.email('Invalid email'),
      v.minLength(1, 'User is required')
    ),
    role: v.pipe(
      v.string(),
      v.values(['admin', 'app_client'], 'Only admin or app_client are allowed'),
      v.minLength(1, 'Role is required')
    )
  })
)

type Schema = v.InferOutput<typeof schema>

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

const state = reactive({
  user: '',
  role: ''
})

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  event.preventDefault()
  const result = v.safeParse(schema, state)

  if (result.success) {
    try {
      await useApiFetch('/permissions/groups', {
        method: 'POST',
        body: result.output
      })
      navigateTo('/permissions')
    } catch (error: unknown) {
      const apiError = error as ApiError
      const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to create group role'
      console.error('Failed to create group role:', message)
    }
    return
  }

  console.error('Validation errors:', result.issues)
}
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Create Group Role"
    />
    <UPageSection>
      <UForm
        class="max-w-md mx-auto space-y-6"
        :schema="schema"
        :state="state"
        @submit="handleSubmit"
      >
        <UFormField
          label="User"
          name="user"
        >
          <UInput
            v-model="state.user"
            type="text"
            placeholder="Enter user email"
          />
        </UFormField>
        <UFormField
          label="Role"
          name="role"
        >
          <UInput
            v-model="state.role"
            type="text"
            placeholder="Enter role"
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
