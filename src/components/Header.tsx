'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import AuthButton from './auth/AuthButton';

const navigationLine1 = [
  // Home link removed; users access home via the top-left icon
  { name: 'Explore', href: '/explore' },
  { name: 'Contribute', href: '/contribute' },
  { name: 'Community', href: '/community' },
  { name: 'Courses', href: '/courses' },
];

const navigationLine2 = [
  { name: 'Exhibitions', href: '/exhibitions' },
  { name: 'Meetups', href: '/meetups' },
  { name: 'Shop', href: '/shop' },
  { name: 'Support', href: '/support' },
];

// Combined navigation for mobile
const allNavigation = [...navigationLine1, ...navigationLine2];

// Removed unused languages array (was producing an unused variable lint warning)

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        toggleBtnRef.current?.focus();
      }
      // Basic focus trap: cycle Tab within menu when open
      if (e.key === 'Tab' && menuRef.current) {
        const focusables = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Focus first link when opening
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => firstLinkRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);
  const pathname = usePathname();

  // removed scroll listener (unused state)

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-primary-800 shadow-lg`}
    >
      <nav className="container-width">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            {/* Logo icon removed, only text remains */}
            <div className="hidden sm:block">
              <h1 className="text-xl font-serif font-bold text-white">Culture Bridge</h1>
              <p className="text-xs text-white -mt-1 opacity-80">Heritage Preservation Network</p>
            </div>
          </Link>

          {/* Desktop Navigation - Single Row */}
          <div className="hidden lg:flex items-center space-x-1">
            {[...navigationLine1, ...navigationLine2].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-base font-semibold transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-white bg-primary-600'
                    : 'text-white hover:text-accent-200 hover:bg-primary-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side: Auth Button + Mobile Menu */}
          <div className="flex items-center space-x-3">
            {/* Auth Button - Always visible */}
            <AuthButton />
            
            {/* Mobile menu button */}
            <button
              ref={toggleBtnRef}
              onClick={() => setIsOpen((prev: boolean) => !prev)}
              aria-expanded={isOpen}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-md text-white hover:text-accent-200 hover:bg-primary-700 transition-colors duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden" role="dialog" aria-modal="true">
            <div
              id="mobile-nav"
              ref={menuRef}
              className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg border border-gray-100 mt-2"
            >
              {/* Auth Button - Mobile */}
              <div className="px-3 py-2">
                <AuthButton />
              </div>
              
              <div className="border-t border-gray-100 my-2"></div>
              
              {allNavigation.map((item, idx) => (
                <Link
                  key={item.name}
                  href={item.href}
                  ref={idx === 0 ? firstLinkRef : undefined}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    pathname === item.href
                      ? 'text-primary-800 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-800 hover:bg-primary-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
