/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = new Collection({
      id: 'pbc_photos_libview',
      type: 'base',
      name: 'photos',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: [],
      fields: [
        {
          name: 'id',
          type: 'text',
          primaryKey: true,
          system: true,
          required: true,
          min: 15,
          max: 15,
          pattern: '^[a-z0-9]+$',
          autogeneratePattern: '[a-z0-9]{15}',
        },
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'photographer',
          type: 'text',
        },
        {
          name: 'image',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['600x0', '1200x0'],
        },
        {
          name: 'remote_url',
          type: 'url',
        },
        {
          name: 'width',
          type: 'number',
          min: 0,
        },
        {
          name: 'height',
          type: 'number',
          min: 0,
        },
        {
          name: 'camera_make',
          type: 'text',
        },
        {
          name: 'camera_model',
          type: 'text',
        },
        {
          name: 'lens',
          type: 'text',
        },
        {
          name: 'focal_length',
          type: 'text',
        },
        {
          name: 'aperture',
          type: 'text',
        },
        {
          name: 'shutter_speed',
          type: 'text',
        },
        {
          name: 'iso',
          type: 'number',
          min: 0,
        },
        {
          name: 'taken_at',
          type: 'date',
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('photos')
    app.delete(collection)
  },
)
