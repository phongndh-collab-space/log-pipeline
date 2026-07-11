import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "@guard/jwt-auth.guard";
import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";

@Controller("categories")
@ApiTags("Categories")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getCategories(@Req() req: Request) {
    const user: any = req.user;
    return this.categoryService.getCategories(+user.id);
  }

  @Post()
  async createCategory(@Req() req: Request, @Body() dto: CreateCategoryDto) {
    const user: any = req.user;
    return this.categoryService.createCategory(+user.id, dto);
  }

  @Delete(":id")
  async deleteCategory(
    @Req() req: Request,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const user: any = req.user;
    return this.categoryService.deleteCategory(+user.id, id);
  }
}
