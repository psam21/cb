'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe, Heart } from 'lucide-react';

const navigationLine1 = [
  // Home link removed; users access home via the top-left icon
  { name: 'Explore Cultures', href: '/explore' },
  { name: 'Contribute', href: '/contribute' },
  { name: 'Elder Voices', href: '/elder-voices' },
  { name: 'Community', href: '/community' },
];

const navigationLine2 = [
  { name: 'Cultural Exchange', href: '/exchange' },
  { name: 'Exhibitions', href: '/exhibitions' },
  { name: 'Language Learning', href: '/language' },
];

// Combined navigation for mobile
const allNavigation = [...navigationLine1, ...navigationLine2];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              <h1 className="text-xl font-serif font-bold text-white">
                Culture Bridge
              </h1>
              <p className="text-xs text-white -mt-1 opacity-80">
                Heritage Preservation Network
              </p>
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

          {/* Language Selector & Mobile Menu */}
          <div className="flex items-center">
            {/* Mobile menu button only */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-md text-white hover:text-accent-200 hover:bg-primary-700 transition-colors duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg border border-gray-100 mt-2">
              {allNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
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
