import { createApp } from "@src/app";
import { config } from "@src/config";
import { AppDataSource } from "@src/db/data-source";
import { logger } from "@src/logger";

const main = async () => {
  await AppDataSource.initialize();
  logger.info({ host: config.db.host, database: config.db.database }, "database connected");

  const server = createApp().listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, "server listening");
    if (config.docs.enabled) {
      const baseUrl = `http://localhost:${config.port}`;
      logger.info({ swagger: `${baseUrl}/docs`, openapi: `${baseUrl}/docs/openapi.json` }, "api docs available");
    }
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "shutting down");
    server.close(async () => {
      await AppDataSource.destroy();
      logger.info("shutdown complete");
      logger.flush();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandled rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception");
  logger.flush();
  process.exit(1);
});

main().catch((err) => {
  logger.fatal({ err }, "failed to start");
  logger.flush();
  process.exit(1);
});
