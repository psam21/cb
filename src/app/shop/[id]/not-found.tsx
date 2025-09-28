import Link from 'next/link';
import { ContentNotFound } from '@/components/generic/ContentNotFound';

export default function ShopProductNotFound() {
  return (
    <div className="min-h-screen bg-primary-50 py-10">
      <div className="container-width space-y-8">
        <ContentNotFound
          title="Product not found"
          description="We couldn’t locate this product. It may have been unpublished or never existed."
          backHref="/shop"
          backLabel="Back to shop"
        />
        <div className="mx-auto max-w-3xl rounded-3xl bg-white/80 p-8 shadow-md ring-1 ring-primary-100">
          <h3 className="text-lg font-semibold text-primary-900">Browse other collections</h3>
          <p className="mt-2 text-sm text-gray-600">
            Discover more handmade crafts, traditional recordings, and curated artifacts from the Culture Bridge shop.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { href: '/shop?category=Textiles', label: 'Explore Textiles' },
              { href: '/shop?category=Art', label: 'View Art & Artifacts' },
              { href: '/shop?category=Audio', label: 'Hear Cultural Recordings' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 transition hover:border-primary-200 hover:bg-primary-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
