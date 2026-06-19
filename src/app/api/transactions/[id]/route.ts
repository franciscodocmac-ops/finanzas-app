import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tx = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { category: true },
  });
  if (!tx) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ...tx, receiptItems: tx.receiptItems ? JSON.parse(tx.receiptItems) : null });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tx = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!tx) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.transaction.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tx = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!tx) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { amount, description, date, type, categoryId } = await req.json();

  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: { amount, description, date: new Date(date), type, categoryId },
    include: { category: true },
  });

  return NextResponse.json({ ...updated, receiptItems: updated.receiptItems ? JSON.parse(updated.receiptItems) : null });
}
