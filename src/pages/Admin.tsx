import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { extractImageInfo } from '../lib/exif'
import { isAdmin, pb, photoUrl } from '../lib/pocketbase'
import type { ImageInfo, Photo } from '../lib/types'

const emptyInfo: ImageInfo = {
  width: 0,
  height: 0,
  camera_make: '',
  camera_model: '',
  lens: '',
  focal_length: '',
  aperture: '',
  shutter_speed: '',
  iso: 0,
  taken_at: '',
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-mute">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-ink"
      />
    </label>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const allowed = isAdmin()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photographer, setPhotographer] = useState('')
  const [info, setInfo] = useState<ImageInfo>(emptyInfo)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fileLabel = useMemo(() => {
    if (!file) return '拖放照片到这里，或点击选择'
    return file.name
  }, [file])

  useEffect(() => {
    if (!allowed) {
      navigate('/admin/login', { replace: true })
      return
    }
    void loadPhotos()
  }, [allowed, navigate])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function loadPhotos() {
    const records = await pb.collection('photos').getFullList<Photo>({
      sort: '-created',
    })
    setPhotos(records)
  }

  async function onFile(next: File | undefined) {
    if (!next) return
    if (preview) URL.revokeObjectURL(preview)
    setFile(next)
    setPreview(URL.createObjectURL(next))
    setTitle((current) => current || next.name.replace(/\.[^.]+$/, ''))
    setError('')
    setMessage('正在读取相机参数…')
    try {
      const extracted = await extractImageInfo(next)
      setInfo(extracted)
      setMessage('已提取图像信息，可确认后发布。')
    } catch {
      setInfo(emptyInfo)
      setMessage('未能读取 EXIF，仍可手动填写后上传。')
    }
  }

  function resetForm() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview('')
    setTitle('')
    setDescription('')
    setPhotographer('')
    setInfo(emptyInfo)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      setError('请先选择一张图片。')
      return
    }
    setBusy(true)
    setError('')
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('title', title.trim())
      form.append('description', description.trim())
      form.append('photographer', photographer.trim())
      form.append('width', String(info.width || 0))
      form.append('height', String(info.height || 0))
      form.append('camera_make', info.camera_make)
      form.append('camera_model', info.camera_model)
      form.append('lens', info.lens)
      form.append('focal_length', info.focal_length)
      form.append('aperture', info.aperture)
      form.append('shutter_speed', info.shutter_speed)
      form.append('iso', String(info.iso || 0))
      if (info.taken_at) form.append('taken_at', info.taken_at)

      await pb.collection('photos').create(form)
      resetForm()
      setMessage('已上传并写入数据库。')
      await loadPhotos()
    } catch {
      setError('上传失败，请确认已登录且 PocketBase 正在运行。')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm('确定删除这张照片？')) return
    await pb.collection('photos').delete(id)
    setPhotos((current) => current.filter((photo) => photo.id !== id))
  }

  function logout() {
    pb.authStore.clear()
    navigate('/admin/login', { replace: true })
  }

  if (!allowed) return null

  return (
    <div className="min-h-screen bg-paper">
      <Header solid />
      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-mute">Admin</p>
              <h1 className="mt-2 font-serif text-4xl text-ink">上传新图</h1>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-mute transition-colors hover:text-ink"
            >
              退出登录
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-mist px-6 py-12 text-center transition hover:border-ink"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                onFile(event.dataTransfer.files[0])
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="预览"
                  className="mb-4 max-h-72 w-auto max-w-full object-contain"
                />
              ) : (
                <span className="mb-3 font-serif text-2xl text-ink">选择照片</span>
              )}
              <span className="text-sm text-mute">{fileLabel}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => onFile(event.target.files?.[0])}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="标题" value={title} onChange={setTitle} />
              <Field
                label="摄影师"
                value={photographer}
                onChange={setPhotographer}
              />
            </div>
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

            <div className="rounded-3xl border border-line p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-mute">
                图像与相机参数
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <p className="mt-4 text-sm text-mute">
                尺寸 {info.width || '—'} × {info.height || '—'}
              </p>
            </div>

            {message ? <p className="text-sm text-mute">{message}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-ink px-6 py-3 text-sm text-white disabled:opacity-60"
            >
              {busy ? '正在保存…' : '发布到图库'}
            </button>
          </form>
        </section>

        <aside>
          <h2 className="font-serif text-2xl text-ink">已发布</h2>
          <p className="mt-1 text-sm text-mute">图片保存在本地 PocketBase 存储中。</p>
          <div className="mt-6 space-y-4">
            {photos.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-mute">
                还没有已发布的照片。
              </p>
            ) : (
              photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-2xl border border-line">
                  <img
                    src={photoUrl(photo, '600x0')}
                    alt={photo.title || '摄影作品'}
                    className="h-36 w-full object-cover"
                  />
                  <div className="flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{photo.title || '未命名'}</p>
                      <p className="truncate text-xs text-mute">
                        {photo.camera_model || '无相机信息'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(photo.id)}
                      className="shrink-0 text-xs text-mute hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
