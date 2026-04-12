import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { UserSession } from "./user-session.entity";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 64, unique: true })
  account!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ name: "user_name", type: "varchar", length: 120 })
  userName!: string;

  @Column({ type: "varchar", length: 80, default: "" })
  city!: string;

  @Column({ type: "int", nullable: true })
  age!: number | null;

  @Column({ name: "target_role", type: "varchar", length: 120, default: "" })
  targetRole!: string;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions!: UserSession[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

