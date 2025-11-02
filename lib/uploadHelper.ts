import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";
import { generateSignature } from "./cloudinary.js";
import { PrismaClient, Media } from "@prisma/client";

const prisma = new PrismaClient();

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

interface CloudinaryUploadResponse {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  folder?: string;
}

/**
 * Upload an image file to Cloudinary and create a Media record
 * @param filePath Path to the local image file
 * @param folder Cloudinary folder path
 * @param userId User ID for the media record
 * @param isProfileAvatar Whether this is a profile avatar
 * @returns Media object or null if upload fails
 */
export async function uploadImageToCloudinary(
  filePath: string,
  folder: string,
  userId: string,
  isProfileAvatar: boolean = false
): Promise<Media | null> {
  try {
    // Check if Cloudinary is configured
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.log("  ⚠️  Cloudinary not configured, skipping upload");
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`  ❌ File not found: ${filePath}`);
      return null;
    }

    console.log(`  ☁️  Uploading to Cloudinary: ${filePath}`);

    // Generate upload signature using the helper from lib/cloudinary.ts
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
    };

    const signature = generateSignature(paramsToSign);

    // Create form data for upload
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("folder", folder);
    formData.append("signature", signature);

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData as unknown as BodyInit,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Cloudinary upload failed: ${errorText}`);
      return null;
    }

    const uploadData = await response.json() as CloudinaryUploadResponse;
    console.log(`  ✅ Uploaded to Cloudinary: ${uploadData.public_id}`);

    // Create Media record in database
    const media = await prisma.media.create({
      data: {
        publicId: uploadData.public_id,
        url: uploadData.url,
        secureUrl: uploadData.secure_url,
        mimeType: `image/${uploadData.format}`,
        size: uploadData.bytes,
        width: uploadData.width || null,
        height: uploadData.height || null,
        originalFilename: filePath.split("/").pop() || "image.jpg",
        folder: uploadData.folder || folder,
        resourceType: "IMAGE",
        userId: userId,
        isProfileAvatar: isProfileAvatar,
        isPrimary: false, // Will be set later for recipes
      },
    });

    console.log(`  ✅ Created Media record: ${media.id}`);
    return media;
  } catch (error) {
    console.error(`  ❌ Failed to upload image:`, error);
    return null;
  }
}
