import type { Env } from './env'
import { asNumber, asString, HttpError, json, newId, noContent, nowIso, readJson } from './http'
import { assertObjectExists, deleteObject, isValidKey, objectResponse, publicUrl } from './r2'

export type PhotoRow = {
  id: string
  title: string
  description: string
  photographer: string
  image: string
  r2_key: string
  remote_url: string
  width: number
  height: number
  camera_make: string
  camera_model: string
  lens: string
  focal_length: string
  aperture: string
  shutter_speed: string
  iso: number
  taken_at: string
  created: string
  updated: string
}

function toPhoto(row: PhotoRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    photographer: row.photographer,
    image: row.image,
    remote_url: row.remote_url,
    width: row.width,
    height: row.height,
    camera_make: row.camera_make,
    camera_model: row.camera_model,
    lens: row.lens,
    focal_length: row.focal_length,
    aperture: row.aperture,
    shutter_speed: row.shutter_speed,
    iso: row.iso,
    taken_at: row.taken_at,
    created: row.created,
    updated: row.updated,
  }
}

async function findPhoto(env: Env, id: string): Promise<PhotoRow> {
  const row = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first<PhotoRow>()
  if (!row) throw new HttpError(404, 'Photo not found')
  return row
}

export async function handleListPhotos(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    'SELECT * FROM photos ORDER BY created DESC',
  ).all<PhotoRow>()
  return json((result.results || []).map(toPhoto))
}

export async function handleGetPhoto(env: Env, id: string): Promise<Response> {
  const row = await findPhoto(env, id)
  return json(toPhoto(row))
}

export async function handlePhotoFile(env: Env, id: string): Promise<Response> {
  const row = await findPhoto(env, id)
  return objectResponse(env, row.r2_key)
}

export async function handleCreatePhoto(request: Request, env: Env): Promise<Response> {
  const body = await readJson<Record<string, unknown>>(request)
  const key = asString(body.key)
  if (!isValidKey(key)) throw new HttpError(400, 'Invalid object key')
  await assertObjectExists(env, key)

  const now = nowIso()
  const row: PhotoRow = {
    id: newId(),
    title: asString(body.title).trim(),
    description: asString(body.description).trim(),
    photographer: asString(body.photographer).trim(),
    image: '',
    r2_key: key,
    remote_url: asString(body.publicUrl) || publicUrl(env, key),
    width: asNumber(body.width),
    height: asNumber(body.height),
    camera_make: asString(body.camera_make),
    camera_model: asString(body.camera_model),
    lens: asString(body.lens),
    focal_length: asString(body.focal_length),
    aperture: asString(body.aperture),
    shutter_speed: asString(body.shutter_speed),
    iso: asNumber(body.iso),
    taken_at: asString(body.taken_at),
    created: now,
    updated: now,
  }

  await env.DB.prepare(
    `INSERT INTO photos (
      id, title, description, photographer, image, r2_key, remote_url,
      width, height, camera_make, camera_model, lens, focal_length,
      aperture, shutter_speed, iso, taken_at, created, updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      row.id,
      row.title,
      row.description,
      row.photographer,
      row.image,
      row.r2_key,
      row.remote_url,
      row.width,
      row.height,
      row.camera_make,
      row.camera_model,
      row.lens,
      row.focal_length,
      row.aperture,
      row.shutter_speed,
      row.iso,
      row.taken_at,
      row.created,
      row.updated,
    )
    .run()

  return json(toPhoto(row), 201)
}

export async function handleUpdatePhoto(
  request: Request,
  env: Env,
  id: string,
): Promise<Response> {
  const existing = await findPhoto(env, id)
  const body = await readJson<Record<string, unknown>>(request)
  const next: PhotoRow = {
    ...existing,
    title: asString(body.title ?? existing.title).trim(),
    description: asString(body.description ?? existing.description).trim(),
    photographer: asString(body.photographer ?? existing.photographer).trim(),
    width: body.width === undefined ? existing.width : asNumber(body.width),
    height: body.height === undefined ? existing.height : asNumber(body.height),
    camera_make: asString(body.camera_make ?? existing.camera_make),
    camera_model: asString(body.camera_model ?? existing.camera_model),
    lens: asString(body.lens ?? existing.lens),
    focal_length: asString(body.focal_length ?? existing.focal_length),
    aperture: asString(body.aperture ?? existing.aperture),
    shutter_speed: asString(body.shutter_speed ?? existing.shutter_speed),
    iso: body.iso === undefined ? existing.iso : asNumber(body.iso),
    taken_at: asString(body.taken_at ?? existing.taken_at),
    updated: nowIso(),
  }

  await env.DB.prepare(
    `UPDATE photos SET
      title = ?, description = ?, photographer = ?, width = ?, height = ?,
      camera_make = ?, camera_model = ?, lens = ?, focal_length = ?,
      aperture = ?, shutter_speed = ?, iso = ?, taken_at = ?, updated = ?
     WHERE id = ?`,
  )
    .bind(
      next.title,
      next.description,
      next.photographer,
      next.width,
      next.height,
      next.camera_make,
      next.camera_model,
      next.lens,
      next.focal_length,
      next.aperture,
      next.shutter_speed,
      next.iso,
      next.taken_at,
      next.updated,
      id,
    )
    .run()

  return json(toPhoto(next))
}

export async function handleDeletePhoto(env: Env, id: string): Promise<Response> {
  const row = await findPhoto(env, id)
  await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run()
  await deleteObject(env, row.r2_key)
  return noContent()
}
