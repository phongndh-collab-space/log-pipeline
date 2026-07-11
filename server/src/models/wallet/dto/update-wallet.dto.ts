import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateWalletDto {
  @ApiPropertyOptional({ example: "Cash Wallet" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "USD" })
  @IsString()
  @IsOptional()
  currency?: string;
}
