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
import { WalletService } from "./wallet.service";
import { CreateWalletDto } from "./dto/create-wallet.dto";
import { UpdateWalletDto } from "./dto/update-wallet.dto";

@Controller("wallets")
@ApiTags("Wallets")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallets(@Req() req: Request) {
    const user: any = req.user;
    return this.walletService.getWallets(+user.id);
  }

  @Get(":id")
  async getWalletById(
    @Req() req: Request,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const user: any = req.user;
    return this.walletService.getWalletById(+user.id, id);
  }

  @Post()
  async createWallet(@Req() req: Request, @Body() dto: CreateWalletDto) {
    const user: any = req.user;
    return this.walletService.createWallet(+user.id, dto);
  }

  @Patch(":id")
  async updateWallet(
    @Req() req: Request,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateWalletDto,
  ) {
    const user: any = req.user;
    return this.walletService.updateWallet(+user.id, id, dto);
  }

  @Delete(":id")
  async deleteWallet(
    @Req() req: Request,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const user: any = req.user;
    return this.walletService.deleteWallet(+user.id, id);
  }
}
