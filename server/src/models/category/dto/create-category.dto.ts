import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ example: "Travel" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "EXPENSE", enum: ["INCOME", "EXPENSE"] })
  @IsString()
  @IsNotEmpty()
  @IsIn(["INCOME", "EXPENSE"])
  type: string;

  @ApiProperty({ example: "Plane" })
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiProperty({ example: "#3B82F6" })
  @IsString()
  @IsNotEmpty()
  color: string;
}
