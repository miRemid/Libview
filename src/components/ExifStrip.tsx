import { cameraLine, formatTakenAt } from '../lib/exif'
import { hasCameraInfo } from '../lib/api'
import type { Photo } from '../lib/types'

function Item({
  label,
  value,
  wide = false,
}: {
  label: string
  value?: string | number
  wide?: boolean
}) {
  if (!value) return null
  return (
    <div className={wide ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-mute">{label}</p>
      <p className="mt-1 wrap-break-word text-sm leading-snug text-ink">{value}</p>
    </div>
  )
}

export default function ExifStrip({ photo }: { photo: Photo }) {
  if (!hasCameraInfo(photo) && !photo.taken_at) {
    return (
      <p className="text-sm text-mute">这张照片没有可用的相机参数。</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <Item label="相机" value={cameraLine(photo)} wide />
      <Item label="镜头" value={photo.lens} wide />
      <Item label="焦距" value={photo.focal_length} />
      <Item label="光圈" value={photo.aperture} />
      <Item label="快门" value={photo.shutter_speed} />
      <Item label="ISO" value={photo.iso || ''} />
      <Item label="拍摄时间" value={formatTakenAt(photo.taken_at)} />
      <Item
        label="尺寸"
        value={photo.width && photo.height ? `${photo.width} × ${photo.height}` : ''}
      />
    </div>
  )
}
