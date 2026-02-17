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
    id: '',
    api_key: '',
    is_valid: '',
    account: '',
    created_at: '',
})

type ApiKey = {
    id: string
    api_key: string
    created_at: string
    is_valid: boolean
    account: string
}

onMounted(async () => {
    const id = useRoute().params.id
    try {
        const response = await useApiFetch(`/api-keys/${id}`, {
            method: 'GET',
        })
        console.log('API key fetched successfully:', response)
        apiKey.value = response as ApiKey
        if (apiKey.value) {
            state.id = apiKey.value.id
            state.account = apiKey.value.account
            state.created_at = apiKey.value.created_at
            state.is_valid = apiKey.value.is_valid.toString()
            state.api_key = apiKey.value.api_key
        }
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to fetch API key'
        console.error('Failed to fetch API key:', message)
    }
})

const handleDelete = async () => {
    const id = state.id
    try {
        await useApiFetch(`/api-keys/${id}`, {
            method: 'DELETE',
        })
        console.log('API key deleted successfully')
        navigateTo('/apiKeys')
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to delete API key'
        console.error('Failed to delete API key:', message)
    }
}

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
    event.preventDefault()
        const id = state.id
        try {
            await useApiFetch(`/api-keys/${id}/invalidate`, {
                method: 'PUT',
            })
            console.log('API key invalidated successfully')
            navigateTo('/apiKeys')
        } catch (error: any) {
            const message = error?.data?.error || error?.data?.message || error.message || 'Failed to invalidate API key'
            console.error('Failed to invalidate API key:', message)
        }

}
</script>
<template>
    <UContainer>
        <UPageHeader
        title="Exercise Details"
      />
      <UPageSection>
            <UForm class="max-w-md mx-auto space-y-6" :state="state" @submit="handleSubmit">
                <UFormField label="API Key" name="api_key">
                    <UInput v-model="state.api_key" type="text" placeholder="API Key" disabled />
                </UFormField>
                <UFormField label="Account" name="account">
                    <UInput v-model="state.account" type="text" placeholder="Enter account name" />
                </UFormField>
                <UFormField label="Created At" name="created_at">
                    <UInput v-model="state.created_at" type="text" placeholder="Created At" disabled />
                </UFormField>
                <UFormField label="Is Valid" name="is_valid">
                    <UInput v-model="state.is_valid" type="text" placeholder="Is Valid" disabled />
                </UFormField>
                <UButton type="submit" color="warning" class="w-full">Invalidate</UButton>
                <UButton type="button" color="error" class="w-full" @click="handleDelete">Delete API Key</UButton>
            </UForm>
      </UPageSection>
    </UContainer>
</template>