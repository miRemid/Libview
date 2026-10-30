import type { ImageInfo } from './types'

export const emptyImageInfo: ImageInfo = {
  width: 0,
  height: 0,
  camera_make: '',
  camera_model: '',
  lens: '',
  focal_length: '',
  aperture: '',
  shutter_speed: '',
  iso: 0,
  taken_at: '',
}

export function infoFromPhoto(photo: {
  width: number
  height: number
  camera_make: string
  camera_model: string
  lens: string
  focal_length: string
  aperture: string
  shutter_speed: string
  iso: number
  taken_at: string
}): ImageInfo {
  return {
    width: photo.width || 0,
    height: photo.height || 0,
    camera_make: photo.camera_make || '',
    camera_model: photo.camera_model || '',
    lens: photo.lens || '',
    focal_length: photo.focal_length || '',
    aperture: photo.aperture || '',
    shutter_speed: photo.shutter_speed || '',
    iso: photo.iso || 0,
    taken_at: photo.taken_at || '',
  }
}
