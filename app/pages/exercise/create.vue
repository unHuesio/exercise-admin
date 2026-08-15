<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: ['auth', 'admin']
})

const schema = v.pipe(
  v.object({
    exercise: v.pipe(v.string(), v.minLength(1, 'Exercise name is required')),
    primaryMuscles: v.pipe(v.string(), v.minLength(1, 'Primary muscles are required')),
    secondaryMuscles: v.optional(v.string()),
    type: v.pipe(v.string(), v.minLength(1, 'Type is required')),
    focus: v.pipe(v.string(), v.minLength(1, 'Focus is required'))
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
  exercise: '',
  primaryMuscles: '',
  secondaryMuscles: '',
  type: '',
  focus: ''
})

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  event.preventDefault()
  const result = v.safeParse(schema, state)

  if (result.success) {
    try {
      await useApiFetch('/exercises', {
        method: 'POST',
        body: result.output
      })
      navigateTo('/exercise')
    } catch (error: unknown) {
      const apiError = error as ApiError
      const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to create exercise'
      console.error('Failed to create exercise:', message)
    }
    return
  }

  console.error('Validation errors:', result.issues)
}
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Create Exercise"
    />
    <UPageSection>
      <UForm
        class="max-w-md mx-auto space-y-6"
        :schema="schema"
        :state="state"
        @submit="handleSubmit"
      >
        <UFormField
          label="Exercise Name"
          name="exercise"
        >
          <UInput
            v-model="state.exercise"
            type="text"
            placeholder="Enter exercise name"
          />
        </UFormField>
        <UFormField
          label="Primary Muscles"
          name="primaryMuscles"
        >
          <UTextarea
            v-model="state.primaryMuscles"
            placeholder="Enter primary muscles"
          />
        </UFormField>
        <UFormField
          label="Secondary Muscles"
          name="secondaryMuscles"
        >
          <UTextarea
            v-model="state.secondaryMuscles"
            placeholder="Enter secondary muscles"
          />
        </UFormField>
        <UFormField
          label="Type"
          name="type"
        >
          <UInput
            v-model="state.type"
            type="text"
            placeholder="Enter exercise type"
          />
        </UFormField>
        <UFormField
          label="Focus"
          name="focus"
        >
          <UInput
            v-model="state.focus"
            type="text"
            placeholder="Enter exercise focus"
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
