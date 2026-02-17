<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

const groupRoles = ref<Group[]>([])

const schema = v.pipe(
  v.object({
    user: v.pipe(
        v.string(), 
        v.email('Invalid email'),
        v.minLength(1, 'User is required')
    ),
    role: v.pipe(
        v.string(),
        v.values(['admin', 'app_client'], 'Only admin or app_client are allowed'),
        v.minLength(1, 'Role is required')
    ),
  })
)

type Schema = v.InferOutput<typeof schema>

const state = reactive({
    user: '',
    role: '',
})

type Role = 'admin' | 'app_client'
type User = string

type Group = {
    user: User
    role: Role
}

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
    event.preventDefault()
    const result = v.safeParse(schema, state)
    console.log('Form data:', state)
    if (result.success) {
        console.log('Form data is valid:', result.output)
        try {
            await useApiFetch(`/permissions/groups`, {
                method: 'POST',
                body: result.output,
            })
            console.log('Group role created successfully')
            navigateTo('/permissions')
        } catch (error: any) {
            const message = error?.data?.error || error?.data?.message || error.message || 'Failed to create group role'
            console.error('Failed to create group role:', message)
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
        title="Create Group Role"
      />
      <UPageSection>
            <UForm class="max-w-md mx-auto space-y-6" :schema="schema" :state="state" @submit="handleSubmit">
                <UFormField label="User" name="user">
                    <UInput v-model="state.user" type="text" placeholder="Enter user email" />
                </UFormField>
                <UFormField label="Role" name="role">
                    <UInput v-model="state.role" type="text" placeholder="Enter role" />
                </UFormField>
                <UButton type="submit" color="primary" class="w-full">Save Changes</UButton>
            </UForm>
      </UPageSection>
    </UContainer>
</template>