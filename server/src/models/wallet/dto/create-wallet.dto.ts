import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateWalletDto {
  @ApiProperty({ example: "Shinhan Bank Card" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 1000000, default: 0 })
  @IsNumber()
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({ example: "VND", default: "VND" })
  @IsString()
  @IsOptional()
  currency?: string;
}
