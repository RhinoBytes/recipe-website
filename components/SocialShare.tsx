"use client";

import { Share2, Facebook, Twitter, Link as LinkIcon, Check } from "lucide-react";
import { useState, useMemo } from "react";

interface SocialShareProps {
  title: string;
  description?: string;
  url?: string;
}

export default function SocialShare({ title, description, url }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Memoize native share support check
  const supportsNativeShare = useMemo(() => {
    return typeof navigator !== 'undefined' && !!navigator.share;
  }, []);

  // Get the current URL if not provided
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = description ? `${title} - ${description}` : title;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (supportsNativeShare) {
            handleNativeShare();
          } else {
            setShowMenu(!showMenu);
          }
        }}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
      >
        <Share2 size={20} />
        Share
      </button>

      {showMenu && !supportsNativeShare && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="py-2">
            <button
              onClick={() => {
                handleCopyLink();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={18} className="text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon size={18} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                handleFacebookShare();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Facebook size={18} />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => {
                handleTwitterShare();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Twitter size={18} />
              <span>Twitter</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
          role="button"
          aria-label="Close share menu"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setShowMenu(false);
            }
          }}
        />
      )}
    </div>
  );
}
