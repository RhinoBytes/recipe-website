'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { getAllProfilePhotos } from '@/lib/profilePhotos';
import { Check, Upload, Loader2 } from 'lucide-react';

interface AvatarPickerProps {
  currentAvatar?: string;
  onSelect: (avatar: string) => void;
  className?: string;
}

/**
 * Avatar Picker Component
 * Allows users to select from default profile photos or upload their own
 */
export default function AvatarPicker({ currentAvatar, onSelect, className = '' }: AvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatars = getAllProfilePhotos();

  const handleSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    onSelect(avatar);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      handleSelect(data.avatarUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold font-heading text-text mb-2">
          Choose Your Avatar
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Select a profile picture or upload your own
        </p>
      </div>

      {uploadError && (
        <div className="bg-error/10 border border-error text-error px-4 py-2 rounded-lg text-sm">
          {uploadError}
        </div>
      )}

      <div className="grid grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2">
        {/* Upload button */}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          className="relative w-full aspect-square rounded-full overflow-hidden border-4 border-dashed border-border hover:border-accent-light transition-all hover:scale-105 bg-bg-secondary flex items-center justify-center"
          aria-label="Upload custom avatar"
        >
          {uploading ? (
            <Loader2 size={24} className="text-accent animate-spin" />
          ) : (
            <Upload size={24} className="text-text-secondary" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload avatar file"
          />
        </button>

        {/* Default avatars */}
        {avatars.map((avatar, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSelect(avatar)}
            className={`relative w-full aspect-square rounded-full overflow-hidden border-4 transition-all hover:scale-105 ${
              selectedAvatar === avatar
                ? 'border-accent shadow-lg ring-2 ring-accent'
                : 'border-border hover:border-accent-light'
            }`}
            aria-label={`Select avatar ${index + 1}`}
          >
            <Image
              src={avatar}
              alt={`Avatar option ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 20vw, 15vw"
            />
            {selectedAvatar === avatar && (
              <div className="absolute inset-0 bg-accent/30 flex items-center justify-center">
                <div className="bg-bg rounded-full p-1">
                  <Check size={20} className="text-accent" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
