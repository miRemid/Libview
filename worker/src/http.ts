export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(data, { status, headers })
}

export function noContent(): Response {
  return new Response(null, { status: 204 })
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new HttpError(400, 'Invalid JSON body')
  }
}

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json({ error: error.message }, error.status)
  }
  console.error(error)
  return json({ error: 'Internal error' }, 500)
}

export function nowIso(): string {
  return new Date().toISOString().replace('T', ' ')
}

export function newId(length = 15): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let id = ''
  for (const byte of bytes) id += alphabet[byte % alphabet.length]
  return id
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function asNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
