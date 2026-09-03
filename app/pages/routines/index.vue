<script setup lang="ts">
import { useCachedApiFetch } from '~/composables/useCachedApiFetch'

definePageMeta({
  middleware: 'auth'
})

type RoutineSet = {
  reps?: number
  weight?: number
  rest?: number
}

type RoutineExercise = {
  exercise_id: string
  sets: RoutineSet[]
  order?: number
}

type Routine = {
  id: string
  name: string
  description?: string
  exercises: RoutineExercise[]
}

type Exercise = {
  id: string
  Exercise: string
}

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

const routines = ref<Routine[]>([])
const exerciseNamesById = ref<Record<string, string>>({})
const errorMessage = ref('')
const isLoading = ref(true)

const getExerciseName = (exerciseId: string) => {
  return exerciseNamesById.value[exerciseId] ?? exerciseId
}

const sortedExercises = (exercises: RoutineExercise[]) => {
  return [...exercises].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

onMounted(async () => {
  try {
    const [routinesResponse, exercisesResponse] = await Promise.all([
      useCachedApiFetch<Routine[]>('/routines'),
      useCachedApiFetch<Exercise[]>('/exercises')
    ])

    routines.value = Array.isArray(routinesResponse) ? routinesResponse : []
    exerciseNamesById.value = Object.fromEntries(
      (Array.isArray(exercisesResponse) ? exercisesResponse : []).map(exercise => [exercise.id, exercise.Exercise])
    )
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to fetch routines'
    console.error('Failed to fetch routines:', errorMessage.value)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Routines"
      description="Browse your training routines."
    />
    <UPageSection>
      <p
        v-if="errorMessage"
        class="text-sm text-error"
        role="alert"
      >
        {{ errorMessage }}
      </p>
      <p
        v-else-if="isLoading"
        class="text-center text-muted"
      >
        Loading routines...
      </p>
      <div
        v-else-if="routines.length === 0"
        class="text-center text-muted"
      >
        No routines found.
      </div>
      <div
        v-else
        class="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <UCard
          v-for="routine in routines"
          :key="routine.id"
        >
          <template #header>
            <div>
              <h2 class="text-lg font-semibold">
                {{ routine.name }}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ routine.description }}
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div
              v-for="exercise in sortedExercises(routine.exercises)"
              :key="exercise.exercise_id"
              class="rounded-lg bg-elevated p-4"
            >
              <h3 class="font-medium">
                {{ getExerciseName(exercise.exercise_id) }}
              </h3>
              <table class="mt-2 w-full text-left text-sm">
                <thead>
                  <tr class="text-muted">
                    <th class="pb-1 pr-4 font-medium">
                      Set
                    </th>
                    <th class="pb-1 pr-4 font-medium">
                      Reps
                    </th>
                    <th class="pb-1 pr-4 font-medium">
                      Weight
                    </th>
                    <th class="pb-1 font-medium">
                      Rest Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(set, index) in exercise.sets"
                    :key="index"
                  >
                    <td class="py-1 pr-4">
                      {{ index + 1 }}
                    </td>
                    <td class="py-1 pr-4">
                      {{ set.reps ?? 'Not specified' }}
                    </td>
                    <td class="py-1 pr-4">
                      {{ set.weight ?? 'Not specified' }}
                    </td>
                    <td class="py-1">
                      {{ set.rest ?? 'Not specified' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </UCard>
      </div>
    </UPageSection>
  </UContainer>
</template>
