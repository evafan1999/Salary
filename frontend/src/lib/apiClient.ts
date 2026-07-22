const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

// FastAPI error bodies are either {"detail": "some message"} (HTTPException) or
// {"detail": [{"msg": "...", "loc": [...], ...}, ...]} (Pydantic validation errors).
// Pull out a human-readable sentence instead of dumping the raw JSON in the UI.
function extractErrorMessage(rawBody: string, status: number): string {
  try {
    const parsed = JSON.parse(rawBody) as { detail?: unknown }
    if (typeof parsed.detail === 'string') {
      return parsed.detail
    }
    if (Array.isArray(parsed.detail)) {
      const messages = parsed.detail
        .map((item) => (typeof item === 'object' && item && 'msg' in item ? String(item.msg) : null))
        .filter((msg): msg is string => Boolean(msg))
        .map((msg) => msg.replace(/^Value error, /, ''))
      if (messages.length > 0) {
        return messages.join('; ')
      }
    }
  } catch {
    // Not JSON — fall through to the raw body below.
  }
  return `API error ${status}: ${rawBody}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(extractErrorMessage(body, response.status))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
