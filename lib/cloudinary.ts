import crypto from "crypto";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "";

export interface CloudinarySignatureParams {
  timestamp: number;
  folder?: string;
  upload_preset?: string;
  public_id?: string;
}

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  uploadPreset: string;
}

export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  api_key: string;
}

/**
 * Generate SHA-1 signature for Cloudinary upload
 * @param paramsToSign - Parameters to include in signature
 * @returns Hex signature string
 */
export function generateSignature(paramsToSign: Record<string, string | number>): string {
  // Sort parameters alphabetically and create string to sign
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  // Append API secret
  const stringToSign = `${sortedParams}${CLOUDINARY_API_SECRET}`;

  // Generate SHA-1 hash
  const signature = crypto
    .createHash("sha1")
    .update(stringToSign)
    .digest("hex");

  return signature;
}

/**
 * Create upload signature for client-side uploads
 * @param folder - Optional folder path for organizing uploads
 * @param recipeId - Optional recipe ID for custom folder structure
 * @returns Signature data for client to use in upload
 */
export function createUploadSignature(
  folder?: string,
  recipeId?: string
): CloudinarySignatureResponse {
  const timestamp = Math.round(Date.now() / 1000);
  
  // Construct folder path
  let uploadFolder = folder || "recipe-website";
  if (recipeId) {
    uploadFolder = `${uploadFolder}/recipes/${recipeId}`;
  }

  // Parameters to sign (excluding signature itself)
  // For signed uploads, only timestamp and folder should be included in the signature
  // upload_preset is only for unsigned uploads and should NOT be in the signature
  const paramsToSign: Record<string, string | number> = {
    timestamp: timestamp,
    folder: uploadFolder,
  };

  // Generate signature
  const signature = generateSignature(paramsToSign);

  return {
    signature,
    timestamp,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    folder: uploadFolder,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
  };
}

/**
 * Verify upload response signature from Cloudinary
 * @param uploadResponse - Response from Cloudinary after upload
 * @returns True if signature is valid
 */
export function verifyUploadSignature(
  uploadResponse: CloudinaryUploadResponse
): boolean {
  const { signature, public_id, version } = uploadResponse;

  const paramsToSign = {
    public_id,
    version,
  };

  const expectedSignature = generateSignature(paramsToSign);
  return signature === expectedSignature;
}

/**
 * Delete an asset from Cloudinary
 * @param publicId - The public ID of the asset to delete
 * @param resourceType - Type of resource (image or video)
 * @returns Response from Cloudinary API
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<{ result: string }> {
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = {
    public_id: publicId,
    timestamp: timestamp,
  };

  const signature = generateSignature(paramsToSign);

  const formData = new URLSearchParams();
  formData.append("public_id", publicId);
  formData.append("signature", signature);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp.toString());

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary deletion failed: ${errorText}`);
  }

  return response.json();
}

/**
 * Get Cloudinary configuration (safe for client)
 * Returns only non-sensitive config
 */
export function getCloudinaryConfig() {
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
  };
}

/**
 * Validate Cloudinary configuration
 * @throws Error if configuration is incomplete
 */
export function validateCloudinaryConfig(): void {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not configured");
  }
  if (!CLOUDINARY_API_KEY) {
    throw new Error("CLOUDINARY_API_KEY is not configured");
  }
  if (!CLOUDINARY_API_SECRET) {
    throw new Error("CLOUDINARY_API_SECRET is not configured");
  }
}
