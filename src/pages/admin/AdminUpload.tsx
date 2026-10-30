import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Field from '../../components/admin/Field'
import { extractImageInfo } from '../../lib/exif'
import { emptyImageInfo } from '../../lib/imageInfo'
import { createPhoto, putObject, signUpload } from '../../lib/api'
import type { ImageInfo } from '../../lib/types'

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [info, setInfo] = useState<ImageInfo>(emptyImageInfo)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fileLabel = useMemo(() => {
    if (!file) return '拖放照片到这里，或点击选择'
    return file.name
  }, [file])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

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
      setInfo(emptyImageInfo)
      setMessage('未能读取 EXIF，仍可手动填写后上传。')
    }
  }

  function resetForm() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview('')
    setTitle('')
    setDescription('')
    setInfo(emptyImageInfo)
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
      const signed = await signUpload(file.type)
      await putObject(signed, file)
      await createPhoto({
        key: signed.key,
        publicUrl: signed.publicUrl,
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
        taken_at: info.taken_at,
      })
      resetForm()
      setMessage('已上传到对象存储并写入数据库。')
    } catch {
      setError('上传失败，请确认已登录且 Worker 正在运行。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.28em] text-mute">Upload</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">上传新图</h1>
      <p className="mt-2 text-sm text-mute">
        图片会直传到 R2，图库使用永久公网地址。发布后可到
        <Link to="/admin/photos" className="mx-1 text-ink underline">
          图片管理
        </Link>
        查看。
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label
          className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-paper px-6 py-12 text-center transition hover:border-ink"
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

        <div className="rounded-3xl border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-mute">图像与相机参数</p>
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
    </div>
  )
}
