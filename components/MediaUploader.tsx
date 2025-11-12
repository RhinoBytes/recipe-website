"use client";
import { log } from "@/lib/logger";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
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

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

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
        
        try {
          await uploadFile(file);
        } catch (fileErr) {
          // Log individual file error but continue with other files
          const errorMessage = fileErr instanceof Error ? fileErr.message : "Unknown error";
          console.error(`Failed to upload ${file.name}:`, errorMessage);
          log.error({ 
            error: fileErr instanceof Error ? { message: fileErr.message, stack: fileErr.stack } : String(fileErr),
            fileName: file.name 
          }, "Single file upload error");
          
          // Set error but don't throw - let other files continue
          setError(`Failed to upload ${file.name}: ${errorMessage}`);
        }
      }

      setUploadProgress("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      console.error("Upload error:", err);
      log.error({ 
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err) 
      }, "Upload error");
      setError(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadFile = async (file: File) => {
    log.info({ fileName: file.name, size: file.size, type: file.type }, "Starting file upload");
    
    // Validate file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      throw new Error(`Invalid file type: ${file.type}`);
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)`);
    }

    // Upload via API endpoint (server-side)
    const formData = new FormData();
    formData.append("file", file);
    if (recipeId) {
      formData.append("recipeId", recipeId);
    }

    log.info("Uploading via API endpoint");

    const response = await fetch("/api/media", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      log.error({ errorData }, "Upload API error");
      throw new Error(errorData.error || `Upload failed (${response.status})`);
    }

    const responseData = await response.json();
    log.info({ responseData }, "Upload successful");

    const newMedia = responseData.media;

    if (!newMedia) {
      throw new Error("No media data returned from API");
    }

    // Update local state
    setMedia((prev) => [...prev, newMedia]);

    // Notify parent component
    if (onMediaUploaded) {
      onMediaUploaded(newMedia);
    }

    log.info({ fileName: file.name }, "Upload complete");
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
      log.error({ 
        error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err) 
      }, "Delete error");
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
        <Button
          type="button"
          onClick={handleButtonClick}
          disabled={uploading || media.length >= maxFiles}
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
        <p className="text-sm text-text-secondary mt-2">
          {media.length} / {maxFiles} images uploaded
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-md text-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-sm block">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs underline mt-1 hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group border border-border rounded-lg overflow-hidden bg-bg"
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
              <div className="p-2 bg-bg-secondary">
                <p className="text-xs text-text-secondary truncate">
                  {item.originalFilename || "Uploaded image"}
                </p>
                <p className="text-xs text-text-muted">
                  {item.width && item.height && `${item.width}×${item.height} • `}
                  {formatFileSize(item.size)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 p-1.5 bg-error text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/90"
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