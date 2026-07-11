import { PrismaClient } from "../../prisma/generated/client";
import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

async function main() {
  console.log("Starting Vietnamese users seed with specified list...");

  const maleNames = [
    "Anh", "Bình", "Cường", "Dũng", "Hùng", "Huy", "Khánh", "Kiên", "Lâm", "Long",
    "Minh", "Nam", "Nghĩa", "Ngọc", "Phát", "Phong", "Phúc", "Quang", "Quốc", "Sơn",
    "Tài", "Tâm", "Tân", "Thắng", "Thành", "Thái", "Thiện", "Thọ", "Tiến", "Toàn",
    "Trí", "Trung", "Trường", "Tuấn", "Văn", "Việt", "Vinh", "Vũ", "Xuân", "Hải",
    "Hoàng", "Hiếu", "Hòa", "Khoa", "Lợi", "Mạnh", "Phú", "Tùng", "Duy", "Đạt"
  ];

  const femaleNames = [
    "An", "Anh", "Ánh", "Bích", "Chi", "Diễm", "Diệu", "Dung", "Giang", "Hà",
    "Hạnh", "Hiền", "Hoa", "Hồng", "Hương", "Khánh", "Kiều", "Lan", "Lệ", "Liên",
    "Linh", "Loan", "Mai", "Mỹ", "Ngân", "Ngọc", "Nhàn", "Nhi", "Như", "Oanh",
    "Phương", "Quỳnh", "Sương", "Thảo", "Thanh", "Thi", "Thu", "Thúy", "Trang", "Trinh",
    "Tuyết", "Uyên", "Vân", "Vy", "Yến", "Ái", "Tiên", "Tường", "Hòa", "Đào"
  ];

  const allNames = [...maleNames.map(name => ({ name, gender: 'male' })), ...femaleNames.map(name => ({ name, gender: 'female' }))];

  const passwordHash = await hashPassword("123456");
  const usedAccounts = new Set<string>();

  console.log(`Generating ${allNames.length} Vietnamese users...`);
  let createdCount = 0;

  for (const item of allNames) {
    const rawName = item.name;
    const cleanName = removeDiacritics(rawName);
    
    // Tạo account đăng nhập (lowercase, không dấu)
    let account = cleanName.toLowerCase();
    
    // Xử lý trùng lặp account bằng cách thêm số đuôi
    if (usedAccounts.has(account)) {
      let counter = 2;
      while (usedAccounts.has(`${account}${counter}`)) {
        counter++;
      }
      account = `${account}${counter}`;
    }
    
    usedAccounts.add(account);

    const existed = await prisma.user.findUnique({
      where: { account }
    });

    if (!existed) {
      await prisma.user.create({
        data: {
          type: "local",
          account: account,
          username: cleanName, // Username chính là tên không dấu
          passwordHash: passwordHash,
          avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1zwhySGCEBxRRFYIcQgvOLOpRGqrT3d7Qng&s",
          role: 1
        }
      });
      createdCount++;
    }
  }

  console.log(`Successfully seeded ${createdCount} new Vietnamese users.`);
}

main()
  .catch(e => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
