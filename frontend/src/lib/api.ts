export const API = '/api'
export const TOKEN_KEY = 'playground_token'

export function jsonHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}
