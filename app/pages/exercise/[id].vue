<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

const exercises = ref<Excercise | null>(null)

const schema = v.pipe(
  v.object({
    exercise: v.string(),
    primaryMuscles: v.string(),
    secondaryMuscles: v.optional(v.string()),
    type: v.string(),
    focus: v.string(),
  })
)

type Schema = v.InferOutput<typeof schema>

const state = reactive({
    exercise: '',
    primaryMuscles: '',
    secondaryMuscles: '',
    type: '',
    focus: '',
})

type Excercise = {
    id: number
    Exercise: string
    PrimaryMuscles: string
    SecondaryMuscles: string
    Type: string
    Focus: string
}

onMounted(async () => {
    const id = useRoute().params.id
    try {
        const response = await useApiFetch(`/exercises/${id}`, {
            method: 'GET',
        })
        console.log('Exercise fetched successfully:', response)
        exercises.value = response as Excercise
        if (exercises.value) {
            state.exercise = exercises.value.Exercise
            state.primaryMuscles = exercises.value.PrimaryMuscles
            state.secondaryMuscles = exercises.value.SecondaryMuscles
            state.type = exercises.value.Type
            state.focus = exercises.value.Focus
        }
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to fetch exercise'
        console.error('Failed to fetch exercise:', message)
    }
})

const handleDelete = async () => {
    const id = useRoute().params.id
    try {
        await useApiFetch(`/exercises/${id}`, {
            method: 'DELETE',
        })
        console.log('Exercise deleted successfully')
        navigateTo('/exercise')
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to delete exercise'
        console.error('Failed to delete exercise:', message)
    }
}

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
    event.preventDefault()
    const result = v.safeParse(schema, state)
    console.log('Form data:', state)
    if (result.success) {
        console.log('Form data is valid:', result.output)
        const id = useRoute().params.id
        try {
            await useApiFetch(`/exercises/${id}`, {
                method: 'PUT',
                body: result.output,
            })
            console.log('Exercise updated successfully')
            navigateTo('/exercise')
        } catch (error: any) {
            const message = error?.data?.error || error?.data?.message || error.message || 'Failed to update exercise'
            console.error('Failed to update exercise:', message)
        }
    } else {
        console.error('Validation errors:', result.issues)
        // You can also display these errors to the user
    }
}
</script>
<template>
    <UContainer>
        <UPageHeader
        title="Exercise Details"
      />
      <UPageSection>
            <UForm class="max-w-md mx-auto space-y-6" :schema="schema" :state="state" @submit="handleSubmit">
                <UFormField label="Exercise Name" name="exercise">
                    <UInput v-model="state.exercise" type="text" placeholder="Enter exercise name" />
                </UFormField>
                <UFormField label="Primary Muscles" name="primaryMuscles">
                    <UTextarea v-model="state.primaryMuscles" type="text" placeholder="Enter primary muscles" />
                </UFormField>
                <UFormField label="Secondary Muscles" name="secondaryMuscles">
                    <UTextarea v-model="state.secondaryMuscles" type="text" placeholder="Enter secondary muscles" />
                </UFormField>
                <UFormField label="Type" name="type">
                    <UInput v-model="state.type" type="text" placeholder="Enter exercise type" />
                </UFormField>
                <UFormField label="Focus" name="focus">
                    <UInput v-model="state.focus" type="text" placeholder="Enter exercise focus" />
                </UFormField>
                <UButton type="submit" color="primary" class="w-full">Save Changes</UButton>
                <UButton type="button" color="error" class="w-full" @click="handleDelete">Delete Exercise</UButton>
            </UForm>
      </UPageSection>
    </UContainer>
</template>