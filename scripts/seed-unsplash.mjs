import PocketBase from 'pocketbase'
import exifr from 'exifr'

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090'
const EMAIL = process.env.PB_EMAIL || 'admin@libview.local'
const PASSWORD = process.env.PB_PASSWORD || 'LibviewAdmin123'

const photos = [
  {
    id: '1470770903676-69b98201ea1c',
    title: '湖边木屋',
    photographer: 'Luca Bravo',
  },
  {
    id: '1464822759023-fed622ff2c3b',
    title: '群山之间',
    photographer: 'Kalen Emsley',
  },
  {
    id: '1470071459604-3b5ec3a7fe05',
    title: '雾中山脊',
    photographer: 'Qingbao Meng',
  },
  {
    id: '1418065460487-3e41a6c84dc5',
    title: '林间薄雾',
    photographer: 'Jay Mantri',
  },
  {
    id: '1441974231531-c6227db76b6e',
    title: '阳光穿过树林',
    photographer: 'Veeterzy',
  },
  {
    id: '1507525428034-b723cf961d3e',
    title: '海岸线',
    photographer: 'Sean Oulashin',
  },
  {
    id: '1501785888041-af3ef285b470',
    title: '倒影',
    photographer: 'Luca Bravo',
  },
  {
    id: '1519681393784-d120267933ba',
    title: '星空下的山峰',
    photographer: 'Benjamin Voros',
  },
]

function jpegDimensions(buffer) {
  let offset = 2
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break
    const marker = buffer[offset + 1]
    const length = buffer.readUInt16BE(offset + 2)
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      }
    }
    offset += 2 + length
  }
  return { width: 0, height: 0 }
}

function formatAperture(value) {
  if (!value) return ''
  return `f/${value.toFixed(1).replace(/\.0$/, '')}`
}

function formatShutter(value) {
  if (!value) return ''
  if (value >= 1) return `${Number.isInteger(value) ? value : value.toFixed(1)}s`
  return `1/${Math.round(1 / value)}`
}

function toPocketBaseDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return ''
  return value.toISOString().replace('T', ' ')
}

async function extractInfo(buffer) {
  const exif = await exifr.parse(buffer).catch(() => null)
  const size = jpegDimensions(buffer)
  const isoRaw = exif?.ISO ?? exif?.IsoSpeedRatings
  const iso = Array.isArray(isoRaw) ? Number(isoRaw[0]) || 0 : Number(isoRaw) || 0
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
    iso,
    taken_at: toPocketBaseDate(exif?.DateTimeOriginal),
  }
}

async function download(id) {
  const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2400&q=80`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Libview/0.1 (local seed)' },
  })
  if (!response.ok) throw new Error(`download ${id} failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

const pb = new PocketBase(PB_URL)
await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD)

const existing = await pb.collection('photos').getFullList({ fields: 'title' })
const titles = new Set(existing.map((record) => record.title))

for (const photo of photos) {
  if (titles.has(photo.title)) {
    console.log(`skip ${photo.title}`)
    continue
  }

  console.log(`upload ${photo.title}`)
  const buffer = await download(photo.id)
  const info = await extractInfo(buffer)
  const file = new File([buffer], `${photo.id}.jpg`, { type: 'image/jpeg' })
  const form = new FormData()
  form.append('image', file)
  form.append('title', photo.title)
  form.append(
    'description',
    `Photo by ${photo.photographer} on Unsplash`,
  )
  form.append('width', String(info.width || 0))
  form.append('height', String(info.height || 0))
  form.append('camera_make', info.camera_make)
  form.append('camera_model', info.camera_model)
  form.append('lens', info.lens)
  form.append('focal_length', info.focal_length)
  form.append('aperture', info.aperture)
  form.append('shutter_speed', info.shutter_speed)
  form.append('iso', String(info.iso || 0))
  if (info.taken_at) form.append('taken_at', info.taken_at)

  await pb.collection('photos').create(form)
}

console.log('done')
