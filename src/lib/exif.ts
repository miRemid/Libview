import exifr from 'exifr'
import type { ImageInfo } from './types'

type ExifData = {
  Make?: string
  Model?: string
  LensModel?: string
  LensMake?: string
  FocalLength?: number
  FNumber?: number
  ExposureTime?: number
  ISO?: number
  IsoSpeedRatings?: number | number[]
  DateTimeOriginal?: Date
}

function formatAperture(value?: number) {
  if (!value) return ''
  const formatted = value.toFixed(1).replace(/\.0$/, '')
  return `f/${formatted}`
}

function formatShutter(value?: number) {
  if (!value) return ''
  if (value >= 1) {
    return `${Number.isInteger(value) ? value : value.toFixed(1)}s`
  }
  return `1/${Math.round(1 / value)}`
}

function formatIso(exif?: ExifData | null) {
  const raw = exif?.ISO ?? exif?.IsoSpeedRatings
  if (Array.isArray(raw)) return Number(raw[0]) || 0
  return Number(raw) || 0
}

function toPocketBaseDate(value?: Date) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return ''
  return value.toISOString().replace('T', ' ')
}

function readDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法读取图片尺寸'))
    }
    image.src = url
  })
}

export async function extractImageInfo(file: File): Promise<ImageInfo> {
  const [exif, size] = await Promise.all([
    exifr.parse(file).catch(() => null) as Promise<ExifData | null>,
    readDimensions(file),
  ])

  const lens = [exif?.LensMake, exif?.LensModel].filter(Boolean).join(' ')

  return {
    width: size.width,
    height: size.height,
    camera_make: exif?.Make?.trim() ?? '',
    camera_model: exif?.Model?.trim() ?? '',
    lens: lens.trim(),
    focal_length: exif?.FocalLength ? `${Math.round(exif.FocalLength)}mm` : '',
    aperture: formatAperture(exif?.FNumber),
    shutter_speed: formatShutter(exif?.ExposureTime),
    iso: formatIso(exif),
    taken_at: toPocketBaseDate(exif?.DateTimeOriginal),
  }
}

export function formatTakenAt(value: string) {
  if (!value) return ''
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function cameraLine(info: {
  camera_make?: string
  camera_model?: string
}) {
  return [info.camera_make, info.camera_model].filter(Boolean).join(' ')
}
