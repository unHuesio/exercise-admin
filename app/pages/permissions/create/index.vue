<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: ['auth', 'admin']
})

const schema = v.pipe(
  v.object({
    object: v.pipe(
      v.string(),
      v.values(['exercises', 'permissions', 'recommendations'], 'Only exercises, permissions, or recommendations are allowed'),
      v.minLength(1, 'Object is required')
    ),
    subject: v.pipe(
      v.string(),
      v.values(['admin', 'app_client'], 'Only admin or app_client are allowed'),
      v.minLength(1, 'Subject is required')
    ),
    action: v.pipe(
      v.string(),
      v.values(['create', 'read', 'update', 'delete'], 'Only create, read, update, or delete are allowed'),
      v.minLength(1, 'Action is required')
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
  subject: '',
  action: '',
  object: ''
})

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  event.preventDefault()
  const result = v.safeParse(schema, state)

  if (result.success) {
    try {
      await useApiFetch('/permissions', {
        method: 'POST',
        body: result.output
      })
      navigateTo('/permissions')
    } catch (error: unknown) {
      const apiError = error as ApiError
      const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to create permission'
      console.error('Failed to create permission:', message)
    }
    return
  }

  console.error('Validation errors:', result.issues)
}
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Create Permission"
    />
    <UPageSection>
      <UForm
        class="max-w-md mx-auto space-y-6"
        :schema="schema"
        :state="state"
        @submit="handleSubmit"
      >
        <UFormField
          label="Object"
          name="object"
        >
          <UInput
            v-model="state.object"
            type="text"
            placeholder="Enter object"
          />
        </UFormField>
        <UFormField
          label="Subject"
          name="subject"
        >
          <UInput
            v-model="state.subject"
            type="text"
            placeholder="Enter subject"
          />
        </UFormField>
        <UFormField
          label="Action"
          name="action"
        >
          <UInput
            v-model="state.action"
            type="text"
            placeholder="Enter action"
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
