'use client';

import { useState } from 'react';
import { Search, LogIn, UserPlus, Plus, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext"; 

type NavLink = { label: string; href: string };

interface MobileMenuProps {
  navLinks: NavLink[];
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function MobileMenu({ navLinks, mobileMenuOpen, setMobileMenuOpen }: MobileMenuProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  
  if (!mobileMenuOpen) return null;

  const handleLinkClick = () => setMobileMenuOpen(false);
  
  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="md:hidden absolute top-full left-0 right-0 bg-bg/95 backdrop-blur-md border-b border-border shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-5 py-4 space-y-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full pl-10 pr-4 py-2 border-2 border-border rounded-full text-sm bg-bg-secondary text-text focus:outline-none focus:border-accent"
          />
        </form>

        {/* Nav Links */}
        <ul className="space-y-2 list-none m-0 p-0">
          {navLinks.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={handleLinkClick}
                className="block text-text font-medium hover:text-accent transition-colors py-2"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* auth Links */}
        <div className="border-t-2 border-border pt-4 space-y-2">
          {loading ? (
            <div className="text-text-secondary">Loading...</div>
          ) : isAuthenticated ? (
            // Authenticated user options
            <>
              <Link
                href={`/profile/${user?.id}`}
                onClick={handleLinkClick}
                className="flex items-center gap-3 text-text font-medium hover:text-accent transition-colors py-2"
              >
                <User size={16} />
                My Profile
              </Link>
              <Link
                href="/recipes/new"
                onClick={handleLinkClick}
                className="flex items-center gap-3 text-accent font-medium hover:text-accent-hover transition-colors py-2"
              >
                <Plus size={16} />
                Create Recipe
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full text-left items-center gap-3 text-text font-medium hover:text-error transition-colors py-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            // Non-authenticated user options
            <>
              <Link
                href="/auth?tab=login"
                onClick={handleLinkClick}
                className="flex items-center gap-3 text-text font-medium hover:text-accent transition-colors py-2"
              >
                <LogIn size={16} />
                Sign In
              </Link>
              <Link
                href="/auth?tab=register"
                onClick={handleLinkClick}
                className="flex items-center gap-3 text-text font-medium hover:text-accent transition-colors py-2"
              >
                <UserPlus size={16} />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}