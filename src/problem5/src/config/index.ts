import os from "node:os";

const env = process.env;
const nodeEnv = env.NODE_ENV ?? "development";

export const config = {
  nodeEnv,
  port: Number(env.PORT ?? 3000),
  instanceId: env.INSTANCE_ID ?? os.hostname(),
  log: {
    level: env.LOG_LEVEL ?? "info",
    pretty: env.LOG_PRETTY ? env.LOG_PRETTY === "true" : nodeEnv !== "production",
  },
  db: {
    host: env.DB_HOST ?? "localhost",
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER ?? "postgres",
    password: env.DB_PASSWORD ?? "postgres",
    database: env.DB_NAME ?? "resources",
    logging: env.DB_LOGGING === "true",
    slowQueryMs: Number(env.DB_SLOW_QUERY_MS ?? 1000),
  },
  docs: {
    enabled: env.DOCS_ENABLED ? env.DOCS_ENABLED === "true" : true,
  },
};
