<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

const exercises = ref<Excercise | null>(null)

const schema = v.pipe(
  v.object({
    exercise: v.pipe(v.string(), v.minLength(1, 'Exercise name is required')),
    primaryMuscles: v.pipe(v.string(), v.minLength(1, 'Primary muscles are required')),
    secondaryMuscles: v.optional(v.string()),
    type: v.pipe(v.string(), v.minLength(1, 'Type is required')),
    focus: v.pipe(v.string(), v.minLength(1, 'Focus is required')),
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

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
    event.preventDefault()
    const result = v.safeParse(schema, state)
    console.log('Form data:', state)
    if (result.success) {
        console.log('Form data is valid:', result.output)
        const id = useRoute().params.id
        try {
            await useApiFetch(`/exercises`, {
                method: 'POST',
                body: result.output,
            })
            console.log('Exercise created successfully')
            navigateTo('/exercise')
        } catch (error: any) {
            const message = error?.data?.error || error?.data?.message || error.message || 'Failed to create exercise'
            console.error('Failed to create exercise:', message)
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
        title="Create Exercise"
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
            </UForm>
      </UPageSection>
    </UContainer>
</template>