import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, type, color, icon } = await req.json();
  if (!name || !type) return NextResponse.json({ error: "Nombre y tipo requeridos" }, { status: 400 });

  try {
    const category = await prisma.category.create({
      data: { name, type, color: color || "#6366f1", icon: icon || "📦", userId: session.user.id },
    });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "La categoría ya existe" }, { status: 400 });
  }
}
