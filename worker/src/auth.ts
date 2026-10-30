import { hmacHex, timingSafeEqual, b64urlDecode, b64urlEncode } from './crypto'
import type { Env } from './env'
import { HttpError, json, readJson } from './http'

const COOKIE = 'lv_session'
const MAX_AGE = 60 * 60 * 24 * 7

type Session = {
  v: 1
  email: string
  exp: number
}

function cookieValue(header: string | null): string {
  if (!header) return ''
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE) return rest.join('=')
  }
  return ''
}

function sessionSecret(env: Env): string {
  return env.SESSION_SECRET || 'dev-session-secret-change-me'
}

async function signSession(env: Env, email: string): Promise<string> {
  const payload: Session = {
    v: 1,
    email,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  }
  const encoded = b64urlEncode(JSON.stringify(payload))
  const signature = await hmacHex(sessionSecret(env), encoded)
  return `${encoded}.${signature}`
}

export async function readSession(request: Request, env: Env): Promise<Session | null> {
  const token = cookieValue(request.headers.get('Cookie'))
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null
  const expected = await hmacHex(sessionSecret(env), encoded)
  if (!timingSafeEqual(signature, expected)) return null
  try {
    const payload = JSON.parse(b64urlDecode(encoded)) as Session
    if (payload.v !== 1 || !payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

function cookieHeader(token: string, request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === 'https:'
  const parts = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export async function requireAdmin(request: Request, env: Env): Promise<Session> {
  const session = await readSession(request, env)
  if (!session) throw new HttpError(401, 'Unauthorized')
  return session
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await readJson<{ email?: string; password?: string }>(request)
  const email = (body.email || '').trim()
  const password = body.password || ''
  const expectedEmail = env.PB_ADMIN_EMAIL || 'admin@libview.local'
  const expectedPassword = env.PB_ADMIN_PASSWORD || 'LibviewAdmin123'
  const emailOk = timingSafeEqual(email, expectedEmail)
  const passwordOk = timingSafeEqual(password, expectedPassword)
  if (!emailOk || !passwordOk) {
    throw new HttpError(401, 'Invalid credentials')
  }
  const token = await signSession(env, expectedEmail)
  const response = json({ email: expectedEmail })
  response.headers.set('Set-Cookie', cookieHeader(token, request, MAX_AGE))
  return response
}

export async function handleLogout(request: Request): Promise<Response> {
  const response = json({ ok: true })
  response.headers.set('Set-Cookie', cookieHeader('', request, 0))
  return response
}

export async function handleMe(request: Request, env: Env): Promise<Response> {
  const session = await readSession(request, env)
  if (!session) throw new HttpError(401, 'Unauthorized')
  return json({ email: session.email })
}
