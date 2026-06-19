"use client";
import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
}

interface Props {
  onSuccess: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export function TransactionForm({ onSuccess }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    type: "EXPENSE",
    amount: "",
    description: "",
    date: today,
    categoryId: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const filtered = categories.filter((c) => c.type === form.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const amount = parseFloat(form.amount.replace(/\./g, "").replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      setError("Monto inválido");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al guardar");
    } else {
      setForm({ type: "EXPENSE", amount: "", description: "", date: today, categoryId: "" });
      onSuccess();
    }
  };

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Nuevo movimiento</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          {["EXPENSE", "INCOME"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, type: t, categoryId: "" })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                form.type === t
                  ? t === "INCOME"
                    ? "bg-emerald-600 text-white"
                    : "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {t === "INCOME" ? "Ingreso" : "Gasto"}
            </button>
          ))}
        </div>

        <div>
          <label className="label">Monto (CLP)</label>
          <input
            type="number"
            className="input"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
            min="1"
            required
          />
          {form.amount && !isNaN(Number(form.amount)) && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{fmt(Number(form.amount))}</p>
          )}
        </div>

        <div>
          <label className="label">Descripción</label>
          <input
            type="text"
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Ej: Supermercado Lider"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="input"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              <option value="">Selecciona...</option>
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Guardando..." : "Guardar movimiento"}
        </button>
      </form>
    </div>
  );
}
