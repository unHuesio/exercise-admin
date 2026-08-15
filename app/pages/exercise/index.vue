<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useCachedApiFetch } from '~/composables/useCachedApiFetch'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()

const exercises = ref<Excercise[]>([])

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

onMounted(async () => {
  try {
    const response = await useCachedApiFetch('/exercises')
    console.log('Exercises fetched successfully:', response)
    exercises.value = Array.isArray(response) ? response : []
  } catch (error: unknown) {
    const apiError = error as ApiError
    const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to fetch exercises'
    console.error('Failed to fetch exercises:', message)
  }
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
    <UButton
      v-if="authStore.isAdmin"
      color="primary"
      class="my-4"
      @click="goToCreate"
    >
      Create New Exercise
    </UButton>
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
    </UPageSection>
  </UContainer>
</template>
