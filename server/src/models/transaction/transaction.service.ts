import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(userId: number) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        wallet: { select: { id: true, name: true, currency: true } },
        toWallet: { select: { id: true, name: true, currency: true } },
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
      orderBy: { date: "desc" },
    });
  }

  async createTransaction(userId: number, dto: CreateTransactionDto) {
    // 1. Verify Wallet ownership
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: dto.walletId },
    });
    if (!wallet || wallet.userId !== userId) {
      throw new ForbiddenException("Invalid source wallet");
    }

    // 2. Verify toWallet ownership if TRANSFER
    if (dto.type === "TRANSFER") {
      if (!dto.toWalletId) {
        throw new BadRequestException("toWalletId is required for transfer transactions");
      }
      if (dto.walletId === dto.toWalletId) {
        throw new BadRequestException("Source and destination wallets cannot be the same");
      }
      const toWallet = await this.prisma.wallet.findUnique({
        where: { id: dto.toWalletId },
      });
      if (!toWallet || toWallet.userId !== userId) {
        throw new ForbiddenException("Invalid destination wallet");
      }
    }

    // 3. Verify Category if INCOME or EXPENSE
    if (dto.type !== "TRANSFER" && dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException("Category not found");
      }
      if (category.userId !== null && category.userId !== userId) {
        throw new ForbiddenException("Invalid category selected");
      }
      if (category.type !== dto.type) {
        throw new BadRequestException("Category type must match transaction type");
      }
    }

    // 4. Perform everything inside a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: dto.type,
          description: dto.description || null,
          date: dto.date ? new Date(dto.date) : new Date(),
          walletId: dto.walletId,
          toWalletId: dto.type === "TRANSFER" ? dto.toWalletId : null,
          categoryId: dto.type !== "TRANSFER" ? dto.categoryId : null,
          userId,
        },
        include: {
          wallet: { select: { id: true, name: true, currency: true } },
          toWallet: { select: { id: true, name: true, currency: true } },
          category: { select: { id: true, name: true, icon: true, color: true } },
        },
      });

      // Update balances
      if (dto.type === "INCOME") {
        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balance: { increment: dto.amount } },
        });
      } else if (dto.type === "EXPENSE") {
        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balance: { decrement: dto.amount } },
        });
      } else if (dto.type === "TRANSFER") {
        // Decrease source wallet
        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balance: { decrement: dto.amount } },
        });
        // Increase destination wallet
        await tx.wallet.update({
          where: { id: dto.toWalletId },
          data: { balance: { increment: dto.amount } },
        });
      }

      return transaction;
    });
  }

  async deleteTransaction(userId: number, id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException("You do not own this transaction");
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert balance impact
      if (transaction.type === "INCOME") {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { decrement: transaction.amount } },
        });
      } else if (transaction.type === "EXPENSE") {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        });
      } else if (transaction.type === "TRANSFER") {
        // Revert source wallet (increment)
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        });
        // Revert destination wallet (decrement)
        await tx.wallet.update({
          where: { id: transaction.toWalletId },
          data: { balance: { decrement: transaction.amount } },
        });
      }

      // Delete the transaction
      return tx.transaction.delete({
        where: { id },
      });
    });
  }

  async updateTransaction(userId: number, id: number, dto: UpdateTransactionDto) {
    const oldTx = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!oldTx) {
      throw new NotFoundException("Transaction not found");
    }

    if (oldTx.userId !== userId) {
      throw new ForbiddenException("You do not own this transaction");
    }

    // Determine target values
    const newType = dto.type ?? oldTx.type;
    const newAmount = dto.amount ?? oldTx.amount;
    const newWalletId = dto.walletId ?? oldTx.walletId;
    const newToWalletId = dto.toWalletId !== undefined ? dto.toWalletId : oldTx.toWalletId;
    const newCategoryId = dto.categoryId !== undefined ? dto.categoryId : oldTx.categoryId;

    // Validate new wallets
    const wallet = await this.prisma.wallet.findUnique({ where: { id: newWalletId } });
    if (!wallet || wallet.userId !== userId) {
      throw new ForbiddenException("Invalid source wallet");
    }

    if (newType === "TRANSFER") {
      if (!newToWalletId) {
        throw new BadRequestException("toWalletId is required for transfer transactions");
      }
      if (newWalletId === newToWalletId) {
        throw new BadRequestException("Source and destination wallets cannot be the same");
      }
      const toWallet = await this.prisma.wallet.findUnique({ where: { id: newToWalletId } });
      if (!toWallet || toWallet.userId !== userId) {
        throw new ForbiddenException("Invalid destination wallet");
      }
    }

    // Validate category
    if (newType !== "TRANSFER" && newCategoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: newCategoryId } });
      if (!category) {
        throw new NotFoundException("Category not found");
      }
      if (category.userId !== null && category.userId !== userId) {
        throw new ForbiddenException("Invalid category selected");
      }
      if (category.type !== newType) {
        throw new BadRequestException("Category type must match transaction type");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. REVERT old transaction balance impact
      if (oldTx.type === "INCOME") {
        await tx.wallet.update({
          where: { id: oldTx.walletId },
          data: { balance: { decrement: oldTx.amount } },
        });
      } else if (oldTx.type === "EXPENSE") {
        await tx.wallet.update({
          where: { id: oldTx.walletId },
          data: { balance: { increment: oldTx.amount } },
        });
      } else if (oldTx.type === "TRANSFER") {
        await tx.wallet.update({
          where: { id: oldTx.walletId },
          data: { balance: { increment: oldTx.amount } },
        });
        await tx.wallet.update({
          where: { id: oldTx.toWalletId },
          data: { balance: { decrement: oldTx.amount } },
        });
      }

      // 2. APPLY new transaction balance impact
      if (newType === "INCOME") {
        await tx.wallet.update({
          where: { id: newWalletId },
          data: { balance: { increment: newAmount } },
        });
      } else if (newType === "EXPENSE") {
        await tx.wallet.update({
          where: { id: newWalletId },
          data: { balance: { decrement: newAmount } },
        });
      } else if (newType === "TRANSFER") {
        await tx.wallet.update({
          where: { id: newWalletId },
          data: { balance: { decrement: newAmount } },
        });
        await tx.wallet.update({
          where: { id: newToWalletId },
          data: { balance: { increment: newAmount } },
        });
      }

      // 3. Update the transaction in database
      return tx.transaction.update({
        where: { id },
        data: {
          amount: newAmount,
          type: newType,
          description: dto.description !== undefined ? dto.description : oldTx.description,
          date: dto.date ? new Date(dto.date) : oldTx.date,
          walletId: newWalletId,
          toWalletId: newType === "TRANSFER" ? newToWalletId : null,
          categoryId: newType !== "TRANSFER" ? newCategoryId : null,
        },
        include: {
          wallet: { select: { id: true, name: true, currency: true } },
          toWallet: { select: { id: true, name: true, currency: true } },
          category: { select: { id: true, name: true, icon: true, color: true } },
        },
      });
    });
  }
}
