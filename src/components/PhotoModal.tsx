import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { getPhoto, photoUrl } from '../lib/api'
import type { Photo } from '../lib/types'
import type { GalleryOutletContext } from '../pages/Gallery'
import ExifStrip from './ExifStrip'
import WatermarkViewer from './WatermarkViewer'

type LocationState = {
  fromGallery?: boolean
}

export default function PhotoModal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { photos } = useOutletContext<GalleryOutletContext>()
  const cached = photos.find((photo) => photo.id === id)
  const [photo, setPhoto] = useState<Photo | null>(cached ?? null)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(false)

  const close = useCallback(() => {
    const state = location.state as LocationState | null
    if (state?.fromGallery) {
      navigate(-1)
      return
    }
    navigate('/', { replace: true })
  }, [location.state, navigate])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (lightbox) {
        setLightbox(false)
        return
      }
      close()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [close, lightbox])

  useEffect(() => {
    if (cached) {
      setPhoto(cached)
      setError('')
      return
    }
    if (!id) return
    let cancelled = false
    setPhoto(null)
    setError('')
    getPhoto(id)
      .then((record) => {
        if (!cancelled) setPhoto(record)
      })
      .catch(() => {
        if (!cancelled) setError('找不到这张照片。')
      })
    return () => {
      cancelled = true
    }
  }, [cached, id])

  useEffect(() => {
    setLightbox(false)
  }, [id])

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto bg-paper lg:overflow-hidden">
        <div className="flex min-h-full flex-col pt-16 lg:h-full">
          <div className="flex min-h-0 flex-1 items-start justify-center px-5 py-4 sm:px-8 lg:items-center lg:px-8 lg:py-6">
            {photo ? (
              <div className="grid w-full max-w-5xl grid-cols-1 lg:w-auto lg:grid-cols-[auto_280px] lg:gap-x-6">
                <button
                  type="button"
                  onClick={close}
                  aria-label="返回"
                  className="col-start-1 row-start-1 mb-3 justify-self-start text-mute transition-colors hover:text-ink"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M15 5 8 12l7 7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setLightbox(true)}
                  className="col-start-1 row-start-2 cursor-zoom-in justify-self-start"
                >
                  <img
                    src={photoUrl(photo)}
                    alt={photo.title || '摄影作品'}
                    className="max-h-[58vh] w-auto max-w-full object-contain lg:max-h-[64vh] lg:max-w-[min(640px,52vw)]"
                  />
                </button>
                <aside className="col-start-1 row-start-3 mt-6 border-t border-line pt-6 lg:col-start-2 lg:row-start-2 lg:mt-0 lg:max-h-[64vh] lg:overflow-y-auto lg:border-t-0 lg:pt-0">
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
            ) : (
              <p className="text-sm text-mute">{error || '正在打开照片…'}</p>
            )}
          </div>
        </div>
      </div>
      {lightbox && photo ? (
        <WatermarkViewer photo={photo} onClose={() => setLightbox(false)} />
      ) : null}
    </>
  )
}
