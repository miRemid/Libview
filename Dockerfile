# syntax=docker/dockerfile:1

FROM node:22-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
ARG VITE_PB_URL=
ENV VITE_PB_URL=$VITE_PB_URL
RUN npm run build

FROM alpine:3.21
ARG PB_VERSION=0.40.5
ARG TARGETARCH
RUN apk add --no-cache ca-certificates curl unzip \
  && mkdir -p /pb/pb_data
RUN curl -fsSL -o /tmp/pb.zip \
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" \
  && unzip /tmp/pb.zip -d /tmp/pb \
  && mv /tmp/pb/pocketbase /pb/pocketbase \
  && chmod +x /pb/pocketbase \
  && rm -rf /tmp/pb /tmp/pb.zip
COPY --from=web /app/dist /pb/pb_public
COPY pocketbase/pb_migrations /pb/pb_migrations
COPY pocketbase/pb_hooks /pb/pb_hooks
WORKDIR /pb
EXPOSE 8090
VOLUME /pb/pb_data
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8090/api/health || exit 1
CMD ["./pocketbase","serve","--http=0.0.0.0:8090","--dir=/pb/pb_data","--migrationsDir=/pb/pb_migrations","--hooksDir=/pb/pb_hooks","--publicDir=/pb/pb_public","--indexFallback=true","--automigrate=false"]
