import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada en el servidor" }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, defaultHeaders: { "Accept-Encoding": "identity" } });

  let file: File | null = null;
  try {
    const formData = await req.formData();
    file = formData.get("image") as File | null;
  } catch {
    return NextResponse.json({ error: "Error al leer la imagen enviada" }, { status: 400 });
  }

  if (!file) return NextResponse.json({ error: "No se recibió imagen" }, { status: 400 });

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Comprime solo si supera 1MB para reducir payload y evitar timeouts
  let processedBuffer: Buffer;
  if (rawBuffer.byteLength > 1_000_000) {
    const isJpegOrWebp = /image\/(jpeg|webp)/.test(file.type);
    processedBuffer = await sharp(rawBuffer)
      .resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: isJpegOrWebp ? 70 : 85 })
      .toBuffer();
  } else {
    processedBuffer = rawBuffer;
  }

  const base64 = processedBuffer.toString("base64");

  const message = await anthropic.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text: `Analiza esta boleta o ticket de compra y extrae todos los productos con sus precios.
Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin bloques de código, sin texto adicional):
{"storeName":"nombre del local o null","date":"YYYY-MM-DD o null","items":[{"name":"producto","price":1234}],"total":9999}
Los precios deben ser números enteros en pesos chilenos (sin decimales, sin puntos de miles).
Si no puedes leer algún precio con certeza, omite ese ítem.`,
            },
          ],
        },
      ],
    },
    { signal: AbortSignal.timeout(60000) }
  );

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Limpia markdown por si Claude envuelve en ```json ... ```
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed: { storeName: string | null; date: string | null; items: { name: string; price: number }[]; total: number };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: "No se pudo interpretar la boleta", raw }, { status: 422 });
  }

  return NextResponse.json(parsed);
}
