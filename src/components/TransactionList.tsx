"use client";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Transaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category: Category;
}

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  compact?: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function TransactionList({ transactions, onDelete, compact }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 dark:text-slate-500">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-sm">Sin movimientos este mes</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center gap-3 py-3 group">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
            style={{ backgroundColor: tx.category.color + "25" }}
          >
            {tx.category.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {tx.description}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {tx.category.name} · {fmtDate(tx.date)}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${tx.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
              {tx.type === "INCOME" ? "+" : "-"}
              {fmt(Number(tx.amount))}
            </p>
          </div>
          {!compact && (
            <button
              onClick={() => onDelete(tx.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-all ml-2 text-xs"
              title="Eliminar"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
