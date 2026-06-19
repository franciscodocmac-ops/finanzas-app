"use client";
import { useState, useEffect } from "react";

interface ReceiptItem {
  name: string;
  price: number;
}

interface Transaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category: { id: string; name: string; color: string; icon: string };
  receiptItems?: ReceiptItem[] | null;
}

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

export function TransactionDetail({ transaction: tx, onClose }: Props) {
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!tx) { setItems([]); return; }
    setLoadingItems(true);
    fetch(`/api/transactions/${tx.id}`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data.receiptItems) ? data.receiptItems : []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, [tx?.id]);

  if (!tx) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      <div
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: tx.category.color + "25" }}
          >
            {tx.category.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{tx.description}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{tx.category.name} · {fmtDate(tx.date)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none ml-2"
          >
            ×
          </button>
        </div>

        {/* Total */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Total</p>
          <p className={`text-2xl font-bold ${tx.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
            {tx.type === "INCOME" ? "+" : "-"}{fmt(Number(tx.amount))}
          </p>
        </div>

        {/* Items */}
        {loadingItems ? (
          <div className="px-5 py-4 text-sm text-slate-400 dark:text-slate-500">Cargando ítems…</div>
        ) : items.length > 0 ? (
          <div className="px-5 py-4 max-h-72 overflow-y-auto">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
              Detalle de ítems
            </p>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-slate-700 dark:text-slate-300 flex-1 mr-3">{item.name}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                    {fmt(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{tx.description}</p>
          </div>
        )}

        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn-secondary w-full">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
