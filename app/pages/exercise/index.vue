<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useCachedApiFetch } from '~/composables/useCachedApiFetch'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()

const exercises = ref<Excercise[]>([])
const page = ref(1)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

type Excercise = {
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

const loadMoreExercises = async () => {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true

  try {
    const response = await useCachedApiFetch(`/exercises?page=${page.value}`)
    const newExercises = Array.isArray(response) ? response : []

    exercises.value = [...exercises.value, ...newExercises]

    if (newExercises.length === 0) {
      hasMore.value = false
    } else {
      page.value += 1
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to fetch exercises'
    console.error('Failed to fetch exercises:', message)
    hasMore.value = false
  } finally {
    isLoadingMore.value = false
  }
}

onMounted(() => {
  void loadMoreExercises()

  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      void loadMoreExercises()
    }
  })

  if (sentinel.value) {
    observer.observe(sentinel.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})

const goToDetails = (id: number) => {
  navigateTo(`/exercise/${id}`)
}

const goToCreate = () => {
  void navigateTo('/exercise/create')
}
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Exercises"
      description="Browse and manage your exercises."
    />
    <div class="my-4 flex flex-wrap items-center gap-2">
      <UButton
        v-if="authStore.isAdmin"
        color="primary"
        @click="goToCreate"
      >
        Create New Exercise
      </UButton>
      <UButton
        to="/exercise/recommendation"
        color="primary"
        variant="outline"
        icon="i-lucide-sparkles"
      >
        Get Routine Recommendation
      </UButton>
    </div>
    <UPageSection>
      <div
        v-if="exercises.length === 0"
        class="text-center text-gray-500"
      >
        No exercises found.
      </div>
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="exercise in exercises"
          :key="exercise.id"
          class="bg-white rounded-lg shadow p-4"
          style="cursor: pointer;"
          @click="goToDetails(exercise.id)"
        >
          <h3 class="text-lg font-semibold mb-2">
            {{ exercise.Exercise }}
          </h3>
          <p><strong>Primary Muscles:</strong> {{ exercise.PrimaryMuscles }}</p>
          <p><strong>Secondary Muscles:</strong> {{ exercise.SecondaryMuscles }}</p>
          <p><strong>Type:</strong> {{ exercise.Type }}</p>
          <p><strong>Focus:</strong> {{ exercise.Focus }}</p>
        </div>
      </div>
      <div
        ref="sentinel"
        class="h-1"
      />
      <p
        v-if="isLoadingMore"
        class="my-4 text-center text-gray-500"
      >
        Loading more exercises...
      </p>
    </UPageSection>
  </UContainer>
</template>
