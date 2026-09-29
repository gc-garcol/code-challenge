import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateResources1790000000000 implements MigrationInterface {
  name = "CreateResources1790000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "resource_status" AS ENUM ('active', 'inactive')`);
    await queryRunner.query(`
      CREATE TABLE "resources" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "description" text,
        "category" varchar(100) NOT NULL,
        "status" "resource_status" NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_resources_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_resources_created_at" ON "resources" ("created_at", "id")`);
    await queryRunner.query(`CREATE INDEX "IDX_resources_category" ON "resources" ("category", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_resources_status" ON "resources" ("status", "created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_resources_status"`);
    await queryRunner.query(`DROP INDEX "IDX_resources_category"`);
    await queryRunner.query(`DROP INDEX "IDX_resources_created_at"`);
    await queryRunner.query(`DROP TABLE "resources"`);
    await queryRunner.query(`DROP TYPE "resource_status"`);
  }
}
