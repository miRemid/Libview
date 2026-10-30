CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  photographer TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  r2_key TEXT NOT NULL DEFAULT '',
  remote_url TEXT NOT NULL DEFAULT '',
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  camera_make TEXT NOT NULL DEFAULT '',
  camera_model TEXT NOT NULL DEFAULT '',
  lens TEXT NOT NULL DEFAULT '',
  focal_length TEXT NOT NULL DEFAULT '',
  aperture TEXT NOT NULL DEFAULT '',
  shutter_speed TEXT NOT NULL DEFAULT '',
  iso INTEGER NOT NULL DEFAULT 0,
  taken_at TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL,
  updated TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_created ON photos (created DESC);
