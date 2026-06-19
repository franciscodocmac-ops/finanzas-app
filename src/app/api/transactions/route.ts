import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // formato: YYYY-MM
  const type = searchParams.get("type");

  const where: Record<string, unknown> = { userId: session.user.id };

  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.date = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    };
  }

  if (type && (type === "INCOME" || type === "EXPENSE")) {
    where.type = type;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { amount, description, date, type, categoryId } = await req.json();

  if (!amount || !description || !date || !type || !categoryId)
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId: session.user.id },
  });
  if (!category) return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });

  const transaction = await prisma.transaction.create({
    data: {
      amount,
      description,
      date: new Date(date),
      type,
      categoryId,
      userId: session.user.id,
    },
    include: { category: true },
  });

  return NextResponse.json(transaction, { status: 201 });
}
