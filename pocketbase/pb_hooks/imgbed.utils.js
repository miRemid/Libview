function loadEnvFile() {
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
    // .env is optional when IMGBED_* is already exported
  }
  return env
}

function imgbedConfig() {
  const fileEnv = loadEnvFile()
  const url = ($os.getenv('IMGBED_URL') || fileEnv.IMGBED_URL || '').replace(/\/$/, '')
  const token = $os.getenv('IMGBED_TOKEN') || fileEnv.IMGBED_TOKEN || ''
  return { url: url, token: token }
}

function publicUrlFromResponse(baseUrl, json) {
  const item = Array.isArray(json) ? json[0] : json
  if (!item) return ''
  if (item.publicUrl) return item.publicUrl
  if (!item.src) return ''
  if (item.src.indexOf('http') === 0) return item.src
  return baseUrl + item.src
}

function uploadFolder() {
  return 'libview/' + new Date().getFullYear()
}

function uploadToImgbed(app, record) {
  if (record.get('remote_url')) return

  const filename = record.get('image')
  if (!filename) return

  const cfg = imgbedConfig()
  if (!cfg.url || !cfg.token || cfg.url.indexOf('your-imgbed.example') >= 0) {
    console.log('[imgbed] skip: IMGBED_URL / IMGBED_TOKEN 未设置')
    return
  }

  const fsys = app.newFilesystem()
  try {
    const key = record.baseFilesPath() + '/' + filename
    const file = fsys.getReuploadableFile(key, true)
    const form = new FormData()
    form.append('file', file)

    const res = $http.send({
      method: 'POST',
      url: cfg.url + '/upload?returnFormat=full&uploadFolder=' + encodeURIComponent(uploadFolder()),
      headers: { Authorization: 'Bearer ' + cfg.token },
      body: form,
      timeout: 120,
    })

    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.log('[imgbed] upload failed', res.statusCode, toString(res.body))
      return
    }

    const remote = publicUrlFromResponse(cfg.url, res.json)
    if (!remote) {
      console.log('[imgbed] no url in response', res.json)
      return
    }

    record.set('remote_url', remote)
    app.save(record)
    console.log('[imgbed] uploaded', record.id, remote)
  } catch (err) {
    console.log('[imgbed] error', err)
  } finally {
    fsys.close()
  }
}

function purgeLocalFiles(app) {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString().replace('T', ' ')
  const records = app.findRecordsByFilter(
    'photos',
    'remote_url != "" && image != "" && created < {:cutoff}',
    '-created',
    200,
    0,
    { cutoff: cutoff },
  )

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    if (!record) continue
    const filename = record.get('image')
    if (!filename) continue
    try {
      record.set('image-', filename)
      app.save(record)
      console.log('[imgbed] purged local file', record.id)
    } catch (err) {
      console.log('[imgbed] purge failed', record.id, err)
    }
  }
}

module.exports = {
  uploadToImgbed: uploadToImgbed,
  purgeLocalFiles: purgeLocalFiles,
}
