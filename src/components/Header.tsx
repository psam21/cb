'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe, Heart } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Explore Cultures', href: '/explore' },
  { name: 'Contribute', href: '/contribute' },
  { name: 'Elder Voices', href: '/elder-voices' },
  { name: 'Community', href: '/community' },
  { name: 'Cultural Exchange', href: '/exchange' },
  { name: 'Nostr', href: '/nostr' },
];

const moreNavigation = [
  { name: 'About', href: '/about' },
  { name: 'Digital Museum', href: '/museum' },
  { name: 'Language Learning', href: '/language' },
  { name: 'Resources', href: '/resources' },
  { name: 'Get Involved', href: '/get-involved' },
];

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
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'backdrop-blur-glass shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <nav className="container-width">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-800 to-accent-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-serif font-bold text-primary-800">
                Culture Bridge
              </h1>
              <p className="text-xs text-gray-600 -mt-1">
                Heritage Preservation Network
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-primary-800 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-800 hover:bg-primary-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* More Menu */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-800 hover:bg-primary-50 transition-colors duration-200">
                More
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {moreNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:text-primary-800 hover:bg-primary-50 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Language Selector & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="flex items-center space-x-1 px-2 py-1 rounded-md text-sm text-gray-700 hover:text-primary-800 hover:bg-primary-50 transition-colors duration-200"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">EN</span>
              </button>
              
              {languageMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-primary-800 hover:bg-primary-50 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200"
                      onClick={() => setLanguageMenuOpen(false)}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-primary-800 hover:bg-primary-50 transition-colors duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg border border-gray-100 mt-2">
              {navigation.map((item) => (
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
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  More
                </div>
                {moreNavigation.map((item) => (
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
          </div>
        )}
      </nav>
    </header>
  );
}
