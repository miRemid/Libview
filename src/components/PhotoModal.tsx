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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper lg:overflow-hidden">
      <div className="flex min-h-full flex-col lg:h-full">
        <div className="flex shrink-0 items-center justify-between px-5 py-6 sm:px-8">
          <p className="font-serif text-xl text-ink">Libview</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-4 py-1.5 text-sm text-mute transition-colors hover:border-ink hover:text-ink"
          >
            关闭
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-start lg:justify-center lg:gap-8 lg:px-8 lg:pb-8">
          <div className="flex justify-center px-5 py-2 sm:px-8 lg:min-w-0 lg:px-0 lg:py-0">
            <img
              src={photoUrl(photo)}
              alt={photo.title || '摄影作品'}
              className="max-h-[72vh] w-auto max-w-full object-contain lg:max-h-[calc(100vh-7.5rem)]"
            />
          </div>

          <aside className="border-t border-line px-5 py-6 sm:px-8 lg:max-h-[calc(100vh-7.5rem)] lg:w-[300px] lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:px-0 lg:py-0">
            <h2 className="font-serif text-2xl text-ink lg:text-3xl">
              {photo.title || '未命名'}
            </h2>
            {photo.description ? (
              <p className="mt-4 text-[15px] leading-relaxed text-mute">
                {photo.description}
              </p>
            ) : null}
            <div className="mt-8">
              <ExifStrip photo={photo} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
