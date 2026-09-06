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

type RecommendationSet = {
  reps?: number | string
  rest?: number | string
  restTime?: number | string
  rest_time?: number | string
  weight?: number | string
}

type RecommendationExercise = {
  id?: number | string
  name?: string
  Exercise?: string
  sets?: RecommendationSet[] | number | string
  reps?: number | string
  restTime?: number | string
  rest_time?: number | string
  restingTime?: number | string
}

type RecommendationRoutine = {
  id?: string
  name?: string
  description?: string
  exercises?: RecommendationExercise[]
}

type Exercise = {
  Focus: string
}

type ExerciseSetRow = {
  set: number
  reps: number | string
  restTime: number | string
}

const recommendationSchema = v.object({
  goal: v.pipe(
    v.string(),
    v.check(goal => goal === 'strength' || goal === 'powerlifting', 'Select a training goal')
  ),
  focus: v.pipe(v.string(), v.minLength(1, 'Focus is required')),
  avoidMuscles: v.array(v.string())
})

type RecommendationSchema = v.InferOutput<typeof recommendationSchema>

const isSubmittingRecommendation = ref(false)
const recommendation = ref<RecommendationRoutine | null>(null)
const recommendationError = ref('')
const focusOptions = ref<string[]>([])
const focusOptionsError = ref('')
const isLoadingFocusOptions = ref(true)
const recommendationState = reactive({
  goal: '',
  focus: '',
  avoidMuscles: [] as string[]
})

const formatRestTime = (val: number | string | undefined): string => {
  if (val === undefined || val === null || val === '') return 'Not specified'
  if (typeof val === 'number') return `${val}s`
  return String(val)
}

const getRestTime = (exercise: RecommendationExercise) => {
  return exercise.restTime ?? exercise.rest_time ?? exercise.restingTime
}

const MAX_RECOMMENDATION_SETS = 50

const getSetRows = (exercise: RecommendationExercise): ExerciseSetRow[] => {
  if (Array.isArray(exercise.sets)) {
    return exercise.sets.slice(0, MAX_RECOMMENDATION_SETS).map((setObj, index) => {
      const reps = setObj.reps ?? exercise.reps ?? 'Not specified'
      const rawRest = setObj.rest ?? setObj.restTime ?? setObj.rest_time ?? getRestTime(exercise)
      return {
        set: index + 1,
        reps,
        restTime: formatRestTime(rawRest)
      }
    })
  }

  const setCount = typeof exercise.sets === 'number' ? exercise.sets : Number(exercise.sets)
  if (!isNaN(setCount) && setCount > 0) {
    const safeSetCount = Math.min(Math.floor(setCount), MAX_RECOMMENDATION_SETS)
    const reps = exercise.reps ?? 'Not specified'
    const rawRest = getRestTime(exercise)
    return Array.from({ length: safeSetCount }, (_, index) => ({
      set: index + 1,
      reps,
      restTime: formatRestTime(rawRest)
    }))
  }

  return []
}

const getExerciseName = (exercise: RecommendationExercise) => {
  return exercise.name || exercise.Exercise || 'Unnamed Exercise'
}

const recommendedExercises = computed(() => recommendation.value?.exercises ?? [])

const loadFocusOptions = async () => {
  const exercises: Exercise[] = []
  let page = 1

  try {
    while (true) {
      const response = await useCachedApiFetch<Exercise[]>(`/exercises?page=${page}&limit=100`)
      const exercisePage = Array.isArray(response) ? response : []
      exercises.push(...exercisePage)

      if (exercisePage.length < 100) break
      page += 1
    }

    focusOptions.value = [...new Set(
      exercises
        .map(exercise => exercise.Focus.trim())
        .filter(Boolean)
    )].sort()
  } catch (error: unknown) {
    const apiError = error as ApiError
    focusOptionsError.value = apiError.data?.error
      || apiError.data?.message
      || apiError.message
      || 'Failed to load focus options'
    console.error('Failed to load focus options:', focusOptionsError.value)
  } finally {
    isLoadingFocusOptions.value = false
  }
}

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

onMounted(() => {
  void loadFocusOptions()
})
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
              <div
                class="flex gap-2"
                role="radiogroup"
                aria-label="Training goal"
              >
                <UButton
                  type="button"
                  :color="recommendationState.goal === 'strength' ? 'primary' : 'neutral'"
                  :variant="recommendationState.goal === 'strength' ? 'solid' : 'outline'"
                  :aria-checked="recommendationState.goal === 'strength'"
                  role="radio"
                  @click="recommendationState.goal = 'strength'"
                >
                  Strength
                </UButton>
                <UButton
                  type="button"
                  :color="recommendationState.goal === 'powerlifting' ? 'primary' : 'neutral'"
                  :variant="recommendationState.goal === 'powerlifting' ? 'solid' : 'outline'"
                  :aria-checked="recommendationState.goal === 'powerlifting'"
                  role="radio"
                  @click="recommendationState.goal = 'powerlifting'"
                >
                  Powerlifting
                </UButton>
              </div>
            </UFormField>
            <UFormField
              label="Focus"
              name="focus"
            >
              <div
                v-if="focusOptions.length > 0"
                class="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Muscle focus"
              >
                <UButton
                  v-for="focus in focusOptions"
                  :key="focus"
                  type="button"
                  :color="recommendationState.focus === focus ? 'primary' : 'neutral'"
                  :variant="recommendationState.focus === focus ? 'solid' : 'outline'"
                  :aria-checked="recommendationState.focus === focus"
                  role="radio"
                  @click="recommendationState.focus = focus"
                >
                  {{ focus }}
                </UButton>
              </div>
              <p
                v-else-if="isLoadingFocusOptions"
                class="text-sm text-muted"
              >
                Loading focus options...
              </p>
              <p
                v-else
                class="text-sm text-error"
                role="alert"
              >
                {{ focusOptionsError }}
              </p>
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
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-lg font-semibold">
                Recommended Routine
              </h2>
              <UButton
                v-if="recommendation?.id"
                :to="`/routines/${encodeURIComponent(recommendation.id)}`"
                size="sm"
                variant="outline"
              >
                Edit
              </UButton>
            </div>
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
                {{ getExerciseName(exercise) }}
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
