"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
// Import the shared Media type
import type { Media } from "@/types/index";

interface MediaUploaderProps {
  recipeId?: string;
  existingMedia?: Media[];
  onMediaUploaded?: (media: Media) => void;
  onMediaDeleted?: (mediaId: string) => void;
  maxFiles?: number;
  accept?: string;
}

export default function MediaUploader({
  recipeId,
  existingMedia = [],
  onMediaUploaded,
  onMediaDeleted,
  maxFiles = 5,
  accept = "image/*",
}: MediaUploaderProps) {
  const [media, setMedia] = useState<Media[]>(existingMedia);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check file limit
    if (media.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
        await uploadFile(file);
      }

      setUploadProgress("");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadFile = async (file: File) => {
    // Generate unique file path
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = recipeId 
      ? `recipes/${recipeId}/${fileName}`
      : `uploads/${fileName}`;

    // Step 1: Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("recipe-builder")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Upload failed");
    }

    // Step 2: Get public URL
    const { data: urlData } = supabase.storage
      .from("recipe-builder")
      .getPublicUrl(uploadData.path);

    // Step 3: Persist Media record to database
    const mediaResponse = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storage_path: uploadData.path,
        url: urlData.publicUrl,
        bytes: file.size,
        format: fileExt,
        resource_type: file.type.startsWith("video/") ? "video" : "image",
        original_filename: file.name,
        recipeId: recipeId || null,
        altText: null,
      }),
    });

    if (!mediaResponse.ok) {
      // If database save fails, try to clean up the uploaded file
      await supabase.storage.from("recipe-builder").remove([uploadData.path]);
      const errorData = await mediaResponse.json();
      throw new Error(errorData.error || "Failed to save media record");
    }

    const { media: newMedia } = await mediaResponse.json();

    // Update local state
    setMedia((prev) => [...prev, newMedia]);

    // Notify parent component
    if (onMediaUploaded) {
      onMediaUploaded(newMedia);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete media");
      }

      // Update local state
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));

      // Notify parent component
      if (onMediaDeleted) {
        onMediaDeleted(mediaId);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleFileSelect}
          disabled={uploading || media.length >= maxFiles}
          className="hidden"
          id="media-upload-input"
        />
        <label htmlFor="media-upload-input">
          <Button
            as="button"
            disabled={uploading || media.length >= maxFiles}
            className="cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadProgress}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image{maxFiles > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </label>
        <p className="text-sm text-gray-600 mt-2">
          {media.length} / {maxFiles} images uploaded
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
            >
              <div className="aspect-square relative">
                <Image
                  src={item.secureUrl || item.url}
                  alt={item.altText || item.originalFilename || "Recipe image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs text-gray-600 truncate">
                  {item.originalFilename || "Uploaded image"}
                </p>
                <p className="text-xs text-gray-400">
                  {item.width && item.height && `${item.width}×${item.height} • `}
                  {formatFileSize(item.size)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Delete image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
