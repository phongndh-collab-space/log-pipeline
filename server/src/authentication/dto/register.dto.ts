import { IsString, Length, Matches } from "class-validator";

export class RegisterDto {
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: "Username can only contain letters, numbers, dots, underscores, and hyphens",
  })
  username: string;

  @IsString()
  @Length(6, 72)
  password: string;
}
