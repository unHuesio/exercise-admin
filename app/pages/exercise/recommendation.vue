<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: 'auth'
})

type ApiError = {
  data?: {
    error?: string
    message?: string
  }
  message?: string
}

const recommendationSchema = v.object({
  goal: v.pipe(v.string(), v.minLength(1, 'Goal is required')),
  focus: v.pipe(v.string(), v.minLength(1, 'Focus is required')),
  avoidMuscles: v.array(v.string())
})

type RecommendationSchema = v.InferOutput<typeof recommendationSchema>

const isSubmittingRecommendation = ref(false)
const recommendation = ref<unknown | null>(null)
const recommendationError = ref('')
const recommendationState = reactive({
  goal: '',
  focus: '',
  avoidMuscles: [] as string[]
})

function removeWeightProperties(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeWeightProperties)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'weight')
        .map(([key, nestedValue]) => [key, removeWeightProperties(nestedValue)])
    )
  }

  return value
}

const formattedRecommendation = computed(() => {
  if (recommendation.value === null) {
    return ''
  }

  return JSON.stringify(removeWeightProperties(recommendation.value), null, 2)
})

const handleRecommendationSubmit = async (event: FormSubmitEvent<RecommendationSchema>) => {
  event.preventDefault()
  const result = v.safeParse(recommendationSchema, recommendationState)

  if (!result.success) {
    console.error('Recommendation validation errors:', result.issues)
    return
  }

  isSubmittingRecommendation.value = true
  recommendationError.value = ''

  try {
    recommendation.value = await useApiFetch('/recommendations/routine', {
      method: 'POST',
      body: result.output
    })
  } catch (error: unknown) {
    const apiError = error as ApiError
    recommendationError.value = apiError.data?.error || apiError.data?.message || apiError.message || 'Failed to get a routine recommendation'
    console.error('Failed to get routine recommendation:', recommendationError.value)
  } finally {
    isSubmittingRecommendation.value = false
  }
}
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Routine Recommendation"
      description="Tell us your training preferences to generate a recommended routine."
    />
    <UPageSection>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Routine Preferences
            </h2>
          </template>

          <UForm
            class="space-y-6"
            :schema="recommendationSchema"
            :state="recommendationState"
            @submit="handleRecommendationSubmit"
          >
            <UFormField
              label="Goal"
              name="goal"
            >
              <UInput
                v-model="recommendationState.goal"
                placeholder="e.g. powerlifting"
              />
            </UFormField>
            <UFormField
              label="Focus"
              name="focus"
            >
              <UInput
                v-model="recommendationState.focus"
                placeholder="e.g. Bicep"
              />
            </UFormField>
            <UFormField
              label="Muscles to Avoid"
              name="avoidMuscles"
              hint="Press Enter after each muscle."
            >
              <UInputTags
                v-model="recommendationState.avoidMuscles"
                placeholder="e.g. Lower Back"
              />
            </UFormField>
            <p
              v-if="recommendationError"
              class="text-sm text-error"
              role="alert"
            >
              {{ recommendationError }}
            </p>
            <UButton
              type="submit"
              color="primary"
              class="w-full"
              :loading="isSubmittingRecommendation"
            >
              Generate Recommendation
            </UButton>
          </UForm>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Recommended Routine
            </h2>
          </template>

          <pre
            v-if="formattedRecommendation"
            class="overflow-x-auto whitespace-pre-wrap text-sm text-default"
          >{{ formattedRecommendation }}</pre>
          <p
            v-else
            class="text-sm text-muted"
          >
            Submit your preferences to see a recommended routine.
          </p>
        </UCard>
      </div>
    </UPageSection>
  </UContainer>
</template>
