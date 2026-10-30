# Libview

白色系摄影图片展示站。前台瀑布流浏览作品，管理页上传新图，并自动提取相机参数。

本分支运行时是 **Cloudflare Worker + D1 + R2**：浏览器把原图预签名直传到 R2，D1 保存永久公网 URL，博客可以直接引用这条地址。不要把 `*.r2.dev` 当正式外链（有限流、也不适合当 CDN 域名）。

仓库里仍保留 Docker / PocketBase 文件，但它们不是这条分支的运行时。

## 技术栈

- React + Vite + Tailwind CSS
- Cloudflare Worker（同源 `/api`）
- D1（照片元数据）
- R2（原图主存储，自定义域名公网读）

## 启动

需要 Node.js，以及 Wrangler（`npm install` 会装到开发依赖）。

```bash
cp .dev.vars.example .dev.vars
npm install
npm run d1:migrate:local
npm run dev
```

- 网站：http://127.0.0.1:5173
- Worker API：http://127.0.0.1:8787
- 管理页：http://127.0.0.1:5173/admin

本地没有 R2 S3 API Token 时，预签名 URL 会回落到同源 `PUT /api/uploads/object`，对象写入 Wrangler 模拟的 R2。图库用 `/api/files/{key}` 读图。

默认管理员来自 `.dev.vars`：

```
PB_ADMIN_EMAIL=admin@libview.local
PB_ADMIN_PASSWORD=LibviewAdmin123
```

请在正式使用前改掉，并设置足够长的 `SESSION_SECRET`。

## 生产部署

1. 在 Cloudflare 创建 D1 数据库和 R2 桶：

   ```bash
   npx wrangler d1 create libview
   npx wrangler r2 bucket create libview-photos
   ```

   把返回的 `database_id` 写入 `wrangler.toml`。

2. 给 R2 桶绑定**自定义域名**（例如 `img.example.com`）。对象 key 是不可变路径 `libview/年/uuid.ext`，公网地址形如：

   `https://img.example.com/libview/2026/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.jpg`

3. 把该域名写入 Wrangler vars（不要带协议）：

   ```bash
   npx wrangler secret put SESSION_SECRET
   npx wrangler secret put PB_ADMIN_EMAIL
   npx wrangler secret put PB_ADMIN_PASSWORD
   npx wrangler secret put R2_ACCOUNT_ID
   npx wrangler secret put R2_ACCESS_KEY_ID
   npx wrangler secret put R2_SECRET_ACCESS_KEY
   ```

   并在 `wrangler.toml` 的 `[vars]` 设置：

   ```toml
   PUBLIC_R2_HOST = "img.example.com"
   R2_BUCKET_NAME = "libview-photos"
   ```

   R2 API Token 需要该桶的 Object Read & Write，用来签发短 TTL、单对象、仅 PUT 的预签名 URL。Account ID / Token 不会进前端。

4. 在 R2 桶 CORS 里允许站点源 `GET`/`HEAD`（详情页水印会跨域读原图）。仓库里有 `worker/cors.json`：

   ```bash
   npx wrangler r2 bucket cors set libview-photos --file worker/cors.json
   ```

   自定义域名仍只做公网读；不要开放列桶。水印也会走同源 `/api/photos/:id/file`，不依赖 CORS。

5. 迁移并发布：

   ```bash
   npm run d1:migrate
   npm run worker:deploy
   ```

Worker Static Assets 托管 Vite `dist`。`wrangler.toml` 里 `not_found_handling = "single-page-application"`，所以刷新 `/photos/:id` 不会 404。`/api/*` 由 Worker 先处理。

## 图片与元数据

上传流程：登录 Cookie → `POST /api/uploads/sign` → 浏览器 `PUT` 原图到 R2 → `POST /api/photos`（Worker `Head` 确认对象后写入 D1）。

EXIF 仍在浏览器读取，并保存：

- 宽高
- 相机品牌 / 型号
- 镜头
- 焦距、光圈、快门、ISO
- 拍摄时间

`remote_url` 就是 R2 公网地址，图库和博客都用这一条。删除照片时会同时删除 D1 记录和 R2 对象。
