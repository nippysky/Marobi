"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { ProductPayload } from "@/types/product";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
import toast from "react-hot-toast";

const CONVENTIONAL_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;

interface Props {
  initialProduct?: ProductPayload;
  onSave: (payload: ProductPayload) => Promise<void>;
}

export default function ProductForm({ initialProduct, onSave }: Props) {
  /* ---------- Basic Fields ---------- */
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [category, setCategory] = useState(
    initialProduct?.category ?? "Corporate Wears"
  );
  const [description, setDescription] = useState(
    initialProduct?.description ?? ""
  );
  const [price, setPrice] = useState({
    NGN: initialProduct?.price.NGN ?? "",
    USD: initialProduct?.price.USD ?? "",
    EUR: initialProduct?.price.EUR ?? "",
    GBP: initialProduct?.price.GBP ?? "",
  });
  const [status, setStatus] = useState<ProductPayload["status"]>(
    initialProduct?.status ?? "Draft"
  );
  const [sizeMods, setSizeMods] = useState(
    initialProduct?.sizeMods ?? false
  );

  /* ---------- Colors ---------- */
  const initialHasColors = (initialProduct?.colors?.length ?? 0) > 0;
  const [hasColors, setHasColors] = useState(initialHasColors);
  const [colors, setColors] = useState<string[]>(
    initialHasColors ? [...(initialProduct?.colors || [])] : []
  );

  /* ---------- Sizes ---------- */
  const [sizeStocks, setSizeStocks] = useState<Record<string, string>>(
    { ...(initialProduct?.sizeStocks || {}) }
  );
  const [sizeEnabled, setSizeEnabled] = useState<Record<string, boolean>>(
    () => {
      const base: Record<string, boolean> = {};
      for (const s of CONVENTIONAL_SIZES) {
        base[s] = initialProduct?.sizeStocks?.[s] !== undefined;
      }
      return base;
    }
  );

  /* ---------- Custom Sizes ---------- */
  const [customSizes, setCustomSizes] = useState<string[]>(
    initialProduct?.customSizes ?? []
  );

  /* ---------- Images ---------- */
  const [images, setImages] = useState<string[]>(
    initialProduct?.images ?? []
  );

  /* ---------- Effects ---------- */
  useEffect(() => {
    if (hasColors && colors.length === 0) setColors([""]);
    if (!hasColors) setColors([]);
  }, [hasColors]);

  /* ---------- Upload ---------- */
  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    const json = await res.json();
    return json.data.secure_url;
  }

  async function handleImageChange(
    e: ChangeEvent<HTMLInputElement>,
    idx: number
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setImages((imgs) => {
        const copy = [...imgs];
        copy[idx] = url;
        return copy;
      });
    } catch (err: any) {
      toast.error(err.message || "Image upload failed");
    }
  }

  /* ---------- Validation & Save ---------- */
  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!category.trim()) return "Category is required.";
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const payload: ProductPayload = {
      id: initialProduct?.id,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: {
        NGN: parseFloat(price.NGN as string) || 0,
        USD: parseFloat(price.USD as string) || 0,
        EUR: parseFloat(price.EUR as string) || 0,
        GBP: parseFloat(price.GBP as string) || 0,
      },
      status,
      sizeMods,
      colors: hasColors
        ? colors.map((c) => c.trim()).filter((c) => c)
        : [],
      sizeStocks,
      customSizes: customSizes.filter((c) => c.trim()),
      images,
    };
    try {
      await onSave(payload);
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="flex flex-col space-y-1">
          <Label>Product Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {/* Category */}
        <div className="flex flex-col space-y-1">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {[
                "Corporate Wears",
                "African Print",
                "Casual Looks",
                "I Have an Event",
              ].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex flex-col space-y-1">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ProductPayload["status"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {["Draft", "Published", "Archived"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Enable Custom Size Mods */}
        <div className="flex items-center space-x-2">
          <Switch checked={sizeMods} onCheckedChange={setSizeMods} />
          <Label>Enable Custom Size Mods?</Label>
        </div>

        {/* Prices */}
        {(["NGN", "USD", "EUR", "GBP"] as const).map((cur) => (
          <div key={cur} className="flex flex-col space-y-1">
            <Label>{cur} Price</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={price[cur]}
              onChange={(e) =>
                setPrice((p) => ({ ...p, [cur]: e.target.value }))
              }
            />
          </div>
        ))}

        {/* Description */}
        <div className="md:col-span-2 flex flex-col space-y-1">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-32"
          />
        </div>

        {/* Has Colors */}
        <div className="flex items-center space-x-2">
          <Switch checked={hasColors} onCheckedChange={setHasColors} />
          <Label>Has Colors?</Label>
        </div>

        {/* Colors List */}
        {hasColors && (
          <div className="md:col-span-2 grid grid-cols-1 gap-2">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Input
                  placeholder={`Color ${i + 1}`}
                  value={c}
                  onChange={(e) =>
                    setColors((cs) =>
                      cs.map((x, j) => (j === i ? e.target.value : x))
                    )
                  }
                />
                {colors.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setColors((cs) => cs.filter((_, j) => j !== i))
                    }
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                )}
                {i === colors.length - 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setColors((cs) => [...cs, ""])}
                  >
                    <Plus className="h-4 w-4 text-green-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sizes & Stock */}
        <div className="md:col-span-2 space-y-2">
          <Label>Sizes & Stock</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONVENTIONAL_SIZES.map((sz) => (
              <div key={sz} className="flex items-center space-x-2">
                <Switch
                  checked={sizeEnabled[sz]}
                  onCheckedChange={(on) => {
                    setSizeEnabled((s) => ({ ...s, [sz]: on }));
                    setSizeStocks((st) => {
                      const copy = { ...st };
                      if (!on) delete copy[sz];
                      else if (copy[sz] === undefined) copy[sz] = "";
                      return copy;
                    });
                  }}
                />
                <Label className="w-8">{sz}</Label>
                {sizeEnabled[sz] && (
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={sizeStocks[sz] ?? ""}
                    onChange={(e) =>
                      setSizeStocks((st) => ({
                        ...st,
                        [sz]: e.target.value,
                      }))
                    }
                    className="w-20"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Custom Sizes */}
        <div className="md:col-span-2 flex justify-between items-center">
          <Label>Custom Sizes</Label>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCustomSizes((cs) => [...cs, ""])}
          >
            <Plus className="h-5 w-5 text-indigo-600" />
          </Button>
        </div>
        {customSizes.map((label, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Input
              placeholder="Label"
              value={label}
              onChange={(e) =>
                setCustomSizes((cs) =>
                  cs.map((c, j) => (j === i ? e.target.value : c))
                )
              }
              className="w-28"
            />
            <Input
              type="number"
              placeholder="Qty"
              value={sizeStocks[label] ?? ""}
              onChange={(e) =>
                setSizeStocks((st) => ({
                  ...st,
                  [label]: e.target.value,
                }))
              }
              className="w-20"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setCustomSizes((cs) => cs.filter((_, j) => j !== i));
                setSizeStocks((st) => {
                  const copy = { ...st };
                  delete copy[label];
                  return copy;
                });
              }}
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ))}

        {/* Images */}
        <div className="md:col-span-2">
          <Label>Images</Label>
          <div className="grid grid-cols-4 gap-4 mt-2">
            {Array.from({ length: images.length + 1 }).map((_, idx) => {
              const url = images[idx];
              return (
                <div
                  key={idx}
                  className="relative aspect-[4/3] border rounded overflow-hidden"
                >
                  {url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`img-${idx}`}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1"
                        onClick={() =>
                          setImages((imgs) => imgs.filter((_, i) => i !== idx))
                        }
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div
                        onClick={() =>
                          document.getElementById(`file-${idx}`)?.click()
                        }
                        className="h-full w-full flex flex-col items-center justify-center text-gray-400 cursor-pointer"
                      >
                        <Plus className="h-6 w-6" />
                        <span className="text-xs">Upload</span>
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
          <p className="text-xs text-gray-500 mt-2">
            (First image will be used as the primary thumbnail.)
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-4">
        <Button variant="destructive" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </CardFooter>
    </Card>
  );
}
