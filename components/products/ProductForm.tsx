"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product, Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveProduct } from "@/lib/actions/product.actions";
import { uploadProductImage } from "@/lib/utils/imageUpload";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  category_id: z.string().min(1),
  price: z.number().positive(),
  mrp: z.number().optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  scheme_label: z.string().optional(),
  purchase_quantity: z.number().optional(),
  description: z.string().optional(),
  is_available: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      category_id: product?.category_id ?? "",
      price: product?.price ?? 0,
      mrp: product?.mrp ?? undefined,
      discount_percent: product?.discount_percent ?? 0,
      scheme_label: product?.scheme_label ?? "",
      purchase_quantity: product?.purchase_quantity ?? undefined,
      description: product?.description ?? "",
      is_available: product?.is_available ?? true,
    },
  });

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSubmit(values: FormData) {
    if (!imageUrl && !product?.image_url) {
      toast.error("Please upload a product photo");
      return;
    }
    try {
      await saveProduct(
        {
          ...values,
          image_url: imageUrl || product?.image_url,
          stock_quantity: product?.stock_quantity ?? 0,
        },
        product?.id
      );
      toast.success(product ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  const previewUrl = imageUrl || product?.image_url;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-4">
      <section>
        <Label>Product Name *</Label>
        <Input {...form.register("name")} />
      </section>
      <section>
        <Label>Category *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
          {...form.register("category_id")}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section>
          <Label>Price (₹) *</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register("price", { valueAsNumber: true })}
          />
        </section>
        <section>
          <Label>MRP (₹)</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register("mrp", { valueAsNumber: true })}
          />
        </section>
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section>
          <Label>Discount %</Label>
          <Input
            type="number"
            {...form.register("discount_percent", { valueAsNumber: true })}
          />
        </section>
        <section>
          <Label>Min Purchase Qty</Label>
          <Input
            type="number"
            {...form.register("purchase_quantity", { valueAsNumber: true })}
          />
        </section>
      </section>
      <section>
        <Label>Scheme Label</Label>
        <Input placeholder="Buy 10 Get 1 Free" {...form.register("scheme_label")} />
      </section>
      <section>
        <Label>Description</Label>
        <Input {...form.register("description")} />
      </section>

      <section className="rounded-xl border border-dashed border-gray-300 p-4">
        <Label>Product Photo *</Label>
        <p className="mb-3 text-xs text-gray-500">
          JPEG, PNG or WebP · max 5MB
        </p>

        {previewUrl ? (
          <section className="relative mb-3 aspect-square w-full max-w-full overflow-hidden rounded-lg bg-gray-100 sm:max-w-xs">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
              sizes="320px"
            />
          </section>
        ) : (
          <section className="mb-3 flex aspect-square w-full max-w-full items-center justify-center rounded-lg bg-gray-100 text-gray-400 sm:max-w-xs">
            <ImagePlus className="h-12 w-12" />
          </section>
        )}

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {uploading ? "Uploading…" : previewUrl ? "Change photo" : "Upload photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={onFileChange}
          />
        </label>
      </section>

      <section className="flex items-center gap-2">
        <Switch
          checked={form.watch("is_available")}
          onCheckedChange={(v) => form.setValue("is_available", v)}
        />
        <Label>Is Available</Label>
      </section>
      <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
        {product ? "Update" : "Create"} Product
      </Button>
    </form>
  );
}
