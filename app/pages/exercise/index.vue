<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

const exercises = ref<Excercise[]>([])

type Excercise = {
    id: number
    Exercise: string
    PrimaryMuscles: string
    SecondaryMuscles: string
    Type: string
    Focus: string
}

onMounted(async () => {

    try {
        const response = await useApiFetch('/exercises', {
            method: 'GET',
        })
        console.log('Exercises fetched successfully:', response)
        exercises.value = Array.isArray(response) ? response : []
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to fetch exercises'
        console.error('Failed to fetch exercises:', message)
    }
})

const goToDetails = (id: number) => {
    navigateTo(`/exercise/${id}`)
}

</script>
<template>
    <UContainer>
        <UPageHeader
        title="Exercises"
        description="Browse and manage your exercises."
      />
      <UButton v-if="authStore.isAdmin" color="primary" class="my-4" @click="navigateTo('/exercise/create')">Create New Exercise</UButton>
        <UPageSection>
            <div v-if="exercises.length === 0" class="text-center text-gray-500">
                No exercises found.
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="exercise in exercises" :key="exercise.id" class="bg-white rounded-lg shadow p-4" @click="goToDetails(exercise.id)" style="cursor: pointer;">
                    <h3 class="text-lg font-semibold mb-2">{{ exercise.Exercise }}</h3>
                    <p><strong>Primary Muscles:</strong> {{ exercise.PrimaryMuscles }}</p>
                    <p><strong>Secondary Muscles:</strong> {{ exercise.SecondaryMuscles }}</p>
                    <p><strong>Type:</strong> {{ exercise.Type }}</p>
                    <p><strong>Focus:</strong> {{ exercise.Focus }}</p>
                </div>
            </div>
        </UPageSection>
    </UContainer>
</template>