import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "discussions" })
export class Discussion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "text" })
  summary!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "author_account", type: "varchar", length: 64 })
  authorAccount!: string;

  @Column({ name: "author_name", type: "varchar", length: 120 })
  authorName!: string;

  @Column({ type: "varchar", length: 40, default: "讨论" })
  tag!: string;

  @Column({ name: "reply_count", type: "int", default: 0 })
  replyCount!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
