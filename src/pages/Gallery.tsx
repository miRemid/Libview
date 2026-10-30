import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import PhotoGrid from '../components/PhotoGrid'
import { pb } from '../lib/pocketbase'
import type { Photo } from '../lib/types'

export type GalleryOutletContext = {
  photos: Photo[]
}

const GALLERY_SCROLL_KEY = 'libview:gallery-scroll' // keep in sync with PhotoGrid

export default function Gallery() {
  const location = useLocation()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const onGalleryHome = location.pathname === '/'

  useEffect(() => {
    let cancelled = false
    pb.collection('photos')
      .getFullList<Photo>({ sort: '-created' })
      .then((records) => {
        if (!cancelled) setPhotos(records)
      })
      .catch(() => {
        if (!cancelled) setError('无法加载图库，请确认 PocketBase 已启动。')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!onGalleryHome) return
    const onScroll = () => {
      sessionStorage.setItem(GALLERY_SCROLL_KEY, String(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onGalleryHome])

  useLayoutEffect(() => {
    if (!onGalleryHome || loading) return
    const y = Number(sessionStorage.getItem(GALLERY_SCROLL_KEY) || '0')
    window.scrollTo(0, y)
  }, [loading, onGalleryHome])

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="mx-auto max-w-7xl px-3 pb-16 sm:px-8 lg:pb-20">
        <section className="py-8 sm:py-14 lg:py-20">
          <p className="text-xs uppercase tracking-[0.28em] text-mute">Photography</p>
          <h1 className="mt-3 max-w-2xl font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-6xl">
            把光留下。
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mute">
            Libview 是一个安静的摄影展示空间。每张照片都会保存相机参数，方便回看当时的光线与选择。
          </p>
        </section>

        {loading ? (
          <div className="columns-2 gap-2 lg:columns-3 lg:gap-4">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="mb-2 break-inside-avoid bg-mist lg:mb-4"
                style={{ height: item % 2 === 0 ? 180 : 260 }}
              />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-line bg-mist px-6 py-10 text-center text-sm text-mute">
            {error}
          </p>
        ) : photos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-20 text-center">
            <p className="font-serif text-2xl text-ink">还没有照片</p>
            <p className="mt-2 text-sm text-mute">上传第一张作品后，这里就会成为图库。</p>
            <Link
              to="/admin/login"
              className="mt-6 inline-flex rounded-full bg-ink px-5 py-2 text-sm text-white"
            >
              前往管理页
            </Link>
          </div>
        ) : (
          <PhotoGrid photos={photos} />
        )}
      </main>
      <Outlet context={{ photos }} />
    </div>
  )
}
