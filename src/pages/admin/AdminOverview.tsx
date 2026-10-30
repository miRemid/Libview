import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pb, photoUrl } from '../../lib/pocketbase'
import type { Photo } from '../../lib/types'

export default function AdminOverview() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    pb.collection('photos')
      .getFullList<Photo>({ sort: '-created' })
      .then(setPhotos)
      .catch(() => setError('无法加载图库数据。'))
  }, [])

  const recent = photos.slice(0, 4)

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.28em] text-mute">Overview</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">概览</h1>

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-paper px-6 py-5">
          <p className="text-xs uppercase tracking-[0.16em] text-mute">照片</p>
          <p className="mt-3 font-serif text-4xl text-ink">{photos.length}</p>
        </div>
        <Link
          to="/admin/upload"
          className="rounded-3xl border border-line bg-paper px-6 py-5 transition hover:border-ink"
        >
          <p className="text-xs uppercase tracking-[0.16em] text-mute">快捷操作</p>
          <p className="mt-3 font-serif text-2xl text-ink">去上传</p>
        </Link>
        <Link
          to="/admin/photos"
          className="rounded-3xl border border-line bg-paper px-6 py-5 transition hover:border-ink"
        >
          <p className="text-xs uppercase tracking-[0.16em] text-mute">快捷操作</p>
          <p className="mt-3 font-serif text-2xl text-ink">去管理</p>
        </Link>
      </div>

      <h2 className="mt-10 font-serif text-2xl text-ink">最近上传</h2>
      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-mute">还没有照片。</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {recent.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-2xl border border-line bg-paper">
              <img
                src={photoUrl(photo, '600x0')}
                alt={photo.title || '摄影作品'}
                className="h-36 w-full object-cover"
              />
              <p className="truncate px-3 py-2 text-sm text-ink">{photo.title || '未命名'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
