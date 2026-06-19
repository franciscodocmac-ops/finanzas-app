"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
}

const PRESET_COLORS = ["#ef4444","#f97316","#eab308","#10b981","#06b6d4","#6366f1","#8b5cf6","#ec4899","#14b8a6","#64748b"];
const PRESET_ICONS = ["💼","💻","📈","💰","🍽️","🚗","🏠","🏥","📚","🎬","👕","⚡","📦","🎮","✈️","💊","🐾","🛒"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", type: "EXPENSE", color: "#6366f1", icon: "📦" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    } else {
      setForm({ name: "", type: "EXPENSE", color: "#6366f1", icon: "📦" });
      load();
    }
  };

  const incomes = categories.filter((c) => c.type === "INCOME");
  const expenses = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Categorías</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Nueva categoría</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                {["EXPENSE", "INCOME"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      form.type === t
                        ? t === "INCOME" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {t === "INCOME" ? "Ingreso" : "Gasto"}
                  </button>
                ))}
              </div>

              <div>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Mascotas"
                  required
                />
              </div>

              <div>
                <label className="label">Ícono</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-8 h-8 rounded-lg text-base transition-all ${
                        form.icon === icon
                          ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-7 h-7 rounded-full transition-all ${
                        form.color === color ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Guardando..." : "Crear categoría"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <CategoryGroup title="Gastos" categories={expenses} color="red" />
            <CategoryGroup title="Ingresos" categories={incomes} color="green" />
          </div>
        </div>
      </main>
    </div>
  );
}

function CategoryGroup({ title, categories, color }: { title: string; categories: Category[]; color: string }) {
  return (
    <div className="card p-5">
      <h3 className={`font-semibold mb-3 ${color === "red" ? "text-red-600" : "text-emerald-600"}`}>
        {title} ({categories.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: c.color + "25" }}
            >
              {c.icon}
            </div>
            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
