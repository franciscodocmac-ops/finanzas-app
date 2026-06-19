"use client";
import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { TransactionList } from "@/components/TransactionList";
import { TransactionForm } from "@/components/TransactionForm";

interface Transaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category: { id: string; name: string; color: string; icon: string };
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function TransactionsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [filter, setFilter] = useState("ALL");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (filter !== "ALL") params.set("type", filter);
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data);
    setLoading(false);
  }, [month, filter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const [yr, mo] = month.split("-").map(Number);
  const monthLabel = `${MONTH_NAMES[mo - 1]} ${yr}`;

  const prevMonth = () => {
    const d = new Date(yr, mo - 2, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    const d = new Date(yr, mo, 1);
    if (d <= new Date()) setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Movimientos</h2>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            {showForm ? "Cancelar" : "+ Nuevo"}
          </button>
        </div>

        {showForm && (
          <div className="mb-5 max-w-md">
            <TransactionForm onSuccess={() => { setShowForm(false); load(); }} />
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="btn-secondary px-3 py-1.5 text-xs">←</button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-36 text-center">{monthLabel}</span>
            <button onClick={nextMonth} className="btn-secondary px-3 py-1.5 text-xs">→</button>
          </div>
          <div className="flex gap-1">
            {[["ALL", "Todos"], ["INCOME", "Ingresos"], ["EXPENSE", "Gastos"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === val
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          {loading ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">Cargando...</div>
          ) : (
            <TransactionList transactions={transactions} onDelete={handleDelete} />
          )}
        </div>
      </main>
    </div>
  );
}
