import { AwsClient } from 'aws4fetch'
import { hmacHex, timingSafeEqual } from './crypto'
import type { Env } from './env'
import { HttpError, json, noContent, readJson } from './http'

const PUT_TTL = 300
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const KEY_PATTERN = /^libview\/\d{4}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/

export function isValidKey(key: string): boolean {
  return KEY_PATTERN.test(key)
}

export function objectKey(contentType: string): string {
  const ext = ALLOWED_TYPES[contentType]
  if (!ext) throw new HttpError(400, 'Unsupported image type')
  const year = new Date().getUTCFullYear()
  return `libview/${year}/${crypto.randomUUID()}.${ext}`
}

export function publicUrl(env: Env, key: string): string {
  const host = (env.PUBLIC_R2_HOST || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (host) return `https://${host}/${key}`
  return `/api/files/${key}`
}

function sessionSecret(env: Env): string {
  return env.SESSION_SECRET || 'dev-session-secret-change-me'
}

function canSignS3(env: Env): boolean {
  return Boolean(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_ACCOUNT_ID)
}

async function signS3Put(env: Env, key: string, contentType: string): Promise<string> {
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    service: 's3',
    region: 'auto',
  })
  const bucket = env.R2_BUCKET_NAME || 'libview-photos'
  const url = new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${key}`)
  url.searchParams.set('X-Amz-Expires', String(PUT_TTL))
  const signed = await client.sign(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    aws: { signQuery: true },
  })
  return signed.url
}

async function signLocalPut(
  env: Env,
  key: string,
  contentType: string,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + PUT_TTL
  const payload = `${key}|${contentType}|${exp}`
  const sig = await hmacHex(sessionSecret(env), payload)
  const params = new URLSearchParams({
    key,
    ct: contentType,
    exp: String(exp),
    sig,
  })
  return `/api/uploads/object?${params}`
}

export async function handleSign(request: Request, env: Env): Promise<Response> {
  const body = await readJson<{ contentType?: string }>(request)
  const contentType = (body.contentType || '').trim()
  if (!ALLOWED_TYPES[contentType]) {
    throw new HttpError(400, 'Unsupported image type')
  }
  const key = objectKey(contentType)
  const url = canSignS3(env)
    ? await signS3Put(env, key, contentType)
    : await signLocalPut(env, key, contentType)
  return json({ url, key, publicUrl: publicUrl(env, key) })
}

export async function handleObjectPut(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const key = url.searchParams.get('key') || ''
  const contentType = url.searchParams.get('ct') || ''
  const exp = Number(url.searchParams.get('exp'))
  const sig = url.searchParams.get('sig') || ''
  if (!isValidKey(key) || !ALLOWED_TYPES[contentType]) {
    throw new HttpError(400, 'Invalid upload')
  }
  if (!exp || exp < Math.floor(Date.now() / 1000)) {
    throw new HttpError(400, 'Upload URL expired')
  }
  const expected = await hmacHex(sessionSecret(env), `${key}|${contentType}|${exp}`)
  if (!timingSafeEqual(sig, expected)) {
    throw new HttpError(403, 'Invalid upload signature')
  }
  const actualType = request.headers.get('Content-Type') || ''
  if (actualType !== contentType) {
    throw new HttpError(400, 'Content-Type mismatch')
  }
  await env.PHOTOS.put(key, request.body, {
    httpMetadata: { contentType },
  })
  return noContent()
}

export async function handlePublicFile(request: Request, env: Env): Promise<Response> {
  const key = decodeURIComponent(new URL(request.url).pathname.replace(/^\/api\/files\//, ''))
  if (!isValidKey(key)) throw new HttpError(404, 'Not found')
  const object = await env.PHOTOS.get(key)
  if (!object) throw new HttpError(404, 'Not found')
  const headers = new Headers()
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  return new Response(object.body, { headers })
}

export async function assertObjectExists(env: Env, key: string): Promise<void> {
  if (!isValidKey(key)) throw new HttpError(400, 'Invalid object key')
  const object = await env.PHOTOS.head(key)
  if (!object) throw new HttpError(400, 'Object not found in R2')
}

export async function deleteObject(env: Env, key: string): Promise<void> {
  if (!key) return
  await env.PHOTOS.delete(key)
}
