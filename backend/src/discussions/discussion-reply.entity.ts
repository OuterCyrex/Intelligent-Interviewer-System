import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "discussion_replies" })
export class DiscussionReply {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "discussion_id", type: "uuid" })
  discussionId!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "author_account", type: "varchar", length: 64 })
  authorAccount!: string;

  @Column({ name: "author_name", type: "varchar", length: 120 })
  authorName!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
