import { Logger as TypeOrmLogger } from "typeorm";
import { currentLogger } from "@src/logger/context";

const collapse = (query: string) => query.replace(/\s+/g, " ").trim();

export class PinoTypeOrmLogger implements TypeOrmLogger {
  constructor(private readonly logQueries: boolean) {}

  private get logger() {
    return currentLogger().child({ module: "db" });
  }

  logQuery(query: string, parameters?: unknown[]) {
    if (this.logQueries) this.logger.info({ query: collapse(query), parameters }, "query");
  }

  logQueryError(error: string | Error, query: string, parameters?: unknown[]) {
    this.logger.error({ err: error, query: collapse(query), parameters }, "query failed");
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[]) {
    this.logger.warn({ durationMs: time, query: collapse(query), parameters }, "slow query");
  }

  logSchemaBuild(message: string) {
    this.logger.debug(message);
  }

  logMigration(message: string) {
    this.logger.info(message);
  }

  log(level: "log" | "info" | "warn", message: unknown) {
    if (level === "warn") this.logger.warn(message);
    else this.logger.debug(message);
  }
}
