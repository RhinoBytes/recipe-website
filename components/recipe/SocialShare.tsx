"use client";
import { log } from "@/lib/logger";

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
      log.error({ error: error instanceof Error ? { message: error.message } : String(error) }, "Failed to copy link");
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
        log.error({ error: error instanceof Error ? { message: error.message } : String(error) }, "Error sharing");
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
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-bg hover:bg-accent-hover rounded-lg font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Share recipe"
      >
        <Share2 size={20} />
        <span className="hidden sm:inline">Share</span>
      </button>

      {showMenu && !supportsNativeShare && (
        <div className="absolute left-0 right-0 mt-2 bg-bg-secondary rounded-lg shadow-lg border-2 border-border z-10">
          <div className="py-2">
            <button
              onClick={() => {
                handleCopyLink();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-text hover:bg-accent-light transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              aria-label="Copy link to clipboard"
            >
              {copied ? (
                <>
                  <Check size={18} className="text-success" />
                  <span className="text-success">Copied!</span>
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
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-text hover:bg-accent-light transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              aria-label="Share on Facebook"
            >
              <Facebook size={18} />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => {
                handleTwitterShare();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-text hover:bg-accent-light transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              aria-label="Share on Twitter"
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
