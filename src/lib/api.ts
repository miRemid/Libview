import type { Photo } from './types'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  })
  if (!response.ok) {
    let message = response.statusText
    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function listPhotos() {
  return api<Photo[]>('/api/photos')
}

export function getPhoto(id: string) {
  return api<Photo>(`/api/photos/${id}`)
}

export function createPhoto(data: Record<string, string | number>) {
  return api<Photo>('/api/photos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updatePhoto(id: string, data: Record<string, string | number>) {
  return api<Photo>(`/api/photos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deletePhoto(id: string) {
  return api<void>(`/api/photos/${id}`, { method: 'DELETE' })
}

export function login(email: string, password: string) {
  return api<{ email: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout() {
  return api<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
}

export function getMe() {
  return api<{ email: string }>('/api/auth/me')
}

export type SignedUpload = {
  url: string
  key: string
  publicUrl: string
}

export function signUpload(contentType: string) {
  return api<SignedUpload>('/api/uploads/sign', {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  })
}

export async function putObject(signed: SignedUpload, file: File) {
  const relative = signed.url.startsWith('/')
  const response = await fetch(signed.url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
    credentials: relative ? 'include' : 'omit',
  })
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to upload image')
  }
}

export function photoUrl(photo: Photo, thumb?: string) {
  void thumb
  return photo.remote_url
}

export function photoFileUrl(photo: Photo) {
  return `/api/photos/${photo.id}/file`
}

export function hasCameraInfo(photo: Photo) {
  return Boolean(
    photo.camera_make ||
      photo.camera_model ||
      photo.lens ||
      photo.focal_length ||
      photo.aperture ||
      photo.shutter_speed ||
      photo.iso,
  )
}
