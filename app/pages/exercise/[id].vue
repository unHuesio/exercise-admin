<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: ['auth', 'admin']
})

type Exercise = {
  id: number
  Exercise: string
  PrimaryMuscles: string
  SecondaryMuscles: string
  Type: string
  Focus: string
}

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

const exercise = ref<Exercise | null>(null)

const schema = v.pipe(
  v.object({
    exercise: v.string(),
    primaryMuscles: v.string(),
    secondaryMuscles: v.optional(v.string()),
    type: v.string(),
    focus: v.string()
  })
)

type Schema = v.InferOutput<typeof schema>

const state = reactive({
  exercise: '',
  primaryMuscles: '',
  secondaryMuscles: '',
  type: '',
  focus: ''
})

const loadExercise = async () => {
  const id = useRoute().params.id

  try {
    const response = await useApiFetch(`/exercises/${id}`, {
      method: 'GET'
    })

    exercise.value = response as Exercise

    if (exercise.value) {
      state.exercise = exercise.value.Exercise
      state.primaryMuscles = exercise.value.PrimaryMuscles
      state.secondaryMuscles = exercise.value.SecondaryMuscles
      state.type = exercise.value.Type
      state.focus = exercise.value.Focus
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to fetch exercise'
    console.error('Failed to fetch exercise:', message)
  }
}

const handleDelete = async () => {
  const id = useRoute().params.id

  try {
    await useApiFetch(`/exercises/${id}`, {
      method: 'DELETE'
    })
    navigateTo('/exercise')
  } catch (error: unknown) {
    const apiError = error as ApiError
    const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to delete exercise'
    console.error('Failed to delete exercise:', message)
  }
}

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
  event.preventDefault()
  const result = v.safeParse(schema, state)

  if (result.success) {
    const id = useRoute().params.id

    try {
      await useApiFetch(`/exercises/${id}`, {
        method: 'PUT',
        body: result.output
      })
      navigateTo('/exercise')
    } catch (error: unknown) {
      const apiError = error as ApiError
      const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to update exercise'
      console.error('Failed to update exercise:', message)
    }
    return
  }

  console.error('Validation errors:', result.issues)
}

onMounted(loadExercise)
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Exercise Details"
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
        <UButton
          type="button"
          color="error"
          class="w-full"
          @click="handleDelete"
        >
          Delete Exercise
        </UButton>
      </UForm>
    </UPageSection>
  </UContainer>
</template>
