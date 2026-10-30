import { useEffect, useState } from 'react'
import {
  brandWordmark,
  detectBrand,
  renderExifWatermark,
  watermarkModel,
  watermarkParams,
  type CameraBrand,
} from '../lib/watermark'
import { photoUrl } from '../lib/pocketbase'
import type { Photo } from '../lib/types'

type WatermarkViewerProps = {
  photo: Photo
  onClose: () => void
}

function BrandMark({ brand, word }: { brand: CameraBrand; word: string }) {
  return (
    <span className="flex items-center gap-2.5 text-[#111]">
      {brand === 'leica' ? (
        <span className="inline-block h-[0.72em] w-[0.72em] rounded-full bg-[#ee2737]" />
      ) : null}
      <span
        className={`text-[1.35em] leading-none ${
          brand === 'canon' || brand === 'apple' ? 'font-medium' : 'font-semibold'
        } ${
          brand === 'sony' || brand === 'fujifilm' || brand === 'hasselblad'
            ? 'tracking-[0.18em]'
            : 'tracking-[0.04em]'
        }`}
      >
        {word}
      </span>
    </span>
  )
}

function CssWatermarkCard({ photo }: { photo: Photo }) {
  const brand = detectBrand(photo)
  const word = brandWordmark(brand, photo)
  const model = watermarkModel(photo)
  const params = watermarkParams(photo)

  return (
    <figure className="@container overflow-hidden bg-white shadow-[0_24px_80px_rgba(20,20,20,0.16)]">
      <img
        src={photoUrl(photo)}
        alt={photo.title || '摄影作品'}
        className="block max-h-[calc(86vh-7.5rem)] w-auto max-w-[min(1100px,86vw)]"
      />
      <figcaption className="flex items-center justify-between gap-6 px-[4.5cqw] py-[3.6cqw]">
        <BrandMark brand={brand} word={word} />
        <div className="min-w-0 text-right">
          {model ? (
            <p className="truncate text-[3.4cqw] font-medium leading-none tracking-wide text-[#1a1a1a] @[480px]:text-base">
              {model}
            </p>
          ) : null}
          {params ? (
            <p className="mt-[1.6cqw] truncate text-[2.6cqw] leading-none tracking-[0.22em] text-[#8a8a8a] @[480px]:mt-1.5 @[480px]:text-xs">
              {params}
            </p>
          ) : (
            <p className="text-[2.6cqw] tracking-[0.18em] text-[#8a8a8a] @[480px]:text-xs">
              Libview
            </p>
          )}
        </div>
      </figcaption>
    </figure>
  )
}

export default function WatermarkViewer({ photo, onClose }: WatermarkViewerProps) {
  const [src, setSrc] = useState('')
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''
    setSrc('')
    setFallback(false)
    renderExifWatermark(photo, photoUrl(photo))
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setFallback(true)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photo])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="带参数水印的大图"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/35 p-5 sm:p-10"
      onClick={onClose}
    >
      <div onClick={(event) => event.stopPropagation()}>
        {fallback ? (
          <CssWatermarkCard photo={photo} />
        ) : src ? (
          <img
            src={src}
            alt={`${photo.title || '摄影作品'} 参数水印`}
            className="max-h-[86vh] w-auto max-w-[min(1100px,86vw)] shadow-[0_24px_80px_rgba(20,20,20,0.16)]"
          />
        ) : (
          <p className="text-sm text-white">正在生成水印…</p>
        )}
      </div>
    </div>
  )
}
