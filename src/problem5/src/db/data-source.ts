import "reflect-metadata";
import path from "node:path";
import { DataSource } from "typeorm";
import { config } from "@src/config";
import { PinoTypeOrmLogger } from "@src/db/typeorm-logger";
import { Resource } from "@src/entities/resource.entity";

const { logging, slowQueryMs, ...connection } = config.db;

export const AppDataSource = new DataSource({
  type: "postgres",
  ...connection,
  entities: [Resource],
  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
  migrationsTableName: "migrations",
  synchronize: false,
  logging: logging ? "all" : ["error", "warn"],
  logger: new PinoTypeOrmLogger(logging),
  maxQueryExecutionTime: slowQueryMs,
});
