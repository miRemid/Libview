import type { Photo } from './types'

export type CameraBrand =
  | 'sony'
  | 'canon'
  | 'nikon'
  | 'fujifilm'
  | 'leica'
  | 'hasselblad'
  | 'apple'
  | 'dji'
  | 'panasonic'
  | 'olympus'
  | 'google'
  | 'samsung'
  | 'ricoh'
  | 'pentax'
  | 'sigma'
  | 'unknown'

export function detectBrand(photo: Photo): CameraBrand {
  const blob = `${photo.camera_make} ${photo.camera_model} ${photo.lens}`.toLowerCase()
  if (/sony|ilce|ilme|dsc-/.test(blob)) return 'sony'
  if (/canon|eos /.test(blob)) return 'canon'
  if (/nikon|z 5|z 6|z 7|z 8|z 9|d850|d780/.test(blob)) return 'nikon'
  if (/fuji|fujifilm|gfx|x-t|x-h|x-pro|x100/.test(blob)) return 'fujifilm'
  if (/leica/.test(blob)) return 'leica'
  if (/hasselblad/.test(blob)) return 'hasselblad'
  if (/apple|iphone|ipad/.test(blob)) return 'apple'
  if (/\bdji\b/.test(blob)) return 'dji'
  if (/panasonic|lumix/.test(blob)) return 'panasonic'
  if (/olympus|om[- ]?system|om-1|om-3/.test(blob)) return 'olympus'
  if (/google|pixel/.test(blob)) return 'google'
  if (/samsung|galaxy/.test(blob)) return 'samsung'
  if (/ricoh|gr iii|gr iiix/.test(blob)) return 'ricoh'
  if (/pentax/.test(blob)) return 'pentax'
  if (/sigma/.test(blob)) return 'sigma'
  return 'unknown'
}

export function brandWordmark(brand: CameraBrand, photo: Photo) {
  switch (brand) {
    case 'sony':
      return 'SONY'
    case 'canon':
      return 'Canon'
    case 'nikon':
      return 'Nikon'
    case 'fujifilm':
      return 'FUJIFILM'
    case 'leica':
      return 'LEICA'
    case 'hasselblad':
      return 'HASSELBLAD'
    case 'apple':
      return /iphone/i.test(`${photo.camera_make} ${photo.camera_model}`)
        ? 'iPhone'
        : 'Apple'
    case 'dji':
      return 'DJI'
    case 'panasonic':
      return 'LUMIX'
    case 'olympus':
      return 'OM SYSTEM'
    case 'google':
      return 'GOOGLE'
    case 'samsung':
      return 'SAMSUNG'
    case 'ricoh':
      return 'RICOH'
    case 'pentax':
      return 'PENTAX'
    case 'sigma':
      return 'SIGMA'
    default:
      return (photo.camera_make || 'PHOTO').toUpperCase()
  }
}

export function watermarkModel(photo: Photo) {
  const make = photo.camera_make?.trim() ?? ''
  const model = photo.camera_model?.trim() ?? ''
  if (model && make && model.toLowerCase().startsWith(make.toLowerCase())) {
    return model
  }
  return [make, model].filter(Boolean).join(' ')
}

export function watermarkParams(photo: Photo) {
  const aperture = photo.aperture
    ? photo.aperture.replace(/^f\/?/i, 'F').replace(/^ƒ\/?/, 'F')
    : ''
  const parts = [
    photo.focal_length,
    aperture,
    photo.shutter_speed,
    photo.iso ? `ISO ${photo.iso}` : '',
  ].filter(Boolean)
  return parts.join('    ')
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('无法读取原图'))
    image.src = url
  })
}

function drawBrand(
  ctx: CanvasRenderingContext2D,
  brand: CameraBrand,
  word: string,
  x: number,
  y: number,
  size: number,
) {
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#111111'

  if (brand === 'leica') {
    const radius = size * 0.42
    ctx.fillStyle = '#ee2737'
    ctx.beginPath()
    ctx.arc(x + radius, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#111111'
    ctx.font = `600 ${size}px "Outfit", sans-serif`
    ctx.letterSpacing = `${Math.round(size * 0.12)}px`
    ctx.fillText(word, x + radius * 2 + size * 0.28, y)
    const width = radius * 2 + size * 0.28 + ctx.measureText(word).width
    ctx.restore()
    return width
  }

  const weight = brand === 'canon' || brand === 'apple' ? '500' : '600'
  ctx.font = `${weight} ${size}px "Outfit", sans-serif`
  ctx.letterSpacing =
    brand === 'sony' || brand === 'fujifilm' || brand === 'hasselblad'
      ? `${Math.round(size * 0.14)}px`
      : `${Math.round(size * 0.04)}px`
  ctx.fillText(word, x, y)
  const width = ctx.measureText(word).width
  ctx.restore()
  return width
}

export async function renderExifWatermark(photo: Photo, url: string) {
  const [image] = await Promise.all([
    loadImage(url),
    document.fonts.ready.catch(() => undefined),
  ])

  const longest = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = Math.min(1, 2200 / longest)
  const photoW = Math.max(1, Math.round(image.naturalWidth * scale))
  const photoH = Math.max(1, Math.round(image.naturalHeight * scale))
  const pad = Math.max(18, Math.round(photoW * 0.038))
  const footerH = Math.max(86, Math.round(photoW * 0.108))
  const canvas = document.createElement('canvas')
  canvas.width = photoW + pad * 2
  canvas.height = photoH + pad + footerH

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法生成水印')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, pad, pad, photoW, photoH)

  const brand = detectBrand(photo)
  const word = brandWordmark(brand, photo)
  const model = watermarkModel(photo)
  const params = watermarkParams(photo)
  const midY = pad + photoH + footerH / 2
  const logoSize = Math.max(18, Math.round(photoW * 0.032))

  drawBrand(ctx, brand, word, pad, midY, logoSize)

  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#1a1a1a'
  if (model || params) {
    if (model && params) {
      ctx.font = `500 ${Math.max(15, Math.round(photoW * 0.02))}px "Outfit", sans-serif`
      ctx.fillText(model, canvas.width - pad, midY - footerH * 0.14)
      ctx.fillStyle = '#8a8a8a'
      ctx.font = `400 ${Math.max(12, Math.round(photoW * 0.015))}px "Outfit", sans-serif`
      ctx.letterSpacing = `${Math.round(photoW * 0.002)}px`
      ctx.fillText(params, canvas.width - pad, midY + footerH * 0.16)
    } else {
      ctx.font = `500 ${Math.max(15, Math.round(photoW * 0.02))}px "Outfit", sans-serif`
      ctx.fillText(model || params, canvas.width - pad, midY)
    }
  } else {
    ctx.fillStyle = '#8a8a8a'
    ctx.font = `400 ${Math.max(13, Math.round(photoW * 0.016))}px "Outfit", sans-serif`
    ctx.fillText('Libview', canvas.width - pad, midY)
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('无法导出水印'))),
      'image/jpeg',
      0.94,
    )
  })
  return blob
}
