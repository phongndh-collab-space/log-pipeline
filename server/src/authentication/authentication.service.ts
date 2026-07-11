import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@prisma/prisma.service";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const scrypt = promisify(scryptCallback);

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {
  }

  async register(dto: RegisterDto) {
    const account = this.normalizeUsername(dto.username);
    const existed = await this.prisma.user.findUnique({
      where: { account }
    });

    if (existed) {
      throw new ConflictException("Username already exists");
    }

    const user = await this.prisma.user.create({
      data: {
        type: "local",
        account,
        username: dto.username.trim(),
        passwordHash: await this.hashPassword(dto.password),
        avatar: "",
        role: 1
      }
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        account: this.normalizeUsername(dto.username)
      }
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid username or password");
    }

    const isValidPassword = await this.verifyPassword(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid username or password");
    }

    return this.createAuthResponse(user);
  }

  async profile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return { user: this.toPublicUser(user) };
  }

  async checkRole(userId: number) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: userId }
      });
      return { role: user.role };
    } catch (err) {
      return new BadRequestException(err?.message);
    }
  }

  private createAuthResponse(user: any) {
    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        id: user.id,
        username: user.username,
        role: user.role
      }),
      user: this.toPublicUser(user)
    };
  }

  private toPublicUser(user: any) {
    return {
      id: user.id,
      username: user.username,
      account: user.account,
      avatar: user.avatar,
      role: user.role,
      type: user.type
    };
  }

  private normalizeUsername(username: string) {
    return username.trim().toLowerCase();
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `${salt}:${derivedKey.toString("hex")}`;
  }

  private async verifyPassword(password: string, storedHash: string) {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) {
      return false;
    }

    const storedKey = Buffer.from(key, "hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
  }
}
