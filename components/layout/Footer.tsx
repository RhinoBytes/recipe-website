'use client';

import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-800 text-white pt-12 pb-4">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          {/* Brand */}
          <div>
            <h4 className="text-xl font-bold text-[#d4735a] mb-4">CookBook</h4>
            <p className="text-zinc-300">
              Discover, share, and enjoy amazing recipes from home cooks around the world.
            </p>
          </div>
          {/* Browse */}
          <div>
            <h4 className="text-xl font-bold text-[#d4735a] mb-4">Browse</h4>
            <nav className="flex flex-col space-y-2">
              <a href="#" className="text-zinc-300 hover:text-[#d4735a] transition-colors">Popular Recipes</a>
              <a href="#" className="text-zinc-300 hover:text-[#d4735a] transition-colors">Recent Recipes</a>
              <a href="#" className="text-zinc-300 hover:text-[#d4735a] transition-colors">Categories</a>
            </nav>
          </div>
          {/* Community */}
          <div>
            <h4 className="text-xl font-bold text-[#d4735a] mb-4">Community</h4>
            <nav className="flex flex-col space-y-2">
              <a href="#" className="text-zinc-300 hover:text-[#d4735a] transition-colors">Join CookBook</a>
              <a href="#" className="text-zinc-300 hover:text-[#d4735a] transition-colors">Share Your Recipe</a>
            </nav>
          </div>
          {/* Support */}
          <div>
            <h4 className="text-xl font-bold text-[#d4735a] mb-4">Support</h4>
            <nav className="flex flex-col space-y-2">
              <a href="#" className="text-zinc-300 hover:text-[#d4735a] transition-colors">Help Center</a>
              <a href="#" className="text-zinc-300 hover:text-[#d4735a] transition-colors">Contact Us</a>
            </nav>
          </div>
        </div>
          <div className="border-t border-zinc-600 pt-6 text-center text-zinc-400">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            <span>&copy; 2024 CookBook. All rights reserved.</span>
            <span className="flex items-center gap-1">
              Made with
              <Heart size={16} className="text-[#d4735a] fill-[#d4735a]" aria-label="love" />
              for food lovers everywhere.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}