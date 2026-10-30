import { handleLogin, handleLogout, handleMe, requireAdmin } from './auth'
import type { Env } from './env'
import { errorResponse, HttpError, json } from './http'
import {
  handleCreatePhoto,
  handleDeletePhoto,
  handleGetPhoto,
  handleListPhotos,
  handlePhotoFile,
  handleUpdatePhoto,
} from './photos'
import { handleObjectPut, handlePublicFile, handleSign } from './r2'

function match(path: string, pattern: RegExp): string[] | null {
  const found = path.match(pattern)
  return found ? found.slice(1) : null
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  if (path === '/api/auth/login' && method === 'POST') {
    return handleLogin(request, env)
  }
  if (path === '/api/auth/logout' && method === 'POST') {
    return handleLogout(request)
  }
  if (path === '/api/auth/me' && method === 'GET') {
    return handleMe(request, env)
  }
  if (path === '/api/photos' && method === 'GET') {
    return handleListPhotos(env)
  }
  const photoFile = match(path, /^\/api\/photos\/([^/]+)\/file$/)
  if (photoFile && method === 'GET') {
    return handlePhotoFile(env, photoFile[0])
  }
  const photoId = match(path, /^\/api\/photos\/([^/]+)$/)
  if (photoId && method === 'GET') {
    return handleGetPhoto(env, photoId[0])
  }
  if (path.startsWith('/api/files/') && method === 'GET') {
    return handlePublicFile(request, env)
  }
  if (path === '/api/uploads/object' && method === 'PUT') {
    return handleObjectPut(request, env)
  }

  if (path.startsWith('/api/')) {
    await requireAdmin(request, env)
    if (path === '/api/uploads/sign' && method === 'POST') {
      return handleSign(request, env)
    }
    if (path === '/api/photos' && method === 'POST') {
      return handleCreatePhoto(request, env)
    }
    if (photoId && method === 'PATCH') {
      return handleUpdatePhoto(request, env, photoId[0])
    }
    if (photoId && method === 'DELETE') {
      return handleDeletePhoto(env, photoId[0])
    }
    throw new HttpError(404, 'Not found')
  }

  if (env.ASSETS) {
    return env.ASSETS.fetch(request)
  }
  return json({ error: 'Not found' }, 404)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env)
    } catch (error) {
      return errorResponse(error)
    }
  },
}
