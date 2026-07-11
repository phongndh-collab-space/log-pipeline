import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "@guard/jwt-auth.guard";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
@ApiTags("Authentication")
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {
  }

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authenticationService.register(dto);
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    return this.authenticationService.login(dto);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout() {
    return { message: "Logged out successfully" };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async profile(@Req() req: Request) {
    const user: any = req.user;
    return this.authenticationService.profile(+user.id);
  }

  @Get("check-role")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkRole(@Req() req: Request) {
    const user: any = req.user;
    const result = await this.authenticationService.checkRole(+user.id);
    if (result instanceof HttpException) {
      throw result;
    }
    return result;
  }

}
