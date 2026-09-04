type CachedFetchEntry<T> = {
  promise: Promise<T> | null
  value: T | null
  timestamp: number
}

const fetchCache = new Map<string, CachedFetchEntry<unknown>>()

function buildCacheKey(path: string) {
  // Path-only keys: this cache is client-side and cleared on login/logout.
  // Avoid embedding the full JWT in Map keys.
  return path
}

function isPathMatch(cacheKey: string, path: string) {
  return cacheKey === path
    || cacheKey.startsWith(`${path}/`)
    || cacheKey.startsWith(`${path}?`)
}

export async function useCachedApiFetch<T = unknown>(
  path: string,
  options?: {
    ttlMs?: number
    forceRefresh?: boolean
  }
) {
  const ttlMs = options?.ttlMs ?? 10_000
  const cacheKey = buildCacheKey(path)
  const now = Date.now()
  const existingEntry = fetchCache.get(cacheKey) as CachedFetchEntry<T> | undefined

  if (existingEntry && !existingEntry.promise && now - existingEntry.timestamp >= ttlMs) {
    fetchCache.delete(cacheKey)
  }

  const freshEntry = fetchCache.get(cacheKey) as CachedFetchEntry<T> | undefined

  if (!options?.forceRefresh && freshEntry?.value && now - freshEntry.timestamp < ttlMs) {
    return freshEntry.value
  }

  if (freshEntry?.promise && !options?.forceRefresh) {
    return freshEntry.promise
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
    value: freshEntry?.value ?? null,
    timestamp: freshEntry?.timestamp ?? 0
  })

  return requestPromise
}

export function clearCachedApiFetch(path?: string) {
  if (!path) {
    fetchCache.clear()
    return
  }

  for (const key of [...fetchCache.keys()]) {
    if (isPathMatch(key, path)) {
      fetchCache.delete(key)
    }
  }
}
