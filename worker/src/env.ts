export type Env = {
  DB: D1Database
  PHOTOS: R2Bucket
  ASSETS?: Fetcher
  PB_ADMIN_EMAIL: string
  PB_ADMIN_PASSWORD: string
  SESSION_SECRET: string
  PUBLIC_R2_HOST: string
  R2_ACCOUNT_ID?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET_NAME?: string
}
