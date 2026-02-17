<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
const apiKeys = ref<ApiKey[]>([])

type ApiKey = {
    id: string
    api_key: string
    created_at: string
    is_valid: boolean
    account: string
}

onMounted(async () => {
    try {
        const response = await useApiFetch('/api-keys', {
            method: 'GET',
        })
        console.log('API Keys fetched successfully:', response)
        apiKeys.value = Array.isArray(response) ? response : []
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to fetch API keys'
        console.error('Failed to fetch API keys:', message)
    }
})

const goToDetails = (id: string) => {
    navigateTo(`/apiKeys/${id}`)
}

</script>
<template>
    <UContainer>
        <UPageHeader
        title="API Keys"
        description="Browse and manage your API keys."
      />
      <UButton color="primary" class="my-4" @click="navigateTo('/apiKeys/create')">Create New API Key</UButton>
        <UPageSection>
            <div v-if="apiKeys.length === 0" class="text-center text-gray-500">
                No API keys found.
            </div>
            <div v-else class="grid grid-cols-1 gap-6">
                <div v-for="apiKey in apiKeys" :key="apiKey.id" class="bg-white rounded-lg shadow p-4" @click="goToDetails(apiKey.account)" style="cursor: pointer;">
                    <h3 class="text-lg font-semibold mb-2">{{ apiKey.api_key }}</h3>
                    <p><strong>Created At:</strong> {{ apiKey.created_at }}</p>
                    <p><strong>Is Valid:</strong> {{ apiKey.is_valid }}</p>
                    <p><strong>Account:</strong> {{ apiKey.account }}</p>
                </div>
            </div>
        </UPageSection>
    </UContainer>
</template>