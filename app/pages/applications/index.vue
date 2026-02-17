<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
const applications = ref<Application[]>([])

type Application = {
    id: string
    name: string
    email: string
    status: string
    api_key: string
    created_at: string
}

onMounted(async () => {
    try {
        const response = await useApiFetch('/applications', {
            method: 'GET',
        })
        console.log('Applications fetched successfully:', response)
        applications.value = Array.isArray(response) ? response : []
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to fetch applications'
        console.error('Failed to fetch applications:', message)
    }
})

const goToDetails = (id: string) => {
    navigateTo(`/applications/${id}`)
}

const handleDelete = async (application: Application) => {
    try {
        await useApiFetch(`/applications/${application.id}`, {
            method: 'DELETE',
        })
        console.log('Application deleted successfully')
        // Refresh the applications list after deletion
        const response = await useApiFetch('/applications', {
            method: 'GET',
        })
        applications.value = Array.isArray(response) ? response : []
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to delete application'
        console.error('Failed to delete application:', message)
    }
}

const handleApprove = async (application: Application) => {
    try {
        await useApiFetch(`/applications/${application.id}/status`, {
            method: 'PUT',
            body: {
                status: 'approved',
            }
        })
        console.log('Application approved successfully')
        // Refresh the applications list after approval
        const response = await useApiFetch('/applications', {
            method: 'GET',
        })
        applications.value = Array.isArray(response) ? response : []
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to approve application'
        console.error('Failed to approve application:', message)
    }
}

</script>
<template>
    <UContainer>
        <UPageHeader
        title="Applications"
        description="Browse and manage your applications."
      />
      <UButton color="primary" class="my-4" @click="navigateTo('/applications/create')">Create New Application</UButton>
        <UPageSection>
            <div v-if="applications.length === 0" class="text-center text-gray-500">
                No applications found.
            </div>
            <div v-else class="grid grid-cols-1 gap-6">
                <div v-for="application in applications" :key="application.id" class="bg-white rounded-lg shadow p-4">
                    <h3 class="text-lg font-semibold mb-2">{{ application.name }}</h3>
                    <p><strong>Created At:</strong> {{ application.created_at }}</p>
                    <p><strong>Status:</strong> {{ application.status }}</p>
                    <p><strong>API Key:</strong> {{ application.api_key }}</p>
                    <UButton v-if="application.status !== 'approved'" color="primary" class="mt-4" @click.stop="handleApprove(application)">Approve</UButton>
                    <UButton color="error" class="mt-4 ml-4" @click.stop="handleDelete(application)">Delete</UButton>
                </div>
            </div>
        </UPageSection>
    </UContainer>
</template>