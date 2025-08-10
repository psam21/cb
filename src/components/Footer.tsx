import React from 'react';
import Link from 'next/link';
import { Heart, Globe, Github, Twitter, Mail, MapPin } from 'lucide-react';

const footerLinks = {
  platform: [
    { name: 'Explore Cultures', href: '/explore' },
    { name: 'Contribute', href: '/contribute' },
    { name: 'Elder Voices', href: '/elder-voices' },
    { name: 'Language Learning', href: '/language' },
  ],
  community: [
    { name: 'Join the Community', href: '/community' },
    { name: 'Cultural Exchange', href: '/exchange' },
    { name: 'Get Involved', href: '/get-involved' },
  ],
  resources: [
    { name: 'About Us', href: '/about' },
    { name: 'Nostr', href: '/nostr' },
    { name: 'Support', href: '/resources#support' },
    { name: 'Downloads', href: '/downloads' },
  ],
  about: [
    { name: 'Our Mission', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact Us', href: '/contact' },
  ],
};

const socialLinks = [
  { name: 'Twitter', href: '#', icon: Twitter },
  { name: 'GitHub', href: '#', icon: Github },
  { name: 'Email', href: 'mailto:hello@culturebridge.org', icon: Mail },
];

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      {/* Main Footer Content */}
      <div className="container-width section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold">Culture Bridge</h3>
                <p className="text-sm text-primary-200">Heritage Preservation Network</p>
              </div>
            </Link>
            <p className="text-primary-200 mb-6 max-w-md">
              Empowering communities to preserve and share their cultural heritage through decentralized technology, ensuring traditions endure across generations. From ancient customs to local practices, our platform supports all cultures in telling their own stories—authentically, securely, and without gatekeepers.
            </p>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 bg-primary-800 rounded-full flex items-center justify-center hover:bg-accent-600 transition-colors duration-300"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-serif font-semibold text-lg mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
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

          {/* Community Links */}
          <div>
            <h4 className="font-serif font-semibold text-lg mb-4">Community</h4>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
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

          {/* Resources Links */}
          <div>
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
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-primary-800">
          <div className="max-w-md">
            <h4 className="font-serif font-semibold text-lg mb-2">Stay Connected</h4>
            <p className="text-primary-200 mb-4">
              Get updates on new cultures, features, and community events.
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
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-primary-200 text-sm">
                © 2025 Culture Bridge. Built with ❤️ for cultural preservation.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm">
                  <Link 
                    href="/privacy"
                    className="text-primary-300 hover:text-white transition-colors duration-200"
                  >
                    Privacy Policy
                  </Link>
                  <Link 
                    href="/terms"
                    className="text-primary-300 hover:text-white transition-colors duration-200"
                  >
                    Terms of Service
                  </Link>
                  <Link 
                    href="/contact"
                    className="text-primary-300 hover:text-white transition-colors duration-200"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-primary-200 text-sm">
              <Globe className="w-4 h-4" />
              <span>Decentralized on Nostr</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
