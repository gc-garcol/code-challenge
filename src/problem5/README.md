# Problem 5 — Resource CRUD API

ExpressJS + TypeScript + TypeORM + PostgreSQL. Có 2 file compose:

| File                      | Mục đích                                                                 |
|---------------------------|--------------------------------------------------------------------------|
| `docker-compose.dev.yml`  | Dev: chỉ chạy Postgres, app chạy trên máy bằng `pnpm dev`                |
| `docker-compose.prod.yml` | Build: image production, Postgres + job migrate + 2 instance app + Nginx |

## Yêu cầu

- Docker + Docker Compose v2
- (Chạy local không Docker) Node.js 24+, pnpm 10+

## Dev

Xem [README.dev.md](README.dev.md): setup local, hot reload, tạo / chạy / rollback migration.

```bash
cd src/problem5
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
set -a && source .env && set +a
pnpm migration:run
pnpm dev
```

## Build / Production (`docker-compose.prod.yml`)

```
                 ┌──────────┐
 client ──:8080──▶  nginx   │  least_conn + failover
                 └────┬─────┘
              ┌───────┴───────┐
         ┌────▼───┐      ┌────▼───┐
         │  app1  │      │  app2  │   Express + TypeORM
         └────┬───┘      └────┬───┘
              └───────┬───────┘
                 ┌────▼─────┐
                 │ postgres │
                 └──────────┘
```

| Service    | Mô tả                                                                 |
|------------|-----------------------------------------------------------------------|
| `postgres` | PostgreSQL 17, data lưu ở volume `pgdata`                             |
| `migrate`  | Build image `problem5-app` (target `runtime`), apply migrations rồi thoát |
| `app1/2`   | 2 instance dùng chung image, chỉ start sau khi `migrate` thành công   |
| `nginx`    | Reverse proxy, cân bằng tải `least_conn`, tự chuyển request sang instance còn sống khi một instance lỗi (`proxy_next_upstream`, `max_fails`) |

Migration tách thành service riêng để 2 instance không cùng chạy migrate đồng thời. Mỗi response có header `X-Instance-Id` (instance xử lý) và `X-Upstream-Addr` (do nginx thêm).

```bash
cd src/problem5
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app1 app2 nginx
docker compose -f docker-compose.prod.yml down -v
```

API: `http://localhost:8080`.

### Kiểm tra load balancing

```bash
for i in 1 2 3 4; do curl -s http://localhost:8080/health; echo; done
docker compose -f docker-compose.prod.yml stop app1
curl -s http://localhost:8080/health
docker compose -f docker-compose.prod.yml start app1
```

Khi `app1` bị tắt, request vẫn thành công qua `app2`.

### Build không dùng Docker

```bash
pnpm install
pnpm build
pnpm migration:run:prod
pnpm start
```

### Migration trên production

```bash
docker compose -f docker-compose.prod.yml run --rm --no-deps migrate node dist/db/migrate.js show
docker compose -f docker-compose.prod.yml run --rm --no-deps migrate node dist/db/migrate.js revert
docker compose -f docker-compose.prod.yml run --rm --no-deps migrate node dist/db/migrate.js run
```

