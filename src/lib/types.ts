export type Photo = {
  id: string
  title: string
  description: string
  photographer: string
  image: string
  remote_url: string
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
  created: string
  updated: string
}

export type ImageInfo = {
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
}
