import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { MoreThan, Repository } from "typeorm";
import { LoginUserDto } from "./dto/login-user.dto";
import { RegisterUserDto } from "./dto/register-user.dto";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UserSession } from "./user-session.entity";
import { User } from "./user.entity";

interface AuthenticatedUserResponse {
  token: string;
  user: ReturnType<UsersService["toPublicUser"]>;
}

@Injectable()
export class UsersService {
  private readonly sessionTtlDays = Number(process.env.AUTH_SESSION_TTL_DAYS ?? 7);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionsRepository: Repository<UserSession>
  ) {}

  async register(dto: RegisterUserDto): Promise<AuthenticatedUserResponse> {
    const account = this.normalizeAccount(dto.account);
    const password = dto.password?.trim() ?? "";
    if (password.length < 6) {
      throw new BadRequestException("Password must contain at least 6 characters.");
    }

    const existing = await this.usersRepository.findOneBy({ account });
    if (existing) {
      throw new BadRequestException("Account already exists.");
    }

    const user = this.usersRepository.create({
      account,
      passwordHash: this.hashPassword(password),
      userName: dto.userName?.trim() || account,
      city: dto.city?.trim() || "",
      age: this.normalizeAge(dto.age),
      targetRole: dto.targetRole?.trim() || ""
    });

    const saved = await this.usersRepository.save(user);
    return this.createSession(saved);
  }

  async login(dto: LoginUserDto): Promise<AuthenticatedUserResponse> {
    const account = this.normalizeAccount(dto.account);
    const password = dto.password?.trim() ?? "";
    if (!password) {
      throw new BadRequestException("Password is required.");
    }

    const user = await this.usersRepository.findOneBy({ account });
    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid account or password.");
    }

    return this.createSession(user);
  }

  async logout(authorization?: string) {
    const rawToken = this.extractBearerToken(authorization);
    const tokenHash = this.hashToken(rawToken);
    const session = await this.sessionsRepository.findOneBy({ tokenHash });
    if (session) {
      await this.sessionsRepository.remove(session);
    }

    return { success: true };
  }

  async getCurrentUser(authorization?: string) {
    const user = await this.getUserByAuthorization(authorization);
    return this.toPublicUser(user);
  }

  async updateCurrentUser(authorization: string | undefined, dto: UpdateUserProfileDto) {
    const user = await this.getUserByAuthorization(authorization);

    if (typeof dto.userName === "string") {
      const nextName = dto.userName.trim();
      if (!nextName) {
        throw new BadRequestException("userName cannot be empty.");
      }
      user.userName = nextName;
    }

    if (typeof dto.city === "string") {
      user.city = dto.city.trim();
    }

    if (dto.age !== undefined) {
      user.age = this.normalizeAge(dto.age);
    }

    if (typeof dto.targetRole === "string") {
      user.targetRole = dto.targetRole.trim();
    }

    const saved = await this.usersRepository.save(user);
    return this.toPublicUser(saved);
  }

  private async createSession(user: User): Promise<AuthenticatedUserResponse> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + Math.max(1, this.sessionTtlDays) * 24 * 60 * 60 * 1000);

    const session = this.sessionsRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(token),
      expiresAt,
      lastUsedAt: new Date()
    });
    await this.sessionsRepository.save(session);

    return {
      token,
      user: this.toPublicUser(user)
    };
  }

  private async getUserByAuthorization(authorization?: string) {
    const rawToken = this.extractBearerToken(authorization);
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    const session = await this.sessionsRepository.findOne({
      where: {
        tokenHash,
        expiresAt: MoreThan(now)
      },
      relations: {
        user: true
      }
    });

    if (!session?.user) {
      throw new UnauthorizedException("Invalid or expired token.");
    }

    session.lastUsedAt = now;
    await this.sessionsRepository.save(session);

    const user = await this.usersRepository.findOneBy({ id: session.userId });
    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      account: user.account,
      userName: user.userName,
      city: user.city,
      age: user.age,
      targetRole: user.targetRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private normalizeAccount(account: string | undefined) {
    const value = account?.trim() ?? "";
    if (!value) {
      throw new BadRequestException("Account is required.");
    }
    if (!/^[a-zA-Z0-9_@.-]{3,64}$/.test(value)) {
      throw new BadRequestException("Account format is invalid.");
    }
    return value;
  }

  private normalizeAge(age: number | null | undefined) {
    if (age === undefined || age === null) {
      return null;
    }
    if (!Number.isInteger(age) || age < 1 || age > 100) {
      throw new BadRequestException("Age must be an integer between 1 and 100.");
    }
    return age;
  }

  private extractBearerToken(authorization?: string) {
    const header = authorization?.trim() ?? "";
    if (!header.toLowerCase().startsWith("bearer ")) {
      throw new UnauthorizedException("Authorization header is required.");
    }

    const token = header.slice("bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException("Bearer token is required.");
    }
    return token;
  }

  private hashToken(rawToken: string) {
    return createHash("sha256").update(rawToken).digest("hex");
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `scrypt$${salt}$${hash}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [algorithm, salt, hash] = storedHash.split("$");
    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }

    const computed = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (computed.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(computed, expected);
  }
}

