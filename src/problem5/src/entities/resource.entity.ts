import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export const RESOURCE_STATUSES = ["active", "inactive"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

@Entity({ name: "resources" })
@Index("IDX_resources_created_at", ["createdAt", "id"])
@Index("IDX_resources_category", ["category", "createdAt"])
@Index("IDX_resources_status", ["status", "createdAt"])
export class Resource {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 100 })
  category: string;

  @Column({ type: "enum", enum: RESOURCE_STATUSES, enumName: "resource_status", default: "active" })
  status: ResourceStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
