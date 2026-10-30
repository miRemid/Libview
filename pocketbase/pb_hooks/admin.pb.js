/// <reference path="../pb_data/types.d.ts" />

onBootstrap((e) => {
  e.next()

  const env = {}
  try {
    const raw = toString($os.readFile($os.getwd() + '/.env'))
    const lines = raw.split('\n')
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim()
      if (!line || line.indexOf('#') === 0) continue
      const eq = line.indexOf('=')
      if (eq < 1) continue
      const key = line.substring(0, eq).trim()
      let val = line.substring(eq + 1).trim()
      const quote = val.charAt(0)
      if ((quote === '"' || quote === "'") && val.charAt(val.length - 1) === quote) {
        val = val.substring(1, val.length - 1)
      }
      env[key] = val
    }
  } catch (err) {
    // .env is optional when PB_ADMIN_* is already exported
  }

  const email = ($os.getenv('PB_ADMIN_EMAIL') || env.PB_ADMIN_EMAIL || '').trim()
  const password = $os.getenv('PB_ADMIN_PASSWORD') || env.PB_ADMIN_PASSWORD || ''
  if (!email || !password) {
    console.log('[admin] skip: PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD 未设置')
    return
  }

  try {
    const collection = $app.findCollectionByNameOrId('_superusers')
    let record
    try {
      record = $app.findAuthRecordByEmail('_superusers', email)
    } catch (err) {
      record = new Record(collection)
    }
    record.set('email', email)
    record.set('password', password)
    $app.save(record)
    console.log('[admin] superuser ready', email)
  } catch (err) {
    console.log('[admin] upsert failed', err)
  }
})
