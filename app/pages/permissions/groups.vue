<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})

type GroupRole = {
  role: string
  user: string
}

type RoleEmails = {
  [role: string]: string[]
}

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

const groupRoles = ref<GroupRole[]>([])

const loadGroupRoles = async (force = false) => {
  try {
    const response = await useCachedApiFetch('/permissions/groups', {
      forceRefresh: force
    })

    const nextGroupRoles = Object.entries(response as RoleEmails).flatMap(([role, users]) =>
      users.map(user => ({ role, user }))
    )

    groupRoles.value = nextGroupRoles
  } catch (error: unknown) {
    const apiError = error as ApiError
    const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to fetch permissions groups'
    console.error('Failed to fetch permissions groups:', message)
  }
}

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
  if (useRoute().path === '/permissions/groups') {
    return
  }

  void navigateTo('/permissions/groups')
}

const handleDelete = async (groupRole: GroupRole) => {
  try {
    await useApiFetch('/permissions/groups', {
      method: 'DELETE',
      body: {
        user: groupRole.user,
        role: groupRole.role
      }
    })

    await loadGroupRoles(true)
  } catch (error: unknown) {
    const apiError = error as ApiError
    const message = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to delete permission group'
    console.error('Failed to delete permission group:', message)
  }
}

onMounted(loadGroupRoles)
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Permission Groups"
      description="Browse and manage your permission groups."
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
        v-if="groupRoles.length === 0"
        class="text-center text-gray-500"
      >
        No permission groups found.
      </div>
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="groupRole in groupRoles"
          :key="groupRole.role + '-' + groupRole.user"
          class="bg-white rounded-lg shadow p-4"
          style="cursor: pointer;"
          @click="goToDetails(groupRole.user)"
        >
          <h3 class="text-lg font-semibold mb-2">
            {{ groupRole.user }}
          </h3>
          <p><strong>Role:</strong> {{ groupRole.role }}</p>
          <UButton
            color="error"
            class="mt-4"
            @click.stop="handleDelete(groupRole)"
          >
            Delete
          </UButton>
        </div>
      </div>
    </UPageSection>
  </UContainer>
</template>
