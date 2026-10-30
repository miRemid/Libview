/// <reference path="../pb_data/types.d.ts" />

function adminEmail() {
  return ($os.getenv('PB_ADMIN_EMAIL') || 'admin@libview.local').trim()
}

function adminPassword() {
  return $os.getenv('PB_ADMIN_PASSWORD') || 'LibviewAdmin123'
}

migrate(
  (app) => {
    const email = adminEmail()
    const password = adminPassword()
    const superusers = app.findCollectionByNameOrId('_superusers')
    const record = new Record(superusers)
    record.set('email', email)
    record.set('password', password)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_superusers', adminEmail())
      app.delete(record)
    } catch {
      // already removed
    }
  },
)
