<script setup lang="ts">
import { clearCachedApiFetch, useCachedApiFetch } from '~/composables/useCachedApiFetch'

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
  id: string | number
  name: string
  description?: string
  exercises: RoutineExercise[]
}

type Exercise = {
  id: string | number
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

const route = useRoute()
const routine = ref<Routine | null>(null)
const exerciseNamesById = ref<Record<string, string>>({})
const alternativesByExerciseId = ref<Record<string, Exercise>>({})
const alternativeErrorsByExerciseId = ref<Record<string, string>>({})
const loadingAlternativeIds = ref<string[]>([])
const requestedAlternativeIds = ref<string[]>([])
const savingAlternativeIds = ref<string[]>([])
const errorMessage = ref('')
const isLoading = ref(true)
const isDeleting = ref(false)
const isEditingRoutine = ref(false)
const isUpdatingRoutine = ref(false)
const routineEditState = reactive({
  name: '',
  description: ''
})

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

const isLoadingAlternative = (exerciseId: string | number) => {
  return loadingAlternativeIds.value.includes(String(exerciseId))
}

const hasRequestedAlternative = (exerciseId: string | number) => {
  return requestedAlternativeIds.value.includes(String(exerciseId))
}

const isSavingAlternative = (exerciseId: string | number) => {
  return savingAlternativeIds.value.includes(String(exerciseId))
}

const getAlternative = (exerciseId: string | number) => {
  return alternativesByExerciseId.value[String(exerciseId)]
}

const getAlternativeError = (exerciseId: string | number) => {
  return alternativeErrorsByExerciseId.value[String(exerciseId)]
}

const loadAlternative = async (exerciseId: string | number) => {
  const id = String(exerciseId)
  if (hasRequestedAlternative(id)) return

  requestedAlternativeIds.value = [...requestedAlternativeIds.value, id]
  loadingAlternativeIds.value = [...loadingAlternativeIds.value, id]
  alternativeErrorsByExerciseId.value = Object.fromEntries(
    Object.entries(alternativeErrorsByExerciseId.value).filter(([exerciseId]) => exerciseId !== id)
  )

  try {
    alternativesByExerciseId.value[id] = await useApiFetch<Exercise>(
      `/recommendations/alternative/${encodeURIComponent(id)}`,
      { method: 'GET' }
    )
  } catch (error: unknown) {
    const apiError = error as ApiError
    alternativeErrorsByExerciseId.value[id] = apiError.data?.error
      || apiError.data?.message
      || apiError.message
      || 'Failed to find an alternative exercise'
  } finally {
    loadingAlternativeIds.value = loadingAlternativeIds.value.filter(loadingId => loadingId !== id)
  }
}

const cancelAlternative = (exerciseId: string | number) => {
  const id = String(exerciseId)
  alternativesByExerciseId.value = Object.fromEntries(
    Object.entries(alternativesByExerciseId.value).filter(([exerciseId]) => exerciseId !== id)
  )
  alternativeErrorsByExerciseId.value = Object.fromEntries(
    Object.entries(alternativeErrorsByExerciseId.value).filter(([exerciseId]) => exerciseId !== id)
  )
  requestedAlternativeIds.value = requestedAlternativeIds.value.filter(requestedId => requestedId !== id)
}

const saveAlternative = async (exercise: RoutineExercise) => {
  if (!routine.value) return

  const id = String(exercise.exercise_id)
  const alternative = getAlternative(id)
  if (!alternative || isSavingAlternative(id)) return

  savingAlternativeIds.value = [...savingAlternativeIds.value, id]
  alternativeErrorsByExerciseId.value = Object.fromEntries(
    Object.entries(alternativeErrorsByExerciseId.value).filter(([exerciseId]) => exerciseId !== id)
  )

  try {
    const updatedExercises = routine.value.exercises.map(item => item === exercise
      ? { ...item, exercise_id: alternative.id }
      : item
    )
    await useApiFetch(`/routines/${encodeURIComponent(String(routine.value.id))}`, {
      method: 'PUT',
      body: {
        name: routine.value.name,
        description: routine.value.description ?? '',
        exercises: updatedExercises
      }
    })

    routine.value.exercises = updatedExercises
    exerciseNamesById.value[String(alternative.id)] = alternative.Exercise
    clearCachedApiFetch('/routines')
    cancelAlternative(id)
  } catch (error: unknown) {
    const apiError = error as ApiError
    alternativeErrorsByExerciseId.value[id] = apiError.data?.error
      || apiError.data?.message
      || apiError.message
      || 'Failed to update routine'
  } finally {
    savingAlternativeIds.value = savingAlternativeIds.value.filter(savingId => savingId !== id)
  }
}

const routineNameInput = useTemplateRef('routineNameInput')

const startEditingRoutine = () => {
  if (!routine.value || isEditingRoutine.value) return

  routineEditState.name = routine.value.name
  routineEditState.description = routine.value.description ?? ''
  errorMessage.value = ''
  isEditingRoutine.value = true

  nextTick(() => {
    routineNameInput.value?.inputRef?.focus()
  })
}

const cancelEditingRoutine = () => {
  if (!routine.value) return

  routineEditState.name = routine.value.name
  routineEditState.description = routine.value.description ?? ''
  errorMessage.value = ''
  isEditingRoutine.value = false
}

const updateRoutine = async () => {
  if (!routine.value || isUpdatingRoutine.value) return

  const name = routineEditState.name.trim()
  if (!name) {
    errorMessage.value = 'Routine name is required'
    return
  }

  isUpdatingRoutine.value = true
  errorMessage.value = ''

  try {
    await useApiFetch(`/routines/${encodeURIComponent(String(routine.value.id))}`, {
      method: 'PUT',
      body: {
        name,
        description: routineEditState.description,
        exercises: routine.value.exercises
      }
    })
    routine.value.name = name
    routine.value.description = routineEditState.description
    clearCachedApiFetch('/routines')
    isEditingRoutine.value = false
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value = apiError.data?.error
      || apiError.data?.message
      || apiError.message
      || 'Failed to update routine'
    console.error('Failed to update routine:', errorMessage.value)
  } finally {
    isUpdatingRoutine.value = false
  }
}

const deleteRoutine = async () => {
  if (!routine.value || isDeleting.value) return

  isDeleting.value = true
  errorMessage.value = ''

  try {
    await useApiFetch(`/routines/${encodeURIComponent(String(routine.value.id))}`, {
      method: 'DELETE'
    })
    clearCachedApiFetch('/routines')
    await navigateTo('/routines')
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value = apiError.data?.error
      || apiError.data?.message
      || apiError.message
      || 'Failed to delete routine'
    console.error('Failed to delete routine:', errorMessage.value)
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  try {
    const response = await useCachedApiFetch<Routine>(`/routines/${encodeURIComponent(String(route.params.id))}`)
    routine.value = response

    const exerciseIds = [...new Set(routine.value.exercises.map(exercise => exercise.exercise_id))]
    const exercises = await Promise.all(
      exerciseIds.map(id => useCachedApiFetch<Exercise>(`/exercises/${encodeURIComponent(String(id))}`))
    )

    exerciseNamesById.value = Object.fromEntries(
      exercises.map(exercise => [String(exercise.id), exercise.Exercise])
    )
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to fetch routine'
    console.error('Failed to fetch routine:', errorMessage.value)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <UContainer>
    <UPageHeader :ui="{ title: 'flex-1 min-w-0' }">
      <template #title>
        <UInput
          ref="routineNameInput"
          :model-value="isEditingRoutine ? routineEditState.name : (routine?.name ?? 'Routine Details')"
          :readonly="!isEditingRoutine"
          variant="none"
          class="w-full"
          :class="{ 'cursor-pointer': !isEditingRoutine }"
          :ui="{ base: 'w-full p-0 text-3xl sm:text-4xl text-pretty font-bold text-highlighted cursor-[inherit]' }"
          aria-label="Routine name"
          @update:model-value="(value) => (routineEditState.name = String(value))"
          @click="startEditingRoutine"
        />
      </template>
      <template #description>
        <UTextarea
          :model-value="isEditingRoutine ? routineEditState.description : (routine?.description ?? '')"
          :readonly="!isEditingRoutine"
          variant="none"
          autoresize
          :rows="1"
          class="w-full"
          :class="{ 'cursor-pointer': !isEditingRoutine }"
          :ui="{ base: 'w-full p-0 text-lg text-pretty text-muted resize-none cursor-[inherit]' }"
          aria-label="Routine description"
          @update:model-value="(value) => (routineEditState.description = String(value))"
          @click="startEditingRoutine"
        />
      </template>
      <template #links>
        <div class="flex flex-col gap-1.5">
          <UButton
            color="error"
            :loading="isDeleting"
            :disabled="!routine || isUpdatingRoutine"
            @click="deleteRoutine"
          >
            Delete Routine
          </UButton>
          <UButton
            v-if="isEditingRoutine"
            :loading="isUpdatingRoutine"
            @click="updateRoutine"
          >
            Update
          </UButton>
          <UButton
            v-if="isEditingRoutine"
            color="neutral"
            variant="outline"
            :disabled="isUpdatingRoutine"
            @click="cancelEditingRoutine"
          >
            Cancel
          </UButton>
        </div>
      </template>
    </UPageHeader>
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
        Loading routine...
      </p>
      <UCard v-else-if="routine">
        <div class="space-y-4">
          <div
            v-for="exercise in sortedExercises(routine.exercises)"
            :key="exercise.exercise_id"
            class="rounded-lg bg-elevated p-4"
          >
            <div class="flex items-center justify-between gap-4">
              <h2 class="font-medium">
                {{ getExerciseName(exercise.exercise_id) }}
              </h2>
              <UButton
                v-if="!hasRequestedAlternative(exercise.exercise_id)"
                size="sm"
                variant="outline"
                @click="loadAlternative(exercise.exercise_id)"
              >
                Alternative
              </UButton>
            </div>
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
            <p
              v-if="getAlternativeError(exercise.exercise_id)"
              class="mt-3 text-sm text-error"
              role="alert"
            >
              {{ getAlternativeError(exercise.exercise_id) }}
            </p>
            <div
              v-if="hasRequestedAlternative(exercise.exercise_id)"
              class="mt-3 rounded-lg border border-default p-3"
            >
              <template v-if="getAlternative(exercise.exercise_id)">
                <p class="text-sm text-muted">
                  Alternative
                </p>
                <h3 class="font-medium">
                  {{ getAlternative(exercise.exercise_id)?.Exercise }}
                </h3>
                <p class="mt-1 text-sm text-muted">
                  {{ getAlternative(exercise.exercise_id)?.PrimaryMuscles }} · {{ getAlternative(exercise.exercise_id)?.Type }}
                </p>
              </template>
              <p
                v-else-if="isLoadingAlternative(exercise.exercise_id)"
                class="text-sm text-muted"
              >
                Finding an alternative...
              </p>
              <div class="mt-3 flex gap-2">
                <UButton
                  v-if="getAlternative(exercise.exercise_id)"
                  size="sm"
                  :loading="isSavingAlternative(exercise.exercise_id)"
                  @click="saveAlternative(exercise)"
                >
                  Save
                </UButton>
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  :disabled="isSavingAlternative(exercise.exercise_id)"
                  @click="cancelAlternative(exercise.exercise_id)"
                >
                  Cancel
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </UPageSection>
  </UContainer>
</template>
