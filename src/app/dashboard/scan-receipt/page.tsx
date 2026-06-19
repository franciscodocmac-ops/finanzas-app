"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

interface ReceiptItem {
  name: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
}

type Step = "upload" | "review" | "saving" | "done";

function fmt(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export default function ScanReceiptPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const [storeName, setStoreName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const expense = (data as Category[]).filter((c) => c.type === "EXPENSE");
        setCategories(expense);
        if (expense.length > 0) setCategoryId(expense[0].id);
      })
      .catch(() => {});
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleScan() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona una imagen primero");
      return;
    }
    setScanning(true);
    setError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/scan-receipt", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al escanear");
        setScanning(false);
        return;
      }

      setStoreName(data.storeName || "");
      if (data.date) setDate(data.date);
      setItems(data.items || []);
      setDescription(data.storeName ? `Compra en ${data.storeName}` : "Compra boleta");
      setStep("review");
    } catch {
      setError("Error de red al escanear la boleta");
    } finally {
      setScanning(false);
    }
  }

  function updateItem(i: number, field: "name" | "price", value: string) {
    setItems((prev) => {
      const copy = [...prev];
      if (field === "name") copy[i] = { ...copy[i], name: value };
      else copy[i] = { ...copy[i], price: parseInt(value) || 0 };
      return copy;
    });
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", price: 0 }]);
  }

  const total = items.reduce((s, it) => s + it.price, 0);

  async function handleSave() {
    if (!categoryId) {
      setError("Selecciona una categoría");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un ítem");
      return;
    }
    setStep("saving");
    setError("");

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: total,
        description: description || "Boleta escaneada",
        date,
        type: "EXPENSE",
        categoryId,
        receiptItems: items,
      }),
    });

    if (res.ok) {
      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      const data = await res.json();
      setError(data.error || "Error al guardar");
      setStep("review");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm flex items-center gap-1">
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">Escanear Boleta</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sube una foto de tu boleta y extrae los productos automáticamente</p>
        </div>

        {step === "done" && (
          <div className="card p-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">¡Guardado exitosamente!</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Redirigiendo al dashboard…</p>
          </div>
        )}

        {(step === "upload" || step === "review") && (
          <>
            {/* Upload zone */}
            <div className="card p-6 mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">📷 Foto de la boleta</h2>
              {preview && (
                <div className="mb-4">
                  <img src={preview} alt="Boleta" className="max-h-64 mx-auto rounded-lg object-contain" />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex-1"
                >
                  📷 Tomar foto
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="btn-secondary flex-1"
                >
                  🖼️ Elegir de biblioteca
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {preview && step === "upload" && (
                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="btn-primary w-full mt-4"
                >
                  {scanning ? "Analizando con Claude…" : "Analizar boleta"}
                </button>
              )}
              {scanning && (
                <p className="text-center text-sm text-indigo-500 dark:text-indigo-400 mt-2 animate-pulse">
                  Claude está leyendo tu boleta…
                </p>
              )}
            </div>

            {/* Review step */}
            {step === "review" && (
              <div className="card p-6">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">✏️ Revisar y confirmar</h2>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="label">Descripción</label>
                    <input
                      type="text"
                      className="input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ej: Supermercado"
                    />
                  </div>
                  <div>
                    <label className="label">Fecha</label>
                    <input
                      type="date"
                      className="input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="label">Categoría</label>
                  <select
                    className="input"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="label mb-0">Ítems detectados</label>
                    <button
                      onClick={addItem}
                      className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
                    >
                      + Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          className="input flex-1"
                          value={item.name}
                          onChange={(e) => updateItem(i, "name", e.target.value)}
                          placeholder="Producto"
                        />
                        <input
                          type="number"
                          className="input w-28"
                          value={item.price}
                          onChange={(e) => updateItem(i, "price", e.target.value)}
                          placeholder="Precio"
                        />
                        <button
                          onClick={() => removeItem(i)}
                          className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-lg leading-none px-1"
                          title="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-3">
                        No se detectaron ítems. Agrégalos manualmente.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-t border-slate-200 dark:border-slate-700 mb-4">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Total</span>
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">{fmt(total)}</span>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 mb-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep("upload"); setItems([]); }}
                    className="btn-secondary flex-1"
                  >
                    Volver a escanear
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={total === 0 || !categoryId}
                    className="btn-primary flex-1"
                  >
                    Guardar {fmt(total)}
                  </button>
                </div>
              </div>
            )}

            {error && step === "upload" && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 mt-3">
                {error}
              </div>
            )}
          </>
        )}

        {step === "saving" && (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3 animate-spin">⏳</div>
            <p className="text-slate-600 dark:text-slate-400">Guardando transacción…</p>
          </div>
        )}
      </main>
    </div>
  );
}
