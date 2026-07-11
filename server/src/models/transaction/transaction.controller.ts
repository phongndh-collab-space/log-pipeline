import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "@guard/jwt-auth.guard";
import { TransactionService } from "./transaction.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";

@Controller("transactions")
@ApiTags("Transactions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async getTransactions(@Req() req: Request) {
    const user: any = req.user;
    return this.transactionService.getTransactions(+user.id);
  }

  @Post()
  async createTransaction(
    @Req() req: Request,
    @Body() dto: CreateTransactionDto,
  ) {
    const user: any = req.user;
    return this.transactionService.createTransaction(+user.id, dto);
  }

  @Patch(":id")
  async updateTransaction(
    @Req() req: Request,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
  ) {
    const user: any = req.user;
    return this.transactionService.updateTransaction(+user.id, id, dto);
  }

  @Delete(":id")
  async deleteTransaction(
    @Req() req: Request,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const user: any = req.user;
    return this.transactionService.deleteTransaction(+user.id, id);
  }
}
