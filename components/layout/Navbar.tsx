'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Import your auth hook
import UserDropdown from './UserDropdown';
import MobileMenu from './MobileMenu';
import Utensils from './Utensils';
import ThemeToggle from '@/components/ThemeToggle';

const NAV_LINKS = [
  { label: 'Browse', href: '/browse' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
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

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md bg-bg/80 transition-all ${
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
            className="flex items-center gap-2 text-2xl font-bold font-heading text-accent hover:text-accent-hover transition-colors"
          >
            <Utensils size={24} />
            Cookbook
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes, ingredients, or chefs..."
              className="w-full pl-10 pr-4 py-2 border-2 border-border rounded-full text-sm bg-bg-secondary text-text focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent transition-colors"
            />
          </form>

          {/* Nav Links */}
          <ul className="flex gap-8 items-center m-0 p-0 list-none">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-text font-medium hover:text-accent transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Theme Toggle */}
          <ThemeToggle />

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
            className="flex items-center gap-2 text-2xl font-bold font-heading text-accent"
          >
            <Utensils size={24} />
            Cookbook
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-accent hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent rounded-md"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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