'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Import your auth hook
import UserDropdown from './UserDropdown';
import MobileMenu from './MobileMenu';
import Utensils from './Utensils';

const NAV_LINKS = [
  { label: 'Browse', href: '/browse' },
  { label: 'Categories', href: '/categories' },
  { label: 'Popular', href: '/popular' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  useAuth(); // Keep auth initialized for the app

  // Handle scroll shadow + blur
  useEffect(() => {
    const onScroll = () => requestAnimationFrame(() => setIsScrolled(window.scrollY > 100));
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md bg-white/80 transition-all ${
        isScrolled ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5">
        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center justify-between py-4 gap-8"
          aria-label="Main Navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <Utensils size={24} />
            Cookbook
          </Link>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-900 w-4 h-4" />
            <input
              type="text"
              placeholder="Search recipes, ingredients, or chefs..."
              className="w-full pl-10 pr-4 py-2 border-2 border-orange-200 rounded-full text-sm focus:outline-none focus:border-amber-700 focus-visible:ring-2 focus-visible:ring-amber-700 transition-colors"
            />
          </div>

          {/* Nav Links */}
          <ul className="flex gap-8 items-center m-0 p-0 list-none">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-gray-800 font-medium hover:text-amber-700 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* User Actions Dropdown */}
          <UserDropdown
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            dropdownRef={dropdownRef}
          />
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-between py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-amber-700"
          >
            <Utensils size={24} />
            Cookbook
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-amber-700 hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-amber-700 rounded-md"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <MobileMenu
          navLinks={NAV_LINKS}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </div>
    </header>
  );
}