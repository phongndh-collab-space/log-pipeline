import { apiRequest } from "@/src/services/api";
import type { Category, CreateCategoryPayload } from "@/src/types/finance";

export const categoryService = {
  getCategories(token: string) {
    return apiRequest<Category[]>("/categories", {
      method: "GET",
      token,
    });
  },

  createCategory(payload: CreateCategoryPayload, token: string) {
    return apiRequest<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  deleteCategory(id: number, token: string) {
    return apiRequest<Category>(`/categories/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
