import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
const defaultCategories = [
  { name: "Sueldo", type: "INCOME", color: "#10b981", icon: "💼" },
  { name: "Freelance", type: "INCOME", color: "#06b6d4", icon: "💻" },
  { name: "Inversiones", type: "INCOME", color: "#8b5cf6", icon: "📈" },
  { name: "Otros ingresos", type: "INCOME", color: "#f59e0b", icon: "💰" },
  { name: "Alimentación", type: "EXPENSE", color: "#ef4444", icon: "🍽️" },
  { name: "Transporte", type: "EXPENSE", color: "#f97316", icon: "🚗" },
  { name: "Vivienda", type: "EXPENSE", color: "#eab308", icon: "🏠" },
  { name: "Salud", type: "EXPENSE", color: "#ec4899", icon: "🏥" },
  { name: "Educación", type: "EXPENSE", color: "#6366f1", icon: "📚" },
  { name: "Entretenimiento", type: "EXPENSE", color: "#14b8a6", icon: "🎬" },
  { name: "Servicios", type: "EXPENSE", color: "#64748b", icon: "⚡" },
  { name: "Otros gastos", type: "EXPENSE", color: "#78716c", icon: "📦" },
];

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.id as string;
      return session;
    },
  },
};

export async function createUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("El email ya está registrado");

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  await prisma.category.createMany({
    data: defaultCategories.map((c) => ({ ...c, userId: user.id })),
  });

  return user;
}
