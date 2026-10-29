/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const settings = app.settings()
  settings.meta.appName = 'Libview'
  settings.meta.appURL = 'http://127.0.0.1:5173'
  app.save(settings)
})
