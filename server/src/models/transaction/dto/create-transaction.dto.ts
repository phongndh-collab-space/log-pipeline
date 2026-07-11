import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateTransactionDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: "EXPENSE", enum: ["INCOME", "EXPENSE", "TRANSFER"] })
  @IsString()
  @IsNotEmpty()
  @IsIn(["INCOME", "EXPENSE", "TRANSFER"])
  type: string;

  @ApiPropertyOptional({ example: "Lunch with friends" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "2026-07-08T15:00:00.000Z" })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  walletId: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  toWalletId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  categoryId?: number;
}
