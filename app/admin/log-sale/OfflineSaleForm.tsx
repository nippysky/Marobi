// app/admin/log‑sale/OfflineSaleForm.tsx
"use client";
import React, { useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Currency } from "@/lib/generated/prisma-client";

// ─── Types ─────────────────────────────────────────────────────────────
interface DBVariant {
  color: string;
  size:  string;
  stock: number;
}
interface DBProduct {
  id:       string;
  name:     string;
  variants: DBVariant[];
}
interface LineItem {
  id:            string;
  productId:     string;
  productName:   string;
  variants:      DBVariant[];    // ← full variant list
  colorOptions:  string[];
  sizeOptions:   string[];
  color:         string;
  size:          string;
  maxQty:        number;         // ← live stock
  quantity:      number;
}
type PaymentMethod = "Cash" | "Transfer" | "Card";

interface Props {
  staffId: string;
}

// ─── Debounce helper ───────────────────────────────────────────────────
function useDebounce(callback: (...args: any[]) => void, delay: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  };
}

// ─── COMPONENT ─────────────────────────────────────────────────────────
export default function OfflineSaleForm({ staffId }: Props) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<LineItem[]>([{
    id:          uuid(),
    productId:   "",
    productName: "",
    variants:    [],
    colorOptions:["N/A"],
    sizeOptions: ["N/A"],
    color:       "N/A",
    size:        "N/A",
    maxQty:      1,
    quantity:    1,
  }]);
  const [productSearch, setProductSearch] = useState<Record<string, DBProduct[]>>({});
  const [searchingProduct, setSearchingProduct] = useState(false);

  const [mode, setMode] = useState<"existing"|"guest">("existing");
  const [existingCustomerId, setExistingCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState<any[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  const [guest, setGuest] = useState({
    firstName:"", lastName:"", email:"",
    phone:"", address:"", country:"", state:"",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [currency, setCurrency]           = useState<Currency>(Currency.NGN);
  const [loading, setLoading]             = useState(false);

  const [successSummary, setSuccessSummary] = useState<{
    orderId: string;
    items:   LineItem[];
    paymentMethod: PaymentMethod;
  } | null>(null);

  // ─── Validation ───────────────────────────────────────────────────────
  const canNext =
    step === 1
      ? items.every(i => i.productId && i.color && i.size && i.quantity > 0)
      : step === 2
      ? mode === "existing"
        ? !!existingCustomerId
        : !!(guest.firstName && guest.lastName && guest.email && guest.phone && guest.address)
      : true;
  const canSubmit = step === 3 && canNext;

  // ─── Row helpers ─────────────────────────────────────────────────────
  const addRow = () => setItems(s => [
    ...s,
    {
      id:          uuid(),
      productId:   "",
      productName: "",
      variants:    [],
      colorOptions:["N/A"],
      sizeOptions: ["N/A"],
      color:       "N/A",
      size:        "N/A",
      maxQty:      1,
      quantity:    1,
    }
  ]);
  const removeRow = (id: string) => setItems(s => s.filter(i => i.id !== id));

  // ─── PRODUCT SEARCH & SELECTION ─────────────────────────────────────
  const fetchProducts = async (rowId: string, q: string) => {
    if (!q || q.length < 2) {
      setProductSearch(p => ({ ...p, [rowId]: [] }));
      return;
    }
    setSearchingProduct(true);
    const res = await fetch(`/api/search-products?query=${q}`);
    const data: DBProduct[] = await res.json();
    setProductSearch(p => ({ ...p, [rowId]: data }));
    setSearchingProduct(false);
  };
  const debouncedFetchProducts = useDebounce(fetchProducts, 300);

function selectProduct(rowId: string, product: DBProduct) {
  // 1) normalize the variants so color & size always match your dropdown
  const normalizedVariants = product.variants.map((v) => ({
    color: v.color.trim() || "N/A",
    size:  v.size.trim()  || "N/A",
    stock: v.stock,
  }));

  // 2) build your dropdown lists from the normalized data
  const colors = Array.from(new Set(normalizedVariants.map((v) => v.color)));
  const sizes  = Array.from(new Set(normalizedVariants.map((v) => v.size)));

  // 3) pick first
  const selColor = colors[0];
  const selSize  = sizes[0];
  const match    = normalizedVariants.find(
    (v) => v.color === selColor && v.size === selSize
  );
  const stock = match ? match.stock : 1;

  // 4) write it all into state
  setItems((prev) =>
    prev.map((i) =>
      i.id === rowId
        ? {
            ...i,
            productId:    product.id,
            productName:  product.name,
            variants:     normalizedVariants,  // <<< store the normalized list!
            colorOptions: colors,
            sizeOptions:  sizes,
            color:        selColor,
            size:         selSize,
            maxQty:       stock,
            quantity:     1,
          }
        : i
    )
  );
  setProductSearch((p) => ({ ...p, [rowId]: [] }));
}

  // ─── Whenever color or size changes, re‑lookup stock ───────────────
  function updateVariantSelection(
    rowId: string,
    newColor: string,
    newSize:  string
  ) {
    setItems(prev =>
      prev.map(i => {
        if (i.id !== rowId) return i;
        // find matching variant
        const m = i.variants.find(v => v.color === newColor && v.size === newSize);
        const stock = m?.stock ?? 1;
        return {
          ...i,
          color:    newColor,
          size:     newSize,
          maxQty:   stock,
          quantity: Math.min(Math.max(1, i.quantity), stock),
        };
      })
    );
  }

  // ─── Update arbitrary field (but intercept color/size) ─────────────
  function updateRow(
    rowId: string,
    field: keyof LineItem,
    value: any
  ) {
    if (field === "color") {
      updateVariantSelection(rowId, value, items.find(i => i.id === rowId)!.size);
      return;
    }
    if (field === "size") {
      updateVariantSelection(rowId, items.find(i => i.id === rowId)!.color, value);
      return;
    }
    // quantity
    if (field === "quantity") {
      setItems(prev =>
        prev.map(i =>
          i.id === rowId
            ? { ...i, quantity: Math.min(Math.max(1, value), i.maxQty) }
            : i
        )
      );
      return;
    }
    // other fields not used here
  }

  // ─── CUSTOMER SEARCH ─────────────────────────────────────────────────
  const fetchCustomers = async (q: string) => {
    if (!q || q.length < 2) {
      setCustomerSearch([]);
      return;
    }
    setSearchingCustomer(true);
    const res = await fetch(`/api/search-customers?query=${q}`);
    const data = await res.json();
    setCustomerSearch(data);
    setSearchingCustomer(false);
  };
  const debouncedFetchCustomers = useDebounce(fetchCustomers, 300);

  function selectCustomer(c: any) {
    setExistingCustomerId(c.id);
    setCustomerSearch([]);
  }

  // ─── SUBMIT ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/offline-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.productId,
            color:     i.color,
            size:      i.size,
            quantity:  i.quantity,
          })),
          customer: mode === "existing" ? { id: existingCustomerId } : guest,
          paymentMethod,
          currency,
          staffId,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to log sale");
        return;
      }
      toast.success("Offline sale logged!");
      setSuccessSummary({
        orderId: data.orderId,
        items:   [...items],
        paymentMethod,
      });
      // reset form
      setItems([{
        id:          uuid(),
        productId:   "",
        productName: "",
        variants:    [],
        colorOptions:["N/A"],
        sizeOptions: ["N/A"],
        color:       "N/A",
        size:        "N/A",
        maxQty:      1,
        quantity:    1,
      }]);
      setMode("existing");
      setExistingCustomerId("");
      setGuest({
        firstName:"", lastName:"", email:"",
        phone:"", address:"", country:"", state:"",
      });
      setPaymentMethod("Cash");
      setStep(1);
    } catch {
      toast.error("Failed to log sale");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>
          <nav className="flex space-x-4">
            {["Products","Customer","Payment"].map((lbl,i)=>(
              <button
                key={i}
                disabled={i+1>step||loading}
                onClick={()=>setStep(i+1)}
                className={`flex-1 py-2 text-center ${
                  step===i+1
                    ? "border-b-2 border-indigo-600 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {lbl}
              </button>
            ))}
          </nav>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {successSummary && (
          <div className="p-4 bg-green-50 border-green-200 border rounded">
            <h3 className="font-bold text-green-700">Sale Logged!</h3>
            <p>Order ID: {successSummary.orderId}</p>
            <p>Payment: {successSummary.paymentMethod}</p>
            <ul className="list-disc pl-5">
              {successSummary.items.map(it => (
                <li key={it.id}>
                  {it.productName} ({it.color}/{it.size}) × {it.quantity}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* STEP 1: PRODUCTS */}
        {step===1 && (
          <div className="space-y-4">
            {items.map(row=>(
              <div
                key={row.id}
                className="grid grid-cols-6 gap-3 items-start relative"
              >
                {/* product search */}
                <div className="col-span-2 relative">
                  <Input
                    placeholder="Search product…"
                    value={row.productName}
                    onChange={e=>{
                      // wipe out old variants
                      setItems(prev=>
                        prev.map(i=>
                          i.id===row.id
                            ? { ...i, productName:e.target.value, variants:[], productId:"" }
                            : i
                        )
                      );
                      debouncedFetchProducts(row.id,e.target.value);
                    }}
                  />
                  {searchingProduct && (
                    <div className="absolute right-2 top-2 text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                    </div>
                  )}
                  {productSearch[row.id]?.length>0 && (
                    <div className="absolute z-10 bg-white border mt-1 rounded shadow max-h-48 overflow-auto w-full">
                      {productSearch[row.id].map(p=>(
                        <div
                          key={p.id}
                          className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                          onClick={()=>selectProduct(row.id,p)}
                        >
                          {p.name} ({p.id})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* color */}
                <Select
                  value={row.color}
                  onValueChange={v=>updateRow(row.id,"color",v)}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {row.colorOptions.map(c=>(
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* size */}
                <Select
                  value={row.size}
                  onValueChange={v=>updateRow(row.id,"size",v)}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {row.sizeOptions.map(s=>(
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* quantity, now truly limited by stock */}
                <Input
                  type="number"
                  min={1}
                  max={row.maxQty}
                  value={row.quantity}
                  onChange={e=>
                    updateRow(row.id,"quantity",+e.target.value)
                  }
                />

                {/* remove row */}
                <button
                  onClick={()=>removeRow(row.id)}
                  disabled={items.length===1||loading}
                  className="text-red-600 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={loading}
            >
              <PlusCircle className="mr-1" /> Add Product
            </Button>
          </div>
        )}

        {/* STEP 2: CUSTOMER */}
        {step===2 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-6">
              {["existing","guest"].map(m=>(
                <label key={m} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={mode===m}
                    onChange={()=>setMode(m as any)}
                  />
                  <span>{m==="existing"?"Existing Customer":"Guest"}</span>
                </label>
              ))}
            </div>
            {mode==="existing" ? (
              <div className="relative">
                <Input
                  placeholder="Search by name, email, or phone…"
                  value={existingCustomerId}
                  onChange={e=>{
                    setExistingCustomerId(e.target.value);
                    debouncedFetchCustomers(e.target.value);
                  }}
                />
                {searchingCustomer && (
                  <div className="absolute right-2 top-2 text-gray-400">
                    <Loader2 className="animate-spin" size={16} />
                  </div>
                )}
                {customerSearch.length>0 && (
                  <div className="absolute z-10 bg-white border mt-1 rounded shadow max-h-48 overflow-auto w-full">
                    {customerSearch.map(c=>(
                      <div
                        key={c.id}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        onClick={()=>selectCustomer(c)}
                      >
                        {c.firstName} {c.lastName} ({c.email})
                      </div>
                    ))}
                  </div>
                )}
              </div>

            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  "firstName","lastName","email",
                  "phone","address","country","state"
                ].map(f=>(
                  <Input
                    key={f}
                    placeholder={f.charAt(0).toUpperCase()+f.slice(1)}
                    value={(guest as any)[f]}
                    onChange={e=>setGuest(g=>({...g,[f]:e.target.value}))}
                    disabled={loading}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PAYMENT & CURRENCY */}
        {step===3 && (
          <section className="space-y-4 grid grid-cols-2 gap-4">
            <Select
              value={paymentMethod}
              onValueChange={v=>setPaymentMethod(v as PaymentMethod)}
              disabled={loading}
            >
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                {["Cash","Transfer","Card"].map(m=>(
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={currency}
              onValueChange={v=>setCurrency(v as Currency)}
              disabled={loading}
            >
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Currency).map(c=>(
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={step===1||loading}
          onClick={()=>setStep(s=>s-1)}
        >
          Back
        </Button>
        {step<3 ? (
          <Button disabled={!canNext||loading} onClick={()=>canNext&&setStep(s=>s+1)}>
            Next
          </Button>
        ) : (
          <Button disabled={!canSubmit||loading} onClick={handleSubmit}>
            {loading ? "Logging…" : "Log Offline Sale"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
