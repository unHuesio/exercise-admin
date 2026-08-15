<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
const permissions = ref<Permission[]>([])

type Role = 'admin' | 'app_client'
type Resource = 'exercises' | 'permissions'
type Action = 'create' | 'read' | 'update' | 'delete'

type Permission = [Role, Resource, Action]

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

onMounted(async () => {
  try {
    const response = await useApiFetch('/permissions', {
      method: 'GET'
    })
    console.log('Permissions fetched successfully:', response)
    permissions.value = Array.isArray(response) ? response : []
  } catch (error: unknown) {
    const apiError = error as ApiError
    const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to fetch permissions'
    console.error('Failed to fetch permissions:', message)
  }
})

const goToDetails = (id: string) => {
  navigateTo(`/permissions/${id}`)
}

const goToCreatePermission = () => {
  void navigateTo('/permissions/create')
}

const goToCreateGroup = () => {
  void navigateTo('/permissions/create/group')
}

const goToGroups = () => {
  void navigateTo('/permissions/groups')
}

const handleDelete = async (permission: Permission) => {
  try {
    await useApiFetch(`/permissions`, {
      method: 'DELETE',
      body: {
        subject: permission[0],
        action: permission[2],
        object: permission[1]
      }
    })
    console.log('Permission deleted successfully')
    // Refresh the permissions list after deletion
    const response = await useApiFetch('/permissions', {
      method: 'GET'
    })
    permissions.value = Array.isArray(response) ? response : []
  } catch (error: unknown) {
    const apiError = error as ApiError
    const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to delete permission'
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
    <UButton
      color="primary"
      class="my-4"
      @click="goToCreatePermission"
    >
      Create New Permission
    </UButton>
    <UButton
      color="primary"
      class="my-4 ml-4"
      @click="goToCreateGroup"
    >
      Create New Group Role
    </UButton>
    <UButton
      color="secondary"
      class="my-4 ml-4"
      @click="goToGroups"
    >
      View Permission Groups
    </UButton>
    <UPageSection>
      <div
        v-if="permissions.length === 0"
        class="text-center text-gray-500"
      >
        No permissions found.
      </div>
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="permission in permissions"
          :key="permission.join('-')"
          class="bg-white rounded-lg shadow p-4"
          style="cursor: pointer;"
          @click="goToDetails(permission[0])"
        >
          <h3 class="text-lg font-semibold mb-2">
            {{ permission[0] }}
          </h3>
          <p><strong>Action:</strong> {{ permission[2] }}</p>
          <p><strong>Object:</strong> {{ permission[1] }}</p>
          <UButton
            color="error"
            class="mt-4"
            @click.stop="handleDelete(permission)"
          >
            Delete
          </UButton>
        </div>
      </div>
    </UPageSection>
  </UContainer>
</template>
