// components/admin/ProductForm.tsx
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

export interface ProductFormProps {
  initialProduct?: ProductPayload;
  onSave: (
    payload: ProductPayload,
    status: "Draft" | "Published"
  ) => Promise<void>;
}

const CONVENTIONAL_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;

export default function ProductForm({
  initialProduct,
  onSave,
}: ProductFormProps) {
  const router = useRouter();

  // — Basic fields
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [category, setCategory] = useState(
    initialProduct?.category ?? "Corporate Wears"
  );
  const [price, setPrice] = useState({
    NGN: initialProduct?.price.NGN.toString() ?? "",
    USD: initialProduct?.price.USD.toString() ?? "",
    EUR: initialProduct?.price.EUR.toString() ?? "",
    GBP: initialProduct?.price.GBP.toString() ?? "",
  });
  const [weight, setWeight] = useState(initialProduct?.weight ?? "");
  const [description, setDescription] = useState(
    initialProduct?.description ?? ""
  );
  const [hasColors, setHasColors] = useState(
    initialProduct?.colors !== undefined
  );
  const [colors, setColors] = useState<string[]>(
    initialProduct?.colors && initialProduct.colors.length > 0
      ? initialProduct.colors
      : [""]
  );
  const [sizeMods, setSizeMods] = useState(
    initialProduct?.sizeMods ?? false
  );
  const [images, setImages] = useState<string[]>(
    initialProduct?.images ?? []
  );

  // — Per‐size toggles + stock map
  const [sizeEnabled, setSizeEnabled] = useState<
    Record<string, boolean>
  >(() => {
    if (!initialProduct) {
      return Object.fromEntries(
        CONVENTIONAL_SIZES.map((s) => [s, false])
      );
    }
    const e: Record<string, boolean> = {};
    for (const s of CONVENTIONAL_SIZES) {
      e[s] =
        (initialProduct.sizeStocks[s] ?? "") !== "";
    }
    return e;
  });
  const [sizeStocks, setSizeStocks] = useState<
    Record<string, string>
  >(() => ({ ...(initialProduct?.sizeStocks ?? {}) }));

  // — Custom sizes list
  const [customSizes, setCustomSizes] = useState<
    { label: string; stock: string }[]
  >(() => {
    if (!initialProduct) return [];
    return Object.entries(initialProduct.sizeStocks)
      .filter(([k]) => !CONVENTIONAL_SIZES.includes(k as any))
      .map(([k, v]) => ({ label: k, stock: v }));
  });

  // Sync if `initialProduct` changes
  useEffect(() => {
    if (!initialProduct) return;
    setName(initialProduct.name);
    setCategory(initialProduct.category);
    setPrice({
      NGN: initialProduct.price.NGN.toString(),
      USD: initialProduct.price.USD.toString(),
      EUR: initialProduct.price.EUR.toString(),
      GBP: initialProduct.price.GBP.toString(),
    });
    setWeight(initialProduct.weight);
    setDescription(initialProduct.description);
    setHasColors(initialProduct.colors !== undefined);
    setColors(
      initialProduct.colors && initialProduct.colors.length > 0
        ? initialProduct.colors
        : [""]
    );
    setSizeMods(initialProduct.sizeMods);
    setImages(initialProduct.images);

    const enabled: Record<string, boolean> = {};
    for (const s of CONVENTIONAL_SIZES) {
      enabled[s] =
        (initialProduct.sizeStocks[s] ?? "") !== "";
    }
    setSizeEnabled(enabled);
    setSizeStocks({ ...initialProduct.sizeStocks });
    setCustomSizes(
      Object.entries(initialProduct.sizeStocks)
        .filter(([k]) => !CONVENTIONAL_SIZES.includes(k as any))
        .map(([k, v]) => ({ label: k, stock: v }))
    );
  }, [initialProduct]);

  // — File upload helper
  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    const json = (await res.json()) as {
      success: boolean;
      data: { secure_url: string };
    };
    return json.data.secure_url;
  }
  async function handleImageChange(
    e: ChangeEvent<HTMLInputElement>,
    idx: number
  ) {
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

  // — Color fields
  const addColor = () => setColors((c) => [...c, ""]);
  const updateColor = (i: number, v: string) =>
    setColors((c) => c.map((x, j) => (j === i ? v : x)));
  const removeColor = (i: number) => {
    if (colors.length > 1) {
      setColors((c) => c.filter((_, j) => j !== i));
    }
  };

  // — Size toggle
  const toggleSize = (sz: string, on: boolean) => {
    setSizeEnabled((e) => ({ ...e, [sz]: on }));
    if (!on) {
      setSizeStocks((st) => {
        const c = { ...st };
        delete c[sz];
        return c;
      });
    } else {
      setSizeStocks((st) => ({ ...st, [sz]: st[sz] ?? "" }));
    }
  };
  const updateSizeStock = (sz: string, v: string) => {
    setSizeStocks((st) => ({ ...st, [sz]: v }));
  };

  // — Custom sizes handlers
  const addCustomSize = () =>
    setCustomSizes((cs) => [...cs, { label: "", stock: "" }]);

  const updateCustomLabel = (i: number, label: string) => {
    // remember previous label to delete
    const prev = customSizes[i]?.label;
    const prevStock = customSizes[i]?.stock;
    setCustomSizes((cs) =>
      cs.map((c, j) => (j === i ? { ...c, label } : c))
    );
    setSizeStocks((st) => {
      const copy = { ...st };
      if (prev && prev !== label) delete copy[prev];
      if (label) copy[label] = prevStock ?? "";
      return copy;
    });
  };

  const updateCustomStock = (i: number, stock: string) => {
    const label = customSizes[i]?.label;
    setCustomSizes((cs) =>
      cs.map((c, j) => (j === i ? { ...c, stock } : c))
    );
    if (label) {
      setSizeStocks((st) => ({ ...st, [label]: stock }));
    }
  };

  const removeCustomSize = (i: number) => {
    const label = customSizes[i]?.label;
    setCustomSizes((cs) => cs.filter((_, j) => j !== i));
    if (label) {
      setSizeStocks((st) => {
        const copy = { ...st };
        delete copy[label];
        return copy;
      });
    }
  };

  // — Save handler
  async function handleSave(status: "Draft" | "Published") {
    const payload: ProductPayload = {
      id: initialProduct?.id,
      name,
      category,
      price: {
        NGN: price.NGN,
        USD: price.USD,
        EUR: price.EUR,
        GBP: price.GBP,
      },
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
        {/* Product Name */}
        <div>
          <Label className="mb-1">Product Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Category */}
        <div>
          <Label className="mb-1">Category</Label>
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
          <div key={cur}>
            <Label className="mb-1">Price ({cur})</Label>
            <Input
              type="number"
              value={price[cur]}
              onChange={(e) =>
                setPrice((p) => ({ ...p, [cur]: e.target.value }))
              }
              className="w-full"
            />
          </div>
        ))}

        {/* Weight */}
        <div>
          <Label className="mb-1">Weight (kg)</Label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Colors */}
        <div className="flex items-center space-x-2">
          <Switch checked={hasColors} onCheckedChange={setHasColors} />
          <Label>Has Colors?</Label>
        </div>
        {hasColors && (
          <div className="md:col-span-2">
            <Label className="mb-1">Colors</Label>
            {colors.map((c, i) => (
              <div key={i} className="flex items-center space-x-2 mb-2">
                <Input
                  placeholder={`Color ${i + 1}`}
                  value={c}
                  onChange={(e) => updateColor(i, e.target.value)}
                />
                {colors.length > 1 && (
                  <button
                    onClick={() => removeColor(i)}
                    className="p-1 text-red-500"
                  >
                    <X />
                  </button>
                )}
                {i === colors.length - 1 && (
                  <button
                    onClick={addColor}
                    className="p-1 text-green-500"
                  >
                    <Plus />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Custom‐size mods */}
        <div className="flex items-center space-x-2">
          <Switch checked={sizeMods} onCheckedChange={setSizeMods} />
          <Label>Enable Custom Size Mods?</Label>
        </div>

        {/* Conventional sizes */}
        <div className="md:col-span-2">
          <Label className="mb-1">Sizes & Stocks</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {CONVENTIONAL_SIZES.map((sz) => (
              <div key={sz} className="flex items-center space-x-2">
                <Switch
                  checked={sizeEnabled[sz]}
                  onCheckedChange={(v) => toggleSize(sz, v)}
                />
                <Label>{sz}</Label>
                {sizeEnabled[sz] && (
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={sizeStocks[sz] || ""}
                    onChange={(e) =>
                      updateSizeStock(sz, e.target.value)
                    }
                    className="w-20"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Custom sizes */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <Label>Custom Sizes</Label>
            <Button size="sm" variant="ghost" onClick={addCustomSize}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {customSizes.map((cs, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Input
                  placeholder="Size label"
                  value={cs.label}
                  onChange={(e) =>
                    updateCustomLabel(i, e.target.value)
                  }
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={cs.stock}
                  onChange={(e) =>
                    updateCustomStock(i, e.target.value)
                  }
                  className="w-20"
                />
                <button
                  onClick={() => removeCustomSize(i)}
                  className="p-1 text-red-500"
                >
                  <X />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label className="mb-1">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-32"
          />
        </div>

        {/* Images */}
        <div className="md:col-span-2">
          <Label className="mb-1">Images</Label>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: images.length + 1 }).map((_, idx) => {
              const url = images[idx];
              return (
                <div key={idx} className="relative w-full aspect-[4/3]">
                  {url ? (
                    <>
                      <img
                        src={url}
                        className="object-cover w-full h-full rounded"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className="border-2 border-dashed rounded-lg w-full h-full flex flex-col items-center justify-center text-gray-500 cursor-pointer"
                        onClick={() =>
                          document
                            .getElementById(`file-${idx}`)
                            ?.click()
                        }
                      >
                        <Plus className="h-6 w-6 mb-1" />
                        <span>Upload</span>
                      </div>
                      <input
                        id={`file-${idx}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageChange(e, idx)
                        }
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-5">
        <Button variant="destructive" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => handleSave("Draft")}>
          Save as Draft
        </Button>
        <Button onClick={() => handleSave("Published")}>
          Publish
        </Button>
      </CardFooter>
    </Card>
  );
}
