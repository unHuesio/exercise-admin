<script setup lang="ts">
import { useCachedApiFetch } from '~/composables/useCachedApiFetch'

definePageMeta({
  middleware: 'auth'
})

type RoutineSet = {
  reps?: number
  rest?: number | string
}

type RoutineExercise = {
  exercise_id: string | number
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
  id: string | number
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
const page = ref(1)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const getExerciseName = (exerciseId: string | number) => {
  return exerciseNamesById.value[String(exerciseId)] ?? 'Exercise unavailable'
}

const sortedExercises = (exercises: RoutineExercise[]) => {
  return [...exercises].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

const formatRestTime = (val: number | string | undefined): string => {
  if (val === undefined || val === null || val === '') return 'Not specified'
  if (typeof val === 'number') return `${val}s`
  return String(val)
}

const loadExerciseNames = async (newRoutines: Routine[]) => {
  const exerciseIds = [...new Set(
    newRoutines
      .flatMap(routine => routine.exercises.map(exercise => exercise.exercise_id))
      .filter(id => !exerciseNamesById.value[String(id)])
  )]
  const exercises = await Promise.all(
    exerciseIds.map(id => useCachedApiFetch<Exercise>(`/exercises/${encodeURIComponent(String(id))}`))
  )

  Object.assign(
    exerciseNamesById.value,
    Object.fromEntries(exercises.map(exercise => [String(exercise.id), exercise.Exercise]))
  )
}

const loadMoreRoutines = async () => {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true

  try {
    const response = await useCachedApiFetch<Routine[]>(`/routines?page=${page.value}`)
    const newRoutines = Array.isArray(response) ? response : []

    await loadExerciseNames(newRoutines)
    routines.value = [...routines.value, ...newRoutines]

    if (newRoutines.length === 0) {
      hasMore.value = false
    } else {
      page.value += 1
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to fetch routines'
    console.error('Failed to fetch routines:', errorMessage.value)
    hasMore.value = false
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

onMounted(() => {
  void loadMoreRoutines()

  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      void loadMoreRoutines()
    }
  })

  if (sentinel.value) {
    observer.observe(sentinel.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
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
        <NuxtLink
          v-for="routine in routines"
          :key="routine.id"
          :to="`/routines/${encodeURIComponent(routine.id)}`"
          class="block"
        >
          <UCard class="h-full transition hover:ring-2 hover:ring-primary">
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
                      <td class="py-1">
                        {{ formatRestTime(set.rest) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>
      <div
        ref="sentinel"
        class="h-1"
      />
      <p
        v-if="isLoadingMore && !isLoading"
        class="my-4 text-center text-muted"
      >
        Loading more routines...
      </p>
    </UPageSection>
  </UContainer>
</template>
