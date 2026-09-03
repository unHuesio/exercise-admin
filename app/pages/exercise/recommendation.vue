<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: 'auth'
})

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

type RecommendationExercise = {
  id?: number | string
  name: string
  sets: number | string
  reps: number | string
  restTime?: number | string
  rest_time?: number | string
  restingTime?: number | string
}

type RecommendationRoutine = {
  name?: string
  description?: string
  exercises?: RecommendationExercise[]
}

type ExerciseSetRow = {
  set: number
  reps: number | string
  restTime: number | string
}

const recommendationSchema = v.object({
  goal: v.pipe(v.string(), v.minLength(1, 'Goal is required')),
  focus: v.pipe(v.string(), v.minLength(1, 'Focus is required')),
  avoidMuscles: v.array(v.string())
})

type RecommendationSchema = v.InferOutput<typeof recommendationSchema>

const isSubmittingRecommendation = ref(false)
const recommendation = ref<RecommendationRoutine | null>(null)
const recommendationError = ref('')
const recommendationState = reactive({
  goal: '',
  focus: '',
  avoidMuscles: [] as string[]
})

const getRestTime = (exercise: RecommendationExercise) => {
  return exercise.restTime ?? exercise.rest_time ?? exercise.restingTime ?? 'Not specified'
}

const getSetRows = (exercise: RecommendationExercise): ExerciseSetRow[] => {
  const setCount = Number(exercise.sets) || 0
  const restTime = getRestTime(exercise)

  return Array.from({ length: setCount }, (_, index) => ({
    set: index + 1,
    reps: exercise.reps,
    restTime
  }))
}

const recommendedExercises = computed(() => recommendation.value?.exercises ?? [])

const handleRecommendationSubmit = async (event: FormSubmitEvent<RecommendationSchema>) => {
  event.preventDefault()
  const result = v.safeParse(recommendationSchema, recommendationState)

  if (!result.success) {
    console.error('Recommendation validation errors:', result.issues)
    return
  }

  isSubmittingRecommendation.value = true
  recommendationError.value = ''

  try {
    recommendation.value = await useApiFetch<RecommendationRoutine>('/recommendations/routine', {
      method: 'POST',
      body: result.output
    })
  } catch (error: unknown) {
    const apiError = error as ApiError
    recommendationError.value = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to get a routine recommendation'
    console.error('Failed to get routine recommendation:', recommendationError.value)
  } finally {
    isSubmittingRecommendation.value = false
  }
}
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Routine Recommendation"
      description="Tell us your training preferences to generate a recommended routine."
    />
    <UPageSection>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Routine Preferences
            </h2>
          </template>

          <UForm
            class="space-y-6"
            :schema="recommendationSchema"
            :state="recommendationState"
            @submit="handleRecommendationSubmit"
          >
            <UFormField
              label="Goal"
              name="goal"
            >
              <UInput
                v-model="recommendationState.goal"
                placeholder="e.g. powerlifting"
              />
            </UFormField>
            <UFormField
              label="Focus"
              name="focus"
            >
              <UInput
                v-model="recommendationState.focus"
                placeholder="e.g. Bicep"
              />
            </UFormField>
            <UFormField
              label="Muscles to Avoid"
              name="avoidMuscles"
              hint="Press Enter after each muscle."
            >
              <UInputTags
                v-model="recommendationState.avoidMuscles"
                placeholder="e.g. Lower Back"
              />
            </UFormField>
            <p
              v-if="recommendationError"
              class="text-sm text-error"
              role="alert"
            >
              {{ recommendationError }}
            </p>
            <UButton
              type="submit"
              color="primary"
              class="w-full"
              :loading="isSubmittingRecommendation"
            >
              Generate Recommendation
            </UButton>
          </UForm>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Recommended Routine
            </h2>
          </template>

          <div
            v-if="recommendation"
            class="space-y-6"
          >
            <div>
              <h3
                v-if="recommendation.name"
                class="font-medium"
              >
                {{ recommendation.name }}
              </h3>
              <p
                v-if="recommendation.description"
                class="mt-1 text-sm text-muted"
              >
                {{ recommendation.description }}
              </p>
            </div>

            <div
              v-for="(exercise, index) in recommendedExercises"
              :key="exercise.id ?? index"
              class="rounded-lg bg-elevated p-4"
            >
              <h4 class="font-medium">
                {{ exercise.name }}
              </h4>
              <table class="mt-2 w-full text-left text-sm">
                <thead>
                  <tr class="text-muted">
                    <th class="pb-1 pr-4 font-medium">
                      Set
                    </th>
                    <th class="pb-1 pr-4 font-medium">
                      Reps
                    </th>
                    <th class="pb-1 font-medium">
                      Rest Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in getSetRows(exercise)"
                    :key="row.set"
                  >
                    <td class="py-1 pr-4">
                      {{ row.set }}
                    </td>
                    <td class="py-1 pr-4">
                      {{ row.reps }}
                    </td>
                    <td class="py-1">
                      {{ row.restTime }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p
            v-else
            class="text-sm text-muted"
          >
            Submit your preferences to see a recommended routine.
          </p>
        </UCard>
      </div>
    </UPageSection>
  </UContainer>
</template>
