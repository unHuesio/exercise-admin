<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

const applications = ref<Application | null>(null)

const schema = v.pipe(
  v.object({
    name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
    email: v.pipe(v.string(), v.minLength(1, 'Email is required')),
    api_key: v.pipe(v.string(), v.minLength(1, 'API key is required')),
  })
)

type Schema = v.InferOutput<typeof schema>

const state = reactive({
    name: '',
    email: '',
    api_key: '',
})

type Application = {
    name: string
    email: string
    api_key: string
}

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
    event.preventDefault()
    const result = v.safeParse(schema, state)
    console.log('Form data:', state)
    if (result.success) {
        console.log('Form data is valid:', result.output)
        const id = useRoute().params.id
        try {
            await useApiFetch(`/applications`, {
                method: 'POST',
                body: result.output,
            })
            console.log('Application created successfully')
            navigateTo('/applications')
        } catch (error: any) {
            const message = error?.data?.error || error?.data?.message || error.message || 'Failed to create application'
            console.error('Failed to create application:', message)
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
        title="Register Application"
      />
      <UPageSection>
            <UForm class="max-w-md mx-auto space-y-6" :schema="schema" :state="state" @submit="handleSubmit">
                <UFormField label="Name" name="name">
                    <UInput v-model="state.name" type="text" placeholder="Enter name" />
                </UFormField>
                <UFormField label="Email" name="email">
                    <UInput v-model="state.email" type="email" placeholder="Enter email" />
                </UFormField>
                <UFormField label="API Key" name="api_key">
                    <UInput v-model="state.api_key" type="text" placeholder="Enter API key" />
                </UFormField>
                <UButton type="submit" color="primary" class="w-full">Save Changes</UButton>
            </UForm>
      </UPageSection>
    </UContainer>
</template>