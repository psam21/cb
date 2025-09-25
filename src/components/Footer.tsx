import React from 'react';
import Link from 'next/link';
import { Heart, Globe } from 'lucide-react';

const footerLinks = {
  resources: [
    { name: 'Why Nostr?', href: '/nostr' },
    { name: 'Get Involved', href: '/get-involved' },
    { name: 'Support', href: '/support' },
    { name: 'Downloads', href: '/downloads' },
    { name: 'About Us', href: '/about' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      {/* Main Footer Content */}
      <div className="container-width section-padding">
        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-8">
          {/* Column 1 - Brand and Description (45% width) */}
          <div className="md:col-span-5 lg:col-span-5">
            <Link href="/" className="mb-4">
              <h3 className="text-xl font-serif font-bold">Culture Bridge</h3>
              <p className="text-sm text-primary-200">Heritage Preservation Network</p>
            </Link>
            <p className="text-primary-200 mb-6">
              Empowering communities to preserve, share, and celebrate their heritage through free technology, ensuring traditions endure and stories are told authentically, securely, and—most importantly—without gatekeepers.
            </p>
          </div>

          {/* Column 2 - Resources (15% width) */}
          <div className="md:col-span-2 lg:col-span-2 md:col-start-6 lg:col-start-7">
            <h4 className="font-serif font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-primary-200 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Stay Connected (40% width) */}
          <div className="md:col-span-5 lg:col-span-5 md:col-start-8 lg:col-start-9">
            <h4 className="font-serif font-semibold text-lg mb-2">Stay Connected</h4>
            <p className="text-primary-200 text-sm mb-4">
              Get updates on new cultural content, community events, and platform features.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-l-lg bg-primary-800 text-white placeholder-primary-300 border border-primary-700 focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
              <button className="px-6 py-2 bg-accent-600 text-white rounded-r-lg hover:bg-accent-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent-400">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-800">
        <div className="container-width py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-primary-200 text-sm">
                2025 Culture Bridge. Built with ❤️ for cultural preservation.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-primary-200 text-sm">
              <Globe className="w-4 h-4" />
              <span>Decentralized on <a href="https://en.wikipedia.org/wiki/Nostr" target="_blank" rel="noopener noreferrer" className="text-accent-400 hover:text-accent-300 underline">Nostr</a></span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
