import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // YYYY-MM
  const now = new Date();
  const [year, month] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const userId = session.user.id;

  const [transactions, monthlyTrend] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    // Últimos 6 meses
    prisma.$queryRaw<{ month: string; income: number; expense: number }[]>`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
      FROM "Transaction"
      WHERE "userId" = ${userId}
        AND date >= ${new Date(year, month - 7, 1)}
        AND date < ${end}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `,
  ]);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0);

  // Gastos por categoría
  const byCategory = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce<Record<string, { name: string; color: string; icon: string; total: number }>>((acc, t) => {
      const key = t.categoryId;
      if (!acc[key]) {
        acc[key] = { name: t.category.name, color: t.category.color, icon: t.category.icon, total: 0 };
      }
      acc[key].total += Number(t.amount);
      return acc;
    }, {});

  return NextResponse.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
    recentTransactions: transactions.slice(0, 5),
    monthlyTrend: monthlyTrend.map((r) => ({
      month: r.month,
      income: Number(r.income),
      expense: Number(r.expense),
    })),
  });
}
