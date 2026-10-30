import { useEffect, useState, type FormEvent } from 'react'
import Field from './Field'
import { formatTakenAt } from '../../lib/exif'
import { infoFromPhoto } from '../../lib/imageInfo'
import { photoUrl, updatePhoto } from '../../lib/api'
import type { ImageInfo, Photo } from '../../lib/types'

type PhotoEditModalProps = {
  photo: Photo
  onClose: () => void
  onSaved: (photo: Photo) => void
}

export default function PhotoEditModal({ photo, onClose, onSaved }: PhotoEditModalProps) {
  const [title, setTitle] = useState(photo.title || '')
  const [description, setDescription] = useState(photo.description || '')
  const [info, setInfo] = useState<ImageInfo>(infoFromPhoto(photo))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data: Record<string, string | number> = {
        title: title.trim(),
        description: description.trim(),
        width: info.width || 0,
        height: info.height || 0,
        camera_make: info.camera_make,
        camera_model: info.camera_model,
        lens: info.lens,
        focal_length: info.focal_length,
        aperture: info.aperture,
        shutter_speed: info.shutter_speed,
        iso: info.iso || 0,
        taken_at: info.taken_at || '',
      }
      const updated = await updatePhoto(photo.id, data)
      onSaved(updated)
      onClose()
    } catch {
      setError('保存失败，请稍后重试。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl border border-line bg-paper p-6 shadow-[0_20px_80px_rgba(0,0,0,0.08)]"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-mute">Edit</p>
            <h2 className="mt-1 font-serif text-2xl text-ink">编辑照片</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-3 py-1 text-sm text-mute hover:text-ink"
          >
            关闭
          </button>
        </div>

        <img
          src={photoUrl(photo, '1200x0')}
          alt={photo.title || '摄影作品'}
          className="mb-5 max-h-48 w-full rounded-2xl object-cover"
        />

        <div className="space-y-4">
          <Field label="标题" value={title} onChange={setTitle} />
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-mute">
              描述
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-ink"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="相机品牌"
              value={info.camera_make}
              onChange={(value) => setInfo((current) => ({ ...current, camera_make: value }))}
            />
            <Field
              label="相机型号"
              value={info.camera_model}
              onChange={(value) => setInfo((current) => ({ ...current, camera_model: value }))}
            />
            <Field
              label="镜头"
              value={info.lens}
              onChange={(value) => setInfo((current) => ({ ...current, lens: value }))}
            />
            <Field
              label="焦距"
              value={info.focal_length}
              onChange={(value) => setInfo((current) => ({ ...current, focal_length: value }))}
            />
            <Field
              label="光圈"
              value={info.aperture}
              onChange={(value) => setInfo((current) => ({ ...current, aperture: value }))}
            />
            <Field
              label="快门"
              value={info.shutter_speed}
              onChange={(value) => setInfo((current) => ({ ...current, shutter_speed: value }))}
            />
            <Field
              label="ISO"
              value={String(info.iso || '')}
              onChange={(value) =>
                setInfo((current) => ({ ...current, iso: Number(value) || 0 }))
              }
            />
            <Field
              label="拍摄时间"
              value={info.taken_at}
              onChange={(value) => setInfo((current) => ({ ...current, taken_at: value }))}
            />
          </div>
          <p className="text-sm text-mute">
            尺寸 {info.width || '—'} × {info.height || '—'}
            {photo.created ? ` · ${formatTakenAt(photo.created)}` : ''}
          </p>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-5 py-2 text-sm text-mute hover:text-ink"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-ink px-5 py-2 text-sm text-white disabled:opacity-60"
          >
            {busy ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
