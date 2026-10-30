/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId('photos')

  if (!collection.fields.getByName('created')) {
    collection.fields.add(
      new AutodateField({
        name: 'created',
        onCreate: true,
        onUpdate: false,
      }),
    )
  }

  if (!collection.fields.getByName('updated')) {
    collection.fields.add(
      new AutodateField({
        name: 'updated',
        onCreate: true,
        onUpdate: true,
      }),
    )
  }

  app.save(collection)
})
