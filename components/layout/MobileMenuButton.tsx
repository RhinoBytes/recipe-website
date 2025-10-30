'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import MobileMenu from './MobileMenu';

interface MobileMenuButtonProps {
  navLinks: Array<{ label: string; href: string }>;
}

export default function MobileMenuButton({ navLinks }: MobileMenuButtonProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="p-1 text-accent hover:text-accent-hover focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <MobileMenu
        navLinks={navLinks}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
    </>
  );
}