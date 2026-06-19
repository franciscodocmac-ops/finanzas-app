import { PrismaClient, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const defaultCategories = [
  // Ingresos
  { name: "Sueldo", type: TransactionType.INCOME, color: "#10b981", icon: "💼" },
  { name: "Freelance", type: TransactionType.INCOME, color: "#06b6d4", icon: "💻" },
  { name: "Inversiones", type: TransactionType.INCOME, color: "#8b5cf6", icon: "📈" },
  { name: "Otros ingresos", type: TransactionType.INCOME, color: "#f59e0b", icon: "💰" },
  // Gastos
  { name: "Alimentación", type: TransactionType.EXPENSE, color: "#ef4444", icon: "🍽️" },
  { name: "Transporte", type: TransactionType.EXPENSE, color: "#f97316", icon: "🚗" },
  { name: "Vivienda", type: TransactionType.EXPENSE, color: "#eab308", icon: "🏠" },
  { name: "Salud", type: TransactionType.EXPENSE, color: "#ec4899", icon: "🏥" },
  { name: "Educación", type: TransactionType.EXPENSE, color: "#6366f1", icon: "📚" },
  { name: "Entretenimiento", type: TransactionType.EXPENSE, color: "#14b8a6", icon: "🎬" },
  { name: "Ropa", type: TransactionType.EXPENSE, color: "#a855f7", icon: "👕" },
  { name: "Servicios", type: TransactionType.EXPENSE, color: "#64748b", icon: "⚡" },
  { name: "Otros gastos", type: TransactionType.EXPENSE, color: "#78716c", icon: "📦" },
];

async function main() {
  const demoEmail = "demo@finanzas.cl";
  const existing = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!existing) {
    const hashed = await bcrypt.hash("demo1234", 10);
    const user = await prisma.user.create({
      data: {
        name: "Usuario Demo",
        email: demoEmail,
        password: hashed,
      },
    });

    await prisma.category.createMany({
      data: defaultCategories.map((c) => ({ ...c, userId: user.id })),
    });

    console.log("✅ Usuario demo creado:", demoEmail, "/ contraseña: demo1234");
  } else {
    console.log("ℹ️  Usuario demo ya existe");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
