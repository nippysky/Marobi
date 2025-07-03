"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { ProductPayload } from "@/lib/products";

const CONVENTIONAL_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;
type CustomSize = { label: string; stock: string };

export interface ProductFormProps {
  initialProduct?: ProductPayload;
  onSave: (payload: ProductPayload, status: "Draft" | "Published") => Promise<void>;
}

export default function ProductForm({
  initialProduct,
  onSave,
}: ProductFormProps) {
  const router = useRouter();

  // — Basic fields
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [category, setCategory] = useState(initialProduct?.category ?? "Corporate Wears");
  const [price, setPrice] = useState({
    NGN: initialProduct?.price.NGN ?? "",
    USD: initialProduct?.price.USD ?? "",
    EUR: initialProduct?.price.EUR ?? "",
    GBP: initialProduct?.price.GBP ?? "",
  });
  const [weight, setWeight] = useState(initialProduct?.weight ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  // — Colors
  const [hasColors, setHasColors] = useState(!!initialProduct?.colors);
  const [colors, setColors] = useState<string[]>(
    initialProduct?.colors?.length
      ? initialProduct.colors
      : [""]
  );
  // — Custom-size toggle
  const [sizeMods, setSizeMods] = useState(initialProduct?.sizeMods ?? false);
  // — Images
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);

  // — Which conventional sizes are enabled?
  const [sizeEnabled, setSizeEnabled] = useState<Record<string, boolean>>(() => {
    if (!initialProduct) {
      return Object.fromEntries(CONVENTIONAL_SIZES.map((s) => [s, false]));
    }
    return Object.fromEntries(
      CONVENTIONAL_SIZES.map((s) => [s, !!initialProduct.sizeStocks[s]])
    );
  });
  // — The per-size stock map
  const [sizeStocks, setSizeStocks] = useState<Record<string, string>>(
    () => ({ ...initialProduct?.sizeStocks })
  );

  // — Custom sizes array
  const [customSizes, setCustomSizes] = useState<CustomSize[]>(() => {
    if (!initialProduct) return [];
    return Object.entries(initialProduct.sizeStocks)
      .filter(([k]) => !CONVENTIONAL_SIZES.includes(k as any))
      .map(([label, stock]) => ({ label, stock }));
  });

  // If initialProduct changes (edit page), re-seed everything
  useEffect(() => {
    if (!initialProduct) return;
    setName(initialProduct.name);
    setCategory(initialProduct.category);
    setPrice({
      NGN: initialProduct.price.NGN,
      USD: initialProduct.price.USD,
      EUR: initialProduct.price.EUR,
      GBP: initialProduct.price.GBP,
    });
    setWeight(initialProduct.weight);
    setDescription(initialProduct.description);
    setHasColors(!!initialProduct.colors);
    setColors(initialProduct.colors ?? [""]);
    setSizeMods(initialProduct.sizeMods);
    setImages(initialProduct.images);

    setSizeEnabled(
      Object.fromEntries(
        CONVENTIONAL_SIZES.map((s) => [s, !!initialProduct.sizeStocks[s]])
      )
    );
    setSizeStocks({ ...initialProduct.sizeStocks });

    setCustomSizes(
      Object.entries(initialProduct.sizeStocks)
        .filter(([k]) => !CONVENTIONAL_SIZES.includes(k as any))
        .map(([label, stock]) => ({ label, stock }))
    );
  }, [initialProduct]);

  // — File upload helper
  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    const json = (await res.json()) as { success: boolean; data: { secure_url: string } };
    return json.data.secure_url;
  }
  async function handleImageChange(e: ChangeEvent<HTMLInputElement>, idx: number) {
    if (!e.target.files?.[0]) return;
    const url = await uploadFile(e.target.files[0]);
    setImages((imgs) => {
      const copy = [...imgs];
      copy[idx] = url;
      return copy;
    });
  }
  function removeImage(idx: number) {
    setImages((imgs) => imgs.filter((_, i) => i !== idx));
  }

  // — Colors helpers
  const addColor = () => setColors((c) => [...c, ""]);
  const updateColor = (i: number, v: string) =>
    setColors((c) => c.map((x, j) => (j === i ? v : x)));
  const removeColor = (i: number) =>
    setColors((c) => c.filter((_, j) => j !== i));

  // — Conventional size toggle
  function toggleSize(size: string, on: boolean) {
    setSizeEnabled((e) => ({ ...e, [size]: on }));
    setSizeStocks((st) => {
      const copy = { ...st };
      if (!on) delete copy[size];
      else if (copy[size] === undefined) copy[size] = "";
      return copy;
    });
  }
  function updateSizeStock(size: string, qty: string) {
    setSizeStocks((st) => ({ ...st, [size]: qty }));
  }

  // — Custom sizes
  const addCustomSize = () =>
    setCustomSizes((list) => [...list, { label: "", stock: "" }]);
  function updateCustomSizeLabel(idx: number, label: string) {
    const old = customSizes[idx]?.label;
    const oldStock = customSizes[idx]?.stock;
    setCustomSizes((list) =>
      list.map((item, j) => (j === idx ? { ...item, label } : item))
    );
    setSizeStocks((st) => {
      const copy = { ...st };
      if (old && old !== label) delete copy[old];
      if (label) copy[label] = oldStock ?? "";
      return copy;
    });
  }
  function updateCustomSizeStock(idx: number, stock: string) {
    const label = customSizes[idx]?.label;
    setCustomSizes((list) =>
      list.map((item, j) => (j === idx ? { ...item, stock } : item))
    );
    if (label) setSizeStocks((st) => ({ ...st, [label]: stock }));
  }
  function removeCustomSize(idx: number) {
    const label = customSizes[idx]?.label;
    setCustomSizes((list) => list.filter((_, j) => j !== idx));
    if (label) {
      setSizeStocks((st) => {
        const copy = { ...st };
        delete copy[label];
        return copy;
      });
    }
  }

  // — Save
  async function handleSave(status: "Draft" | "Published") {
    const payload: ProductPayload = {
      id: initialProduct?.id,
      name,
      category,
      price,
      weight,
      description,
      colors: hasColors ? colors : undefined,
      sizeMods,
      sizeStocks,
      images,
      status,
    };
    await onSave(payload, status);
  }

  return (
    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="flex flex-col space-y-3">
          <Label>Product Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {/* Category */}
        <div className="flex flex-col space-y-3">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {[
                "Corporate Wears",
                "African Print",
                "Casual Looks",
                "I Have an Event",
              ].map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prices */}
        {(["NGN", "USD", "EUR", "GBP"] as const).map((cur) => (
          <div key={cur} className="flex flex-col space-y-3">
            <Label>Price ({cur})</Label>
            <Input
              type="number"
              value={price[cur]}
              onChange={(e) =>
                setPrice((p) => ({ ...p, [cur]: e.target.value }))
              }
            />
          </div>
        ))}

        {/* Weight */}
        <div className="flex flex-col space-y-3">
          <Label>Weight (kg)</Label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        {/* Colors */}
        <div className="flex items-center space-x-2" >
          <Switch checked={hasColors} onCheckedChange={setHasColors} />
          <Label>Has Colors?</Label>
        </div>
        {hasColors && (
          <div className="md:col-span-2">
            <Label>Colors</Label>
            {colors.map((c, i) => (
              <div key={i} className="flex items-center space-x-2 mt-2">
                <Input
                  placeholder={`Color ${i + 1}`}
                  value={c}
                  onChange={(e) => updateColor(i, e.target.value)}
                />
                <button onClick={() => removeColor(i)} className="text-red-500">
                  <X />
                </button>
                {i === colors.length - 1 && (
                  <button onClick={addColor} className="text-green-500">
                    <Plus />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Custom-size Mods */}
        <div className="flex items-center space-x-2">
          <Switch checked={sizeMods} onCheckedChange={setSizeMods} />
          <Label>Enable Custom Size Mods?</Label>
        </div>

        {/* Conventional Sizes */}
        <div className="md:col-span-2">
          <Label>Sizes &amp; Stock</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {CONVENTIONAL_SIZES.map((sz) => (
              <div key={sz} className="flex items-center space-x-2">
                <Switch
                  checked={sizeEnabled[sz]}
                  onCheckedChange={(on) => toggleSize(sz, on)}
                />
                <Label>{sz}</Label>
                {sizeEnabled[sz] && (
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={sizeStocks[sz] ?? ""}
                    onChange={(e) => updateSizeStock(sz, e.target.value)}
                    className="w-20"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Custom Sizes */}
        <div className="md:col-span-2 mt-4">
          <div className="flex justify-between items-center">
            <Label>Custom Sizes</Label>
            <Button size="sm" variant="ghost" onClick={addCustomSize}>
              <Plus />
            </Button>
          </div>
          <div className="space-y-2 mt-2">
            {customSizes.map((csz, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Input
                  placeholder="Label"
                  value={csz.label}
                  onChange={(e) => updateCustomSizeLabel(i, e.target.value)}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={csz.stock}
                  onChange={(e) => updateCustomSizeStock(i, e.target.value)}
                  className="w-20"
                />
                <button onClick={() => removeCustomSize(i)} className="text-red-500">
                  <X />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2 flex flex-col space-y-3">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-32"
          />
        </div>

        {/* Images */}
        <div className="md:col-span-2">
          <Label>Images</Label>
          <div className="grid grid-cols-4 gap-4 mt-2">
            {Array.from({ length: images.length + 1 }).map((_, idx) => {
              const url = images[idx];
              return (
                <div key={idx} className="relative aspect-[4/3] w-full">
                  {url ? (
                    <>
                      <img
                        src={url}
                        alt={`img-${idx}`}
                        className="object-cover w-full h-full rounded"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-white rounded-full text-red-500"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        onClick={() => document.getElementById(`file-${idx}`)?.click()}
                        className="h-full w-full border-2 border-dashed rounded flex flex-col items-center justify-center text-gray-500 cursor-pointer"
                      >
                        <Plus />
                        <span>Upload</span>
                      </div>
                      <input
                        id={`file-${idx}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, idx)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-4">
        <Button variant="destructive" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => handleSave("Draft")}>
          Save Draft
        </Button>
        <Button onClick={() => handleSave("Published")}>Publish</Button>
      </CardFooter>
    </Card>
  );
}
