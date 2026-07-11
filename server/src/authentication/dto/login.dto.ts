import { IsString, Length } from "class-validator";

export class LoginDto {
  @IsString()
  @Length(2, 32)
  username: string;

  @IsString()
  @Length(6, 72)
  password: string;
}
