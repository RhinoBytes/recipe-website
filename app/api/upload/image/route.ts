import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";
import { log } from "@/lib/logger";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not set");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_KEY environment variable is not set");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/upload/image
 * Upload a recipe image to Supabase Storage
 */
export async function POST(request: Request) {
  try {
    // Authentication required
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    let fileExtension = file.name.includes(".") ? file.name.split(".").pop() : undefined;
    // If no extension, infer from MIME type
    if (!fileExtension) {
      const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };
      fileExtension = mimeToExt[file.type];
      if (!fileExtension) {
        return NextResponse.json(
          { error: "Could not determine file extension from MIME type" },
          { status: 400 }
        );
      }
    }
    const uniqueFilename = `recipe-${currentUser.userId}-${randomUUID()}.${fileExtension}`;

    // Upload to Supabase Storage
    const filePath = `recipes/${uniqueFilename}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("recipe-builder")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      log.error({ error: uploadError }, "Supabase upload error");
      return NextResponse.json(
        { error: `Failed to upload to storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("recipe-builder")
      .getPublicUrl(uploadData.path);

    const publicUrl = urlData.publicUrl;

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      filename: uniqueFilename,
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) },
      "Image upload error"
    );
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
