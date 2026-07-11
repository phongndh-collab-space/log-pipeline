import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories(userId: number) {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { userId: null }, // System default categories
          { userId },       // User custom categories
        ],
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async createCategory(userId: number, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        type: dto.type,
        icon: dto.icon,
        color: dto.color,
        userId,
      },
    });
  }

  async deleteCategory(userId: number, id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (category.userId === null) {
      throw new ForbiddenException("Cannot delete system default categories");
    }

    if (category.userId !== userId) {
      throw new ForbiddenException("You do not own this category");
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
