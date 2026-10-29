import { useEffect } from 'react'
import ExifStrip from './ExifStrip'
import { photoUrl } from '../lib/pocketbase'
import type { Photo } from '../lib/types'

type PhotoModalProps = {
  photo: Photo
  onClose: () => void
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-serif text-xl text-ink">Libview</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-4 py-1.5 text-sm text-mute transition-colors hover:border-ink hover:text-ink"
          >
            关闭
          </button>
        </div>

        <img
          src={photoUrl(photo)}
          alt={photo.title || '摄影作品'}
          className="mx-auto max-h-[72vh] w-auto max-w-full object-contain"
        />

        <div className="mt-8 border-t border-line pt-6 pb-10">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-serif text-3xl text-ink">
              {photo.title || '未命名'}
            </h2>
            {photo.photographer ? (
              <p className="mt-2 text-sm text-mute">{photo.photographer}</p>
            ) : null}
            {photo.description ? (
              <p className="mt-4 text-[15px] leading-relaxed text-mute">
                {photo.description}
              </p>
            ) : null}
          </div>
          <ExifStrip photo={photo} />
        </div>
      </div>
    </div>
  )
}
