"use client";
import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { MonthlyChart } from "@/components/MonthlyChart";
import { TransactionDetail } from "@/components/TransactionDetail";

interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: { name: string; color: string; icon: string; total: number }[];
  recentTransactions: Transaction[];
  monthlyTrend: { month: string; income: number; expense: number }[];
}

interface Transaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category: { id: string; name: string; color: string; icon: string };
  receiptItems?: { name: string; price: number }[] | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/dashboard?month=${month}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [month]);

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
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Resumen</h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="btn-secondary px-3 py-1.5 text-xs">←</button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-36 text-center">
              {monthLabel}
            </span>
            <button onClick={nextMonth} className="btn-secondary px-3 py-1.5 text-xs">→</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">Cargando...</div>
        ) : data ? (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ingresos</p>
                <p className="text-xl font-bold text-emerald-600">{fmt(data.totalIncome)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Gastos</p>
                <p className="text-xl font-bold text-red-500">{fmt(data.totalExpense)}</p>
              </div>
              <div className={`card p-4 ${
                data.balance >= 0
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                  : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              }`}>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Balance</p>
                <p className={`text-xl font-bold ${data.balance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {fmt(data.balance)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1">
                <TransactionForm onSuccess={load} />
              </div>
              <div className="lg:col-span-2 card p-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Últimos movimientos</h3>
                <TransactionList transactions={data.recentTransactions} onDelete={handleDelete} onSelect={setSelected} compact />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <MonthlyChart data={data.monthlyTrend} />

              <div className="card p-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Gastos por categoría</h3>
                {data.byCategory.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">Sin gastos este mes</p>
                ) : (
                  <div className="space-y-2">
                    {data.byCategory.slice(0, 8).map((c) => {
                      const pct = data.totalExpense > 0 ? (c.total / data.totalExpense) * 100 : 0;
                      return (
                        <div key={c.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{c.icon} {c.name}</span>
                            <span className="text-slate-500 dark:text-slate-400">{fmt(c.total)} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: c.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <TransactionDetail transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
