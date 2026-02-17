<script setup lang="ts">
import { user } from '#build/ui';

definePageMeta({
  middleware: ['auth', 'admin']
})
const groupRoles = ref<{ role: string; user: string }[]>([])

type RoleEmails = {
    [role: string]: string[]
}

onMounted(async () => {
    try {
        const response = await useApiFetch('/permissions/groups', {
            method: 'GET',
        })
        console.log('Permissions groups fetched successfully:', response)
        groupRoles.value = Object.entries(response as RoleEmails).flatMap(([role, users]) =>
        users.map(user => ({ role, user }))
        )
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to fetch permissions groups'
        console.error('Failed to fetch permissions groups:', message)
    }
})

const goToDetails = (id: string) => {
    navigateTo(`/permissions/${id}`)
}

const handleDelete = async (groupRole: { role: string; user: string }) => {
    try {
        await useApiFetch(`/permissions/groups`, {
            method: 'DELETE',
            body: {
                user: groupRole.user,
                role: groupRole.role,
            }
        })
        console.log('Permission group deleted successfully')
        // Refresh the group roles list after deletion
        const response = await useApiFetch('/permissions/groups', {
            method: 'GET',
        })
        groupRoles.value = Array.isArray(response) ? response : []
    } catch (error: any) {
        const message = error?.data?.error || error?.data?.message || error.message || 'Failed to delete permission group'
        console.error('Failed to delete permission group:', message)
    }
}

</script>
<template>
    <UContainer>
        <UPageHeader
        title="Permission Groups"
        description="Browse and manage your permission groups."
      />
      <UButton color="primary" class="my-4" @click="navigateTo('/permissions/create')">Create New Permission</UButton>
      <UButton color="primary" class="my-4 ml-4" @click="navigateTo('/permissions/create/group')">Create New Group Role</UButton>
      <UButton color="secondary" class="my-4 ml-4" @click="navigateTo('/permissions/groups')">View Permission Groups</UButton>
        <UPageSection>
            <div v-if="Object.keys(groupRoles).length === 0" class="text-center text-gray-500">
                No permission groups found.
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div v-for="groupRole in groupRoles" :key="groupRole.role + '-' + groupRole.user" class="bg-white rounded-lg shadow p-4" @click="goToDetails(groupRole.user)" style="cursor: pointer;">
                    <h3 class="text-lg font-semibold mb-2">{{ groupRole.user }}</h3>
                    <p><strong>Role:</strong> {{ groupRole.role }}</p>
                    <UButton color="error" class="mt-4" @click.stop="handleDelete(groupRole)">Delete</UButton>
                </div>
            </div>
        </UPageSection>
    </UContainer>
</template>