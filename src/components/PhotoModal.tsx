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

        <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-4 sm:px-8 lg:px-8 lg:py-6">
          <div className="flex w-full max-w-5xl flex-col lg:w-auto lg:flex-row lg:items-start lg:gap-6">
            <div className="flex justify-center">
              <img
                src={photoUrl(photo)}
                alt={photo.title || '摄影作品'}
                className="max-h-[58vh] w-auto max-w-full object-contain lg:max-h-[64vh] lg:max-w-[min(640px,52vw)]"
              />
            </div>

            <aside className="mt-6 border-t border-line pt-6 lg:mt-0 lg:max-h-[64vh] lg:w-[280px] lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:pt-0">
              <h2 className="font-serif text-2xl text-ink">
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
    </div>
  )
}
