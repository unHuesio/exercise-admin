<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

const permissions = ref<Permission[]>([])

const schema = v.pipe(
  v.object({
    object: v.pipe(
        v.string(), 
        v.values(['exercises', 'api_keys', 'permissions'], 'Only exercises, api_keys, or permissions are allowed'),
        v.minLength(1, 'Object is required')
    ),
    subject: v.pipe(
        v.string(),
        v.values(['admin', 'app_client'], 'Only admin or app_client are allowed'),
        v.minLength(1, 'Subject is required')
    ),
    action: v.pipe(
      v.string(),
      v.values(['create', 'read', 'update', 'delete'], 'Only create, read, update, or delete are allowed'),
      v.minLength(1, 'Action is required')
    ),
  })
)

type Schema = v.InferOutput<typeof schema>

const state = reactive({
    subject: '',
    action: '',
    object: '',
})

type Role = 'admin' | 'app_client'
type Resource = 'exercises' | 'api_keys' | 'permissions'
type Action = 'create' | 'read' | 'update' | 'delete'

type Permission = [Role, Resource, Action]

const handleSubmit = async (event: FormSubmitEvent<Schema>) => {
    event.preventDefault()
    const result = v.safeParse(schema, state)
    console.log('Form data:', state)
    if (result.success) {
        console.log('Form data is valid:', result.output)
        try {
            await useApiFetch(`/permissions`, {
                method: 'POST',
                body: result.output,
            })
            console.log('Permission created successfully')
            navigateTo('/permissions')
        } catch (error: any) {
            const message = error?.data?.error || error?.data?.message || error.message || 'Failed to create permission'
            console.error('Failed to create permission:', message)
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
        title="Create Permission"
      />
      <UPageSection>
            <UForm class="max-w-md mx-auto space-y-6" :schema="schema" :state="state" @submit="handleSubmit">
                <UFormField label="Object" name="object">
                    <UInput v-model="state.object" type="text" placeholder="Enter object" />
                </UFormField>
                <UFormField label="Subject" name="subject">
                    <UInput v-model="state.subject" type="text" placeholder="Enter subject" />
                </UFormField>
                <UFormField label="Action" name="action">
                    <UInput v-model="state.action" type="text" placeholder="Enter action" />
                </UFormField>
                <UButton type="submit" color="primary" class="w-full">Save Changes</UButton>
            </UForm>
      </UPageSection>
    </UContainer>
</template>