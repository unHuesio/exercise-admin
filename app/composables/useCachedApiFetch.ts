type CachedFetchEntry<T> = {
  promise: Promise<T> | null
  value: T | null
  timestamp: number
}

const fetchCache = new Map<string, CachedFetchEntry<unknown>>()

function buildCacheKey(path: string, token: string | null) {
  return `${token || 'anon'}:${path}`
}

export async function useCachedApiFetch<T = unknown>(
  path: string,
  options?: {
    ttlMs?: number
    forceRefresh?: boolean
  }
) {
  const ttlMs = options?.ttlMs ?? 10_000
  const config = useRuntimeConfig()
  const url = `${config.public.apiBaseUrl}${path}`
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : null
  const cacheKey = buildCacheKey(url, token)
  const now = Date.now()
  const existingEntry = fetchCache.get(cacheKey) as CachedFetchEntry<T> | undefined

  if (!options?.forceRefresh && existingEntry?.value && now - existingEntry.timestamp < ttlMs) {
    return existingEntry.value
  }

  if (existingEntry?.promise && !options?.forceRefresh) {
    return existingEntry.promise
  }

  const requestPromise = useApiFetch<T>(path, {
    method: 'GET'
  }).then((response) => {
    fetchCache.set(cacheKey, {
      promise: null,
      value: response,
      timestamp: Date.now()
    })

    return response
  }).catch((error) => {
    fetchCache.delete(cacheKey)
    throw error
  })

  fetchCache.set(cacheKey, {
    promise: requestPromise,
    value: existingEntry?.value ?? null,
    timestamp: existingEntry?.timestamp ?? 0
  })

  return requestPromise
}

export function clearCachedApiFetch(path?: string) {
  if (!path) {
    fetchCache.clear()
    return
  }

  for (const key of fetchCache.keys()) {
    if (key.endsWith(`:${path}`)) {
      fetchCache.delete(key)
    }
  }
}
