'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Copy, Check, Heart, Globe, Users, BookOpen } from 'lucide-react';

const LIGHTNING_ADDRESS = 'yellowbobcat7@primal.net';
const NPUB = 'npub1sjtntkr698y6cpy42cu4lxvpc46rlw463u2j6a7ltuhxjryecxjs4xfet8';

const impactAreas = [
  {
    icon: Globe,
    title: 'Cultural Preservation',
    description: 'Help preserve endangered cultural practices and traditions for future generations',
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Support indigenous communities and cultural practitioners worldwide',
  },
  {
    icon: BookOpen,
    title: 'Educational Resources',
    description: 'Fund the creation of free cultural education and learning materials',
  },
];

export default function DonateContent() {
  const [copied, setCopied] = useState(false);
  
  // Generate QR code URL using QR Server API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=lightning:${encodeURIComponent(LIGHTNING_ADDRESS)}&color=1e3a8a&bgcolor=ffffff`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(LIGHTNING_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-500 rounded-full mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              Support <span className="text-accent-400">Culture Bridge</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 leading-relaxed max-w-3xl mx-auto">
              Help us preserve and celebrate cultural heritage worldwide through decentralized technology
            </p>
          </motion.div>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Your Support Makes a Difference
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every donation helps us build a decentralized platform for cultural preservation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {impactAreas.map((area, index) => {
              const Icon = area.icon;
              return (
                <motion.div
                  key={area.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-8 text-center hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary-800 mb-3">
                    {area.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {area.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightning Donation */}
      <section className="section-padding bg-gradient-to-br from-accent-50 to-primary-50">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="card p-8 md:p-12">
              {/* Title */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <Zap className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-3">
                  Donate via Lightning Network
                </h2>
                <p className="text-lg text-gray-600">
                  Fast, low-fee Bitcoin donations using the Lightning Network
                </p>
              </div>

              {/* QR Code */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center mb-8"
              >
                <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-primary-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Lightning Address QR Code"
                    width={300}
                    height={300}
                    className="rounded-lg"
                  />
                </div>
              </motion.div>

              {/* Lightning Address */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-primary-800 mb-2">
                  Lightning Address
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={LIGHTNING_ADDRESS}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="btn-primary flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-primary-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-primary-800 mb-3">How to donate:</h3>
                <ol className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-semibold text-primary-600 mr-2">1.</span>
                    <span>Open your Lightning wallet (Phoenix, Wallet of Satoshi, Alby, etc.)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-primary-600 mr-2">2.</span>
                    <span>Scan the QR code or copy the Lightning address above</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-primary-600 mr-2">3.</span>
                    <span>Enter the amount you wish to donate</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold text-primary-600 mr-2">4.</span>
                    <span>Confirm the payment - it arrives instantly!</span>
                  </li>
                </ol>
              </div>

              {/* Nostr Link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Follow us on Nostr
                </p>
                <a
                  href={`https://primal.net/p/${NPUB}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-mono text-sm break-all"
                >
                  {NPUB}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Lightning */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-6">
              Why Lightning Network?
            </h2>
            <div className="space-y-4 text-left">
              <div className="card p-6">
                <h3 className="font-semibold text-primary-800 mb-2">⚡ Instant Payments</h3>
                <p className="text-gray-600">
                  Donations arrive in seconds, not hours or days like traditional banking
                </p>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold text-primary-800 mb-2">💰 Low Fees</h3>
                <p className="text-gray-600">
                  Minimal transaction fees mean more of your donation goes to cultural preservation
                </p>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold text-primary-800 mb-2">🌍 Global & Borderless</h3>
                <p className="text-gray-600">
                  Support us from anywhere in the world without currency conversion or international fees
                </p>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold text-primary-800 mb-2">🔒 Decentralized</h3>
                <p className="text-gray-600">
                  Aligned with our mission of decentralized cultural preservation
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Thank You */}
      <section className="section-padding bg-gradient-to-br from-primary-800 to-primary-900 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Heart className="w-16 h-16 text-accent-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Thank You for Your Support!
            </h2>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
              Your contribution helps us build a future where cultural heritage is preserved, 
              accessible, and owned by the communities that create it.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
