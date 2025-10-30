import Link from 'next/link';

import UserDropdown from './UserDropdown';
import MobileMenuButton from './MobileMenuButton';
import SearchBar from './SearchBar';
import Utensils from './Utensils';
import ThemeToggle from '@/components/ui/ThemeToggle';

const NAV_LINKS = [
  { label: 'Browse', href: '/browse' },
];

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 backdrop-blur-md bg-bg/80 transition-shadow border-b border-border/50">
      <div className="max-w-7xl mx-auto px-5 w-full h-full">
        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center justify-between gap-8 h-full"
          aria-label="Main Navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold font-heading text-accent hover:text-accent-hover transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Utensils size={24} />
            <span>Cookbook</span>
          </Link>

          {/* Search Bar - Client Component */}
          <SearchBar />

          {/* Nav Links & Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <ul className="flex gap-8 items-center m-0 p-0 list-none">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-text font-medium hover:text-accent transition-colors whitespace-nowrap"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Actions Dropdown - Client Component */}
            <UserDropdown />
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-between h-full">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold font-heading text-accent"
          >
            <Utensils size={24} />
            <span>Cookbook</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <MobileMenuButton navLinks={NAV_LINKS} />
          </div>
        </nav>
      </div>
    </header>
  );
}