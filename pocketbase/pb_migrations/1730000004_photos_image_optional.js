/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId('photos')
  const field = collection.fields.getByName('image')
  field.required = false
  app.save(collection)
})
