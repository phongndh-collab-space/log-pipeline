import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { CreateWalletDto } from "./dto/create-wallet.dto";
import { UpdateWalletDto } from "./dto/update-wallet.dto";

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallets(userId: number) {
    return this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getWalletById(userId: number, id: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id },
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    if (wallet.userId !== userId) {
      throw new ForbiddenException("You do not own this wallet");
    }

    return wallet;
  }

  async createWallet(userId: number, dto: CreateWalletDto) {
    return this.prisma.wallet.create({
      data: {
        name: dto.name.trim(),
        balance: dto.balance ?? 0,
        currency: dto.currency ?? "VND",
        userId,
      },
    });
  }

  async updateWallet(userId: number, id: number, dto: UpdateWalletDto) {
    const wallet = await this.getWalletById(userId, id);

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        currency: dto.currency !== undefined ? dto.currency : undefined,
      },
    });
  }

  async deleteWallet(userId: number, id: number) {
    const wallet = await this.getWalletById(userId, id);

    return this.prisma.wallet.delete({
      where: { id: wallet.id },
    });
  }
}
