'use client';

import { useState } from 'react';
import { Copy, Send } from 'lucide-react';
import type { ContentContactInfo } from '@/types/content-detail';

interface ContentContactSectionProps {
  contact?: ContentContactInfo;
  onReport?: () => void;
}

export function ContentContactSection({ contact, onReport }: ContentContactSectionProps) {
  const [copied, setCopied] = useState(false);

  if (!contact) {
    return null;
  }

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(contact.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy contact info', error);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-primary-100">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Get in Touch</h3>
      <p className="text-sm text-gray-600">
        {contact.description ?? 'Connect directly with the seller to coordinate your purchase or ask questions.'}
      </p>

      <div className="flex items-center justify-between rounded-xl border border-primary-100 bg-white px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{contact.label}</p>
          <p className="text-sm font-semibold text-primary-800" title={contact.value}>
            {contact.value}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {contact.href && (
            <a
              href={contact.href}
              className="btn-primary-sm inline-flex items-center gap-2"
              target={contact.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
            >
              <Send className="h-4 w-4" /> Contact
            </a>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="btn-outline-sm inline-flex items-center gap-2"
          >
            <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onReport}
        className="text-sm font-medium text-red-600 underline-offset-4 transition hover:text-red-500 hover:underline"
      >
        Report this product
      </button>
    </section>
  );
}
