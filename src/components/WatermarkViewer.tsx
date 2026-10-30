import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
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

const MIN_SCALE = 1
const MAX_SCALE = 5

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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
        draggable={false}
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

function ZoomStage({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ scale: 1, x: 0, y: 0 })
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)
  const [{ scale, x, y }, setTransform] = useState(transformRef.current)

  const updateTransform = (
    next: { scale: number; x: number; y: number } | ((current: typeof transformRef.current) => typeof transformRef.current),
  ) => {
    const value = typeof next === 'function' ? next(transformRef.current) : next
    transformRef.current = value
    setTransform(value)
  }

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = stage.getBoundingClientRect()
      const px = event.clientX - rect.left - rect.width / 2
      const py = event.clientY - rect.top - rect.height / 2
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1)
      updateTransform((current) => {
        const nextScale = clamp(current.scale * Math.exp(-delta * 0.0018), MIN_SCALE, MAX_SCALE)
        if (nextScale === current.scale) return current
        if (nextScale === MIN_SCALE) return { scale: MIN_SCALE, x: 0, y: 0 }
        const ratio = nextScale / current.scale
        return {
          scale: nextScale,
          x: px - (px - current.x) * ratio,
          y: py - (py - current.y) * ratio,
        }
      })
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const current = transformRef.current
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.hypot(dx, dy) > 3) drag.moved = true
    if (transformRef.current.scale <= MIN_SCALE) return
    updateTransform({
      scale: transformRef.current.scale,
      x: drag.originX + dx,
      y: drag.originY + dy,
    })
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (drag && drag.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const moved = dragRef.current?.moved
    dragRef.current = null
    if (moved) return
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div
      ref={stageRef}
      className={`flex h-full w-full items-center justify-center ${
        scale > MIN_SCALE ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragRef.current = null
      }}
      onClick={onClick}
    >
      <div
        className="touch-none select-none will-change-transform"
        style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
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
      className="fixed inset-0 z-[70] overflow-hidden bg-ink/35"
    >
      {fallback ? (
        <ZoomStage onClose={onClose}>
          <CssWatermarkCard photo={photo} />
        </ZoomStage>
      ) : src ? (
        <ZoomStage onClose={onClose}>
          <img
            src={src}
            alt={`${photo.title || '摄影作品'} 参数水印`}
            className="max-h-[86vh] w-auto max-w-[min(1100px,86vw)] shadow-[0_24px_80px_rgba(20,20,20,0.16)]"
            draggable={false}
          />
        </ZoomStage>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-white">正在生成水印…</p>
        </div>
      )}
    </div>
  )
}
