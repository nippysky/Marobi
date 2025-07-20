"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { ProductPayload } from "@/types/product";
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
import toast from "react-hot-toast";

const CONVENTIONAL_SIZES = ["S","M","L","XL","XXL","XXXL"] as const;

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
  const [sizeMods, setSizeMods] = useState(initialProduct?.sizeMods ?? false);

  /* ---------- Colors ---------- */
  const initialHasColors = (initialProduct?.colors?.length ?? 0) > 0;
  const [hasColors, setHasColors] = useState(initialHasColors);
  const [colors, setColors] = useState<string[]>(
    initialHasColors ? [...(initialProduct?.colors || [])] : []
  );

  /* ---------- Sizes ---------- */
  const [sizeStocks, setSizeStocks] = useState<Record<string,string>>(
    { ...(initialProduct?.sizeStocks || {}) }
  );

  const [sizeEnabled, setSizeEnabled] = useState<Record<string, boolean>>(() => {
    const base: Record<string, boolean> = {};
    for (const s of CONVENTIONAL_SIZES) {
      base[s] = sizeStocks[s] !== undefined;
    }
    return base;
  });

  const [customSizes, setCustomSizes] = useState<string[]>(
    initialProduct?.customSizes ?? []
  );

  /* ---------- Images ---------- */
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);

  /* ---------- Effects ---------- */
  useEffect(() => {
    if (!hasColors) {
      if (colors.length > 0) setColors([]); // remove colors
    } else {
      if (colors.length === 0) setColors([""]); // seed one blank input
    }
  }, [hasColors, colors.length]);

  /* ---------- Upload ---------- */
  async function uploadFile(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    const json = await res.json();
    return json.data.secure_url;
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>, idx: number) {
    if (!e.target.files?.[0]) return;
    try {
      const url = await uploadFile(e.target.files[0]);
      setImages(imgs => {
        const copy = [...imgs];
        copy[idx] = url;
        return copy;
      });
    } catch (err: any) {
      toast.error(err.message || "Image upload failed");
    }
  }

  function removeImage(idx: number) {
    setImages(imgs => imgs.filter((_, i) => i !== idx));
  }

  /* ---------- Color Helpers ---------- */
  const addColor = () => setColors(c => [...c, ""]);
  const updateColor = (i: number, v: string) =>
    setColors(c => c.map((x, j) => (j === i ? v : x)));
  const removeColor = (i: number) =>
    setColors(c => c.filter((_, j) => j !== i));

  /* ---------- Conventional Sizes ---------- */
  function toggleConventionalSize(size: string, on: boolean) {
    setSizeEnabled(se => ({ ...se, [size]: on }));
    setSizeStocks(st => {
      const copy = { ...st };
      if (!on) delete copy[size];
      else if (copy[size] === undefined) copy[size] = "";
      return copy;
    });
  }

  function updateSizeStock(size: string, stock: string) {
    setSizeStocks(st => ({ ...st, [size]: stock }));
  }

  /* ---------- Custom Sizes ---------- */
  function addCustomSize() {
    setCustomSizes(cs => [...cs, ""]);
  }
  function updateCustomSize(i: number, label: string) {
    setCustomSizes(cs => cs.map((c, j) => (j === i ? label : c)));
  }
  function updateCustomSizeStock(label: string, stock: string) {
    if (!label) return;
    setSizeStocks(st => ({ ...st, [label]: stock }));
  }
  function removeCustomSize(i: number) {
    const label = customSizes[i];
    setCustomSizes(cs => cs.filter((_, j) => j !== i));
    setSizeStocks(st => {
      const copy = { ...st };
      delete copy[label];
      return copy;
    });
  }

  /* ---------- Validation ---------- */
  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!category.trim()) return "Category is required.";
    return null;
  }

  /* ---------- Save ---------- */
  async function handleSave() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const cleanedSizeStocks: Record<string,string> = {};
    for (const [k, v] of Object.entries(sizeStocks)) {
      if (k.trim() && v !== "") cleanedSizeStocks[k.trim()] = v;
    }

    const payload: ProductPayload = {
      id: initialProduct?.id,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      images,
      price,
      status,
      sizeMods,
      colors: hasColors
        ? colors.map(c => c.trim()).filter(c => c.length > 0)
        : [],
      sizeStocks: cleanedSizeStocks,
      customSizes: customSizes.filter(c => c.trim().length > 0),
    };

    try {
      await onSave(payload);
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  }

  /* ---------- Render ---------- */
  return (
    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="flex flex-col space-y-2">
          <Label>Product Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Category */}
        <div className="flex flex-col space-y-2">
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
              ].map(c => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex flex-col space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={v => setStatus(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* sizeMods */}
        <div className="flex items-center space-x-2">
          <Switch checked={sizeMods} onCheckedChange={setSizeMods} />
          <Label>Enable Custom Size Mods?</Label>
        </div>

        {/* Description */}
        <div className="md:col-span-2 flex flex-col space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="h-32"
          />
        </div>

        {/* Colors toggle */}
        <div className="flex items-center space-x-2">
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
                  onChange={e => updateColor(i, e.target.value)}
                />
                {colors.length > 1 && (
                  <button
                    className="text-red-500"
                    onClick={() => removeColor(i)}
                    type="button"
                  >
                    <X />
                  </button>
                )}
                {i === colors.length - 1 && (
                  <button
                    className="text-green-500"
                    onClick={addColor}
                    type="button"
                  >
                    <Plus />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sizes & Stock */}
        <div className="md:col-span-2">
          <Label>Sizes & Stock</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {CONVENTIONAL_SIZES.map(sz => (
              <div key={sz} className="flex items-center space-x-2">
                <Switch
                  checked={sizeEnabled[sz]}
                  onCheckedChange={on => toggleConventionalSize(sz, on)}
                />
                <Label>{sz}</Label>
                {sizeEnabled[sz] && (
                  <Input
                    type="number"
                    value={sizeStocks[sz] ?? ""}
                    onChange={e => updateSizeStock(sz, e.target.value)}
                    placeholder="Qty"
                    className="w-20"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Custom Sizes */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center">
            <Label>Custom Sizes</Label>
            <Button size="sm" variant="ghost" onClick={addCustomSize} type="button">
              <Plus />
            </Button>
          </div>
          <div className="space-y-2 mt-2">
            {customSizes.map((label, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Input
                  placeholder="Label"
                  value={label}
                  onChange={e => updateCustomSize(i, e.target.value)}
                  className="w-28"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={sizeStocks[label] ?? ""}
                  onChange={e => updateCustomSizeStock(label, e.target.value)}
                  className="w-20"
                />
                <button
                  className="text-red-500"
                  onClick={() => removeCustomSize(i)}
                  type="button"
                >
                  <X />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="md:col-span-2">
          <Label>Images</Label>
          <div className="grid grid-cols-4 gap-4 mt-2">
            {Array.from({ length: images.length + 1 }).map((_, idx) => {
              const url = images[idx];
              return (
                <div
                  key={idx}
                  className="relative aspect-[4/3] w-full border rounded overflow-hidden"
                >
                  {url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`img-${idx}`}
                        className="object-cover w-full h-full"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] px-1 py-0.5 rounded">
                          PRIMARY
                        </span>
                      )}
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-white rounded-full text-red-500 shadow"
                        type="button"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        onClick={() =>
                          document.getElementById(`file-${idx}`)?.click()
                        }
                        className="h-full w-full flex flex-col items-center justify-center text-gray-500 cursor-pointer text-xs"
                      >
                        <Plus className="mb-1" />
                        <span>Upload</span>
                      </div>
                      <input
                        id={`file-${idx}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleImageChange(e, idx)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {images.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              First image is treated as the primary.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-4">
        <Button
          variant="destructive"
          type="button"
          onClick={() => history.back()}
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleSave}>
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
