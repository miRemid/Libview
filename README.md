# Libview

白色系摄影图片展示站。前台瀑布流浏览作品，管理页上传新图，并自动提取相机参数写入 PocketBase。

图片目前保存在本地 PocketBase 文件存储中。每条记录预留了 `remote_url`，后续迁移到 Cloudflare Imgbed 时只需填写远程地址，前台会优先使用它。

## 技术栈

- React + Vite + Tailwind CSS
- PocketBase（数据库与本地图片存储）
- GitHub 版本管理

## 启动

本机需要已安装 [PocketBase](https://pocketbase.io/)（`pocketbase` 可在 PATH 中找到）和 Node.js。

```bash
npm install
npm run dev
```

- 网站：http://127.0.0.1:5173
- PocketBase：http://127.0.0.1:8090
- 管理页：http://127.0.0.1:5173/admin

首次启动会自动创建 `photos` 集合。超级管理员（Libview 管理页和 PocketBase 面板共用）从环境变量注入：

```bash
PB_ADMIN_EMAIL=admin@libview.local
PB_ADMIN_PASSWORD=your-password
```

未设置时，本地开发仍回退到 `admin@libview.local` / `LibviewAdmin123`。请在正式使用前改掉。

## Docker 部署（SPA + PocketBase）

生产环境把 Vite 打成静态 SPA，交给 PocketBase 同源托管：`/api` 和 `/_/` 是后端，其余路径回退到 `index.html`。

```bash
docker compose up --build -d
```

- 网站：http://127.0.0.1:8090
- 管理后台：http://127.0.0.1:8090/admin
- PocketBase 面板：http://127.0.0.1:8090/_/

当前目录 `.env` 里的 `IMGBED_*` 和 `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` 会传进容器。每次启动都会按这两个变量创建或更新 PocketBase 超级管理员。数据在 Docker volume `pb_data` 里。若要用现有本地库，把 `docker-compose.yml` 里的 volume 改成：

```yaml
volumes:
  - ./pocketbase/pb_data:/pb/pb_data
```

映射 80 端口时写成 `"80:8090"` 即可。

## 图片与元数据

上传时会读取 EXIF，并保存：

- 宽高
- 相机品牌 / 型号
- 镜头
- 焦距、光圈、快门、ISO
- 拍摄时间

文件本体默认写入 `pocketbase/pb_data/storage/`，该目录不进入 Git。
