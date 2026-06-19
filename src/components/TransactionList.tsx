"use client";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface ReceiptItem {
  name: string;
  price: number;
}

export interface Transaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category: Category;
  receiptItems?: ReceiptItem[] | null;
}

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onSelect?: (tx: Transaction) => void;
  compact?: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function TransactionList({ transactions, onDelete, onSelect, compact }: Props) {
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
        <div
          key={tx.id}
          className="flex items-center gap-3 py-3 group cursor-pointer"
          onClick={() => onSelect?.(tx)}
        >
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
              {Array.isArray(tx.receiptItems) && tx.receiptItems.length > 0 && (
                <span className="ml-1 text-indigo-400 dark:text-indigo-500">· 🧾 {tx.receiptItems.length} ítems</span>
              )}
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
              onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }}
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