Chi tiết xem [README.dev.md](README.dev.md#database-migration).

## Biến môi trường

Biến cho compose (override qua shell hoặc file `.env`):

| Biến             | Mặc định dev | Mặc định prod | Mô tả                         |
|------------------|--------------|---------------|-------------------------------|
| `APP_PORT`       | —            | `8080`        | Port public của nginx         |
| `DB_EXPOSE_PORT` | `5432`       | `5432`        | Port Postgres expose ra host  |
| `DB_USER`        | `postgres`   | `postgres`    |                               |
| `DB_PASSWORD`    | `postgres`   | `postgres`    |                               |
| `DB_NAME`        | `resources`  | `resources`   |                               |
| `LOG_LEVEL`      | —            | `info`        | Level log của app             |

Nếu máy đã có Postgres chạy ở 5432: `DB_EXPOSE_PORT=55432 docker compose -f ... up -d --build`.

Biến của app:

| Biến          | Mặc định    | Mô tả |
|---------------|-------------|-------|
| `PORT`        | `3000`      |       |
| `INSTANCE_ID` | hostname    |       |
| `DB_HOST`     | `localhost` |       |
| `DB_PORT`     | `5432`      |       |
| `DB_USER`     | `postgres`  |       |
| `DB_PASSWORD` | `postgres`  |       |
| `DB_NAME`     | `resources` |       |
| `DB_LOGGING`  | `false`     | `true` để log mọi SQL query (level `info`) |
| `DB_SLOW_QUERY_MS` | `1000` | Query chậm hơn ngưỡng này log `warn` |
| `NODE_ENV`    | `development` | `production` trong image build |
| `LOG_LEVEL`   | `info`      | `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal` |
| `LOG_PRETTY`  | `true` nếu không phải production | Log dạng dễ đọc (pino-pretty) thay vì JSON |
| `DOCS_ENABLED`| `true`      | Bật/tắt Swagger UI `/docs` |

## Swagger / OpenAPI

| URL                  | Mô tả                    |
|----------------------|--------------------------|
| `/docs`              | Swagger UI               |
| `/docs/openapi.json` | OpenAPI 3.1 spec (JSON)  |

Ví dụ: `http://localhost:8080/docs` (prod) hoặc `http://localhost:3000/docs` (dev). Spec được sinh từ chính các zod schema dùng để validate request (`zod-openapi`), nên tài liệu luôn khớp với validation. Tắt bằng `DOCS_ENABLED=false`.

## Logging

Dùng `pino` + `pino-http`:

- **Format**: dev in dạng dễ đọc một dòng (`pino-pretty`); production (`NODE_ENV=production`) in JSON ra stdout để đẩy vào hệ thống log.
- **Request log**: mỗi request một dòng, gồm method, url, status, thời gian xử lý. `4xx` → `warn`, `5xx` → `error` (kèm stack). Bỏ qua `/health` và `/docs`.
- **Request id**: lấy từ header `X-Request-Id` nếu client gửi, nếu không thì tự sinh; luôn trả lại trong response header `X-Request-Id`. Lỗi `500` trả `requestId` trong body để tra log.
- **SQL log**: log của TypeORM đi qua pino (`module: "db"`) và tự gắn request id của request đang xử lý (AsyncLocalStorage). Luôn log query lỗi và query chậm (`DB_SLOW_QUERY_MS`); log mọi query khi `DB_LOGGING=true`.
- **Instance**: mỗi dòng log có field `instance` (`app1`/`app2`).
- **Nginx**: access log dạng JSON gồm `request_id`, `upstream`, `upstream_status`, `request_time`. Nginx sinh request id nếu client không gửi và chuyển xuống app, nên có thể nối log nginx với log app bằng cùng một id.

```bash
docker compose -f docker-compose.prod.yml logs -f app1 app2 nginx
docker compose -f docker-compose.prod.yml logs app1 app2 nginx | grep <request-id>
```

## API

Model `Resource`:

| Field         | Kiểu                                          |
|---------------|-----------------------------------------------|
| `id`          | uuid                                          |
| `name`        | string (1–255), bắt buộc                      |
| `description` | string \| null                                |
| `category`    | string (1–100), bắt buộc                      |
| `status`      | `active` \| `inactive` (mặc định `active`)    |
| `createdAt`   | ISO datetime                                  |
| `updatedAt`   | ISO datetime                                  |

| Method   | Path             | Mô tả                   | Status |
|----------|------------------|-------------------------|--------|
| `GET`    | `/health`        | Health check + instance | 200    |
| `POST`   | `/resources`     | Tạo resource            | 201    |
| `GET`    | `/resources`     | Danh sách + filter/sort | 200    |
| `GET`    | `/resources/:id` | Chi tiết                | 200    |
| `PATCH`  | `/resources/:id` | Cập nhật một phần       | 200    |
| `DELETE` | `/resources/:id` | Xoá cứng khỏi DB        | 204    |

### Query params cho `GET /resources`

| Param         | Mô tả                                                        |
|---------------|--------------------------------------------------------------|
| `name`        | Tìm gần đúng, không phân biệt hoa thường                     |
| `category`    | Khớp chính xác                                               |
| `status`      | `active` \| `inactive`                                       |
| `createdFrom` | Ngày tạo từ (ISO date)                                       |
| `createdTo`   | Ngày tạo đến (ISO date)                                      |
| `sort`        | Lặp lại được, dạng `field,direction`. Field: `name`, `category`, `status`, `createdAt`, `updatedAt` |
| `page`        | Mặc định `1`                                                 |
| `limit`       | 1–100, mặc định `20`                                         |

Quy tắc sort:

- Mỗi tiêu chí sort là một param `sort=field,direction`, lặp lại để sort nhiều cột: `?sort=status,Asc&sort=category,desc`.
- Thứ tự các param `sort` là thứ tự ưu tiên khi sort.
- `field` và `direction` không phân biệt hoa thường (`Asc`, `DESC`, `createdat` đều hợp lệ).
- Bỏ `direction` thì mặc định `asc` (`?sort=name`).
- Không truyền `sort` thì mặc định `createdAt,desc`.
- Field không hợp lệ, direction không phải `asc`/`desc`, sai định dạng (`name,asc,x`) hoặc trùng field → `400`.
- Luôn thêm `id` làm tiebreaker cuối để phân trang ổn định.

Response:

```json
{
  "data": [ { "id": "...", "name": "..." } ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "sort": [ { "field": "status", "order": "desc" }, { "field": "name", "order": "asc" } ]
  }
}
```

### Index

| Index                      | Cột                      | Dùng cho                          |
|----------------------------|--------------------------|-----------------------------------|
| `IDX_resources_created_at` | `(created_at, id)`       | List mặc định, sort theo ngày tạo |
| `IDX_resources_category`   | `(category, created_at)` | Lọc theo `category`               |
| `IDX_resources_status`     | `(status, created_at)`   | Lọc theo `status`                 |

### Ví dụ

```bash
curl -X POST http://localhost:8080/resources \
  -H 'Content-Type: application/json' \
  -d '{"name":"Laptop","category":"hardware","description":"MacBook Pro"}'

curl "http://localhost:8080/resources?category=hardware&name=lap"

curl "http://localhost:8080/resources?sort=status,Asc&sort=category,desc&sort=createdAt,desc"

curl http://localhost:8080/resources/<id>

curl -X PATCH http://localhost:8080/resources/<id> \
  -H 'Content-Type: application/json' \
  -d '{"status":"inactive"}'

curl -X DELETE http://localhost:8080/resources/<id>
```

### Lỗi

| Status | Khi nào                                        |
|--------|------------------------------------------------|
| 400    | Body/query/id không hợp lệ, JSON sai cú pháp   |
| 404    | Không tìm thấy resource hoặc route             |
| 500    | Lỗi không mong đợi                             |

```json
{ "error": "Validation failed", "details": [ ... ] }
{ "error": "Internal server error", "requestId": "7edb6364-..." }
```

## Cấu trúc thư mục

```
src/problem5
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Dockerfile
├── README.dev.md
├── nginx/nginx.conf
├── src
│   ├── index.ts
│   ├── app.ts
│   ├── config/index.ts
│   ├── db
│   │   ├── data-source.ts
│   │   ├── migrate.ts
│   │   ├── typeorm-logger.ts
│   │   └── migrations/1790000000000-CreateResources.ts
│   ├── docs/openapi.ts
│   ├── entities/resource.entity.ts
│   ├── errors
│   │   ├── index.ts
│   │   └── http-error.ts
│   ├── logger
│   │   ├── index.ts
│   │   └── context.ts
│   ├── middlewares
│   │   ├── error-handler.ts
│   │   ├── http-logger.ts
│   │   ├── instance-id.ts
│   │   └── request-context.ts
│   ├── routers
│   │   ├── index.ts
│   │   ├── docs.router.ts
│   │   ├── health.router.ts
│   │   └── resource.router.ts
│   ├── schemas
│   │   ├── common.schema.ts
│   │   └── resource.schema.ts
│   └── services/resource.service.ts
└── README.md
```

Mọi import nội bộ dùng alias `@src/...` (khai báo ở `paths` trong `tsconfig.json`). Khi dev, `tsx` tự resolve alias; khi build, `tsc-alias` rewrite alias thành đường dẫn tương đối trong `dist`.
