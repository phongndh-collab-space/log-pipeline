import { PrismaClient } from "../../prisma/generated/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  // Create example users
  for (let i = 0; i < 5; i++) {
    const random = Math.floor(Math.random() * 10);
    await prisma.user.create({
      data: {
        account: faker.internet.email(),
        username: faker.person.fullName(),
        type: random % 2 == 0 ? "facebook" : "google",
        avatar : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1zwhySGCEBxRRFYIcQgvOLOpRGqrT3d7Qng&s",
        role: 1
      }
    });
  }

  // Create default categories
  const defaultCategories = [
    { name: "Food & Beverage", type: "EXPENSE", icon: "Utensils", color: "#EF4444" },
    { name: "Transportation", type: "EXPENSE", icon: "Car", color: "#3B82F6" },
    { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag", color: "#EC4899" },
    { name: "Entertainment", type: "EXPENSE", icon: "Film", color: "#8B5CF6" },
    { name: "Bills & Utilities", type: "EXPENSE", icon: "Receipt", color: "#F59E0B" },
    { name: "Salary", type: "INCOME", icon: "Briefcase", color: "#10B981" },
    { name: "Freelance", type: "INCOME", icon: "Laptop", color: "#06B6D4" },
    { name: "Gifts", type: "INCOME", icon: "Gift", color: "#14B8A6" },
  ];

  const categoryCount = await prisma.category.count({ where: { userId: null } });
  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: defaultCategories,
    });
    console.log("Seeded default categories.");
  }

  console.log("Seeding completed.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
