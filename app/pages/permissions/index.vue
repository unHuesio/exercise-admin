<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
const permissions = ref<Permission[]>([])

type Role = 'admin' | 'app_client'
type Resource = 'exercises' | 'api_keys' | 'permissions'
type Action = 'create' | 'read' | 'update' | 'delete'

type Permission = [Role, Resource, Action]

onMounted(async () => {
    try {
        const response = await useApiFetch('/permissions', {
            method: 'GET',
        })
        console.log('Permissions fetched successfully:', response)
        permissions.value = Array.isArray(response) ? response : []
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to fetch permissions'
        console.error('Failed to fetch permissions:', message)
    }
})

const goToDetails = (id: string) => {
    navigateTo(`/permissions/${id}`)
}

const handleDelete = async (permission: Permission) => {
    try {
        await useApiFetch(`/permissions`, {
            method: 'DELETE',
            body: {
                subject: permission[0],
                action: permission[2],
                object: permission[1],
            }
        })
        console.log('Permission deleted successfully')
        // Refresh the permissions list after deletion
        const response = await useApiFetch('/permissions', {
            method: 'GET',
        })
        permissions.value = Array.isArray(response) ? response : []
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to delete permission'
        console.error('Failed to delete permission:', message)
    }
}

</script>
<template>
    <UContainer>
        <UPageHeader
        title="Permissions"
        description="Browse and manage your permissions."
      />
      <UButton color="primary" class="my-4" @click="navigateTo('/permissions/create')">Create New Permission</UButton>
      <UButton color="primary" class="my-4 ml-4" @click="navigateTo('/permissions/create/group')">Create New Group Role</UButton>
      <UButton color="secondary" class="my-4 ml-4" @click="navigateTo('/permissions/groups')">View Permission Groups</UButton>
        <UPageSection>
            <div v-if="permissions.length === 0" class="text-center text-gray-500">
                No permissions found.
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div v-for="permission in permissions" :key="permission.join('-')" class="bg-white rounded-lg shadow p-4" @click="goToDetails(permission[0])" style="cursor: pointer;">
                    <h3 class="text-lg font-semibold mb-2">{{ permission[0] }}</h3>
                    <p><strong>Action:</strong> {{ permission[2] }}</p>
                    <p><strong>Object:</strong> {{ permission[1] }}</p>
                    <UButton color="error" class="mt-4" @click.stop="handleDelete(permission)">Delete</UButton>
                </div>
            </div>
        </UPageSection>
    </UContainer>
</template>