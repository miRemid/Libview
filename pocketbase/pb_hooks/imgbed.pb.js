/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess((e) => {
  e.next()
  const utils = require(`${__hooks}/imgbed.utils.js`)
  utils.uploadToImgbed(e.app, e.record)
}, 'photos')

cronAdd('libview-purge-local', '0 3 * * *', () => {
  const utils = require(`${__hooks}/imgbed.utils.js`)
  utils.purgeLocalFiles($app)
})
