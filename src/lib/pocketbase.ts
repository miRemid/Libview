import PocketBase from 'pocketbase'
import type { Photo } from './types'

export const pb = new PocketBase(
  import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090',
)

pb.autoCancellation(false)

export function isAdmin() {
  return (
    pb.authStore.isValid &&
    pb.authStore.record?.collectionName === '_superusers'
  )
}

export function photoUrl(photo: Photo, thumb?: string) {
  if (photo.remote_url) return photo.remote_url
  return pb.files.getURL(photo, photo.image, thumb ? { thumb } : undefined)
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
