import { createClient } from "@/lib/supabase/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Image must be under 5MB");
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `products/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      throw new Error(
        'Storage bucket "product-images" not found. Create a public bucket in Supabase Storage, then run supabase/storage-policies.sql'
      );
    }
    if (error.message.includes("policy") || error.message.includes("row-level")) {
      throw new Error(
        "Upload denied. Log in as admin and run supabase/storage-policies.sql in SQL Editor."
      );
    }
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(data.path);

  return publicUrl;
}
