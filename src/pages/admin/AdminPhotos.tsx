import { useEffect, useState } from 'react'
import PhotoEditModal from '../../components/admin/PhotoEditModal'
import { cameraLine, formatTakenAt } from '../../lib/exif'
import { pb, photoUrl } from '../../lib/pocketbase'
import type { Photo } from '../../lib/types'

export default function AdminPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Photo | null>(null)

  useEffect(() => {
    let cancelled = false
    pb.collection('photos')
      .getFullList<Photo>({ sort: '-created' })
      .then((records) => {
        if (!cancelled) setPhotos(records)
      })
      .catch(() => {
        if (!cancelled) setError('无法加载照片列表。')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onDelete(id: string) {
    if (!confirm('确定删除这张照片？')) return
    await pb.collection('photos').delete(id)
    setPhotos((current) => current.filter((photo) => photo.id !== id))
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.28em] text-mute">Library</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">图片管理</h1>
      <p className="mt-2 text-sm text-mute">共 {photos.length} 张。点击编辑可修改标题和相机参数。</p>

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-paper">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-mute">
            <tr>
              <th className="px-4 py-3 font-medium">预览</th>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">相机</th>
              <th className="px-4 py-3 font-medium">尺寸</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {photos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-mute">
                  还没有已发布的照片。
                </td>
              </tr>
            ) : (
              photos.map((photo) => (
                <tr key={photo.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <img
                      src={photoUrl(photo, '600x0')}
                      alt={photo.title || '摄影作品'}
                      className="h-14 w-20 rounded-lg object-cover"
                    />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-ink">
                    {photo.title || '未命名'}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-mute">
                    {cameraLine(photo) || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-mute">
                    {photo.width && photo.height ? `${photo.width} × ${photo.height}` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-mute">
                    {formatTakenAt(photo.created) || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditing(photo)}
                      className="mr-3 text-ink hover:underline"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(photo.id)}
                      className="text-mute hover:text-red-600"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <PhotoEditModal
          photo={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setPhotos((current) =>
              current.map((photo) => (photo.id === updated.id ? updated : photo)),
            )
          }}
        />
      ) : null}
    </div>
  )
}
