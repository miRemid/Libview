import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

mkdirSync('dist', { recursive: true })
if (!existsSync('dist/index.html')) {
  writeFileSync(
    'dist/index.html',
    '<!doctype html><title>Libview</title><p>Build the SPA with npm run build.</p>\n',
  )
}
