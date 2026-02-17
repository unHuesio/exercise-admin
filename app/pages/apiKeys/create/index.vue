<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

const apiKey = ref<ApiKey | null>(null)

const schema = v.pipe(
  v.object({
    account: v.pipe(v.string(), v.email('Invalid email')),
  })
)

type Schema = v.InferOutput<typeof schema>

const state = reactive({
    account: '',
})

type ApiKey = {
    account: string
}

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
    event.preventDefault()
    const result = v.safeParse(schema, state)
    console.log('Form data:', state)
    if (result.success) {
        console.log('Form data is valid:', result.output)
        const id = useRoute().params.id
        try {
            await useApiFetch(`/api-keys`, {
                method: 'POST',
                body: result.output,
            })
            console.log('API key created successfully')
            navigateTo('/apiKeys')
        } catch (error: any) {
            const message = error?.data?.error || error?.data?.message || error.message || 'Failed to create API key'
            console.error('Failed to create API key:', message)
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
                <UFormField label="Account" name="account">
                    <UInput v-model="state.account" type="text" placeholder="Enter account name" />
                </UFormField>
                <UButton type="submit" color="primary" class="w-full">Save Changes</UButton>
            </UForm>
      </UPageSection>
    </UContainer>
</template>