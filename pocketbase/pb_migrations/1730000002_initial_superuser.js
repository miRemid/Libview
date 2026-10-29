/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const superusers = app.findCollectionByNameOrId('_superusers')
    const record = new Record(superusers)
    record.set('email', 'admin@libview.local')
    record.set('password', 'LibviewAdmin123')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_superusers', 'admin@libview.local')
      app.delete(record)
    } catch {
      // already removed
    }
  },
)
