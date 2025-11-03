'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-bg-secondary border-t-2 border-border text-text pt-12 pb-4">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          {/* Brand */}
          <div>
            <h4 className="text-xl font-bold font-heading text-accent mb-4">CookBook</h4>
            <p className="text-text-secondary">
              Discover, share, and enjoy amazing recipes from home cooks around the world.
            </p>
          </div>
          {/* Browse */}
          <div>
            <h4 className="text-xl font-bold font-heading text-accent mb-4">Browse</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/browse" className="text-text-secondary hover:text-accent transition-colors">All Recipes</Link>
              <Link href="/browse" className="text-text-secondary hover:text-accent transition-colors">Recent Recipes</Link>
            </nav>
          </div>
          {/* Community */}
          <div>
            <h4 className="text-xl font-bold font-heading text-accent mb-4">Community</h4>
            <nav className="flex flex-col space-y-2">
              <a href="#" className="text-text-secondary hover:text-accent transition-colors">Join CookBook</a>
              <a href="#" className="text-text-secondary hover:text-accent transition-colors">Share Your Recipe</a>
            </nav>
          </div>
          {/* Support */}
          <div>
            <h4 className="text-xl font-bold font-heading text-accent mb-4">Support</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/faq" className="text-text-secondary hover:text-accent transition-colors">FAQ</Link>
              <Link href="/contact" className="text-text-secondary hover:text-accent transition-colors">Contact Us</Link>
            </nav>
          </div>
        </div>
          <div className="border-t border-border pt-6 text-center text-text-muted">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            <span>&copy; 2024 CookBook. All rights reserved.</span>
            <span className="flex items-center gap-1">
              Made with
              <Heart size={16} className="text-secondary fill-secondary" aria-label="love" />
              for food lovers everywhere.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}