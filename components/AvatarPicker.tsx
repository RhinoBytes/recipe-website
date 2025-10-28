'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getAllProfileAvatars } from '@/lib/cottagecorePlaceholders';
import { Check } from 'lucide-react';

interface AvatarPickerProps {
  currentAvatar?: string;
  onSelect: (avatar: string) => void;
  className?: string;
}

/**
 * Avatar Picker Component
 * Allows users to select from cottagecore-themed profile avatars
 */
export default function AvatarPicker({ currentAvatar, onSelect, className = '' }: AvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '');
  const avatars = getAllProfileAvatars();

  const handleSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    onSelect(avatar);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold font-heading text-text mb-2">
          Choose Your Avatar
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Select a cottagecore-inspired profile picture
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2">
        {avatars.map((avatar, index) => (
          <button
            key={index}
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
              unoptimized
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
