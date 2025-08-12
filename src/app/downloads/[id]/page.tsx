import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Resource – Culture Bridge',
};

type PageProps = { params?: Promise<{ id?: string | string[] }> };

export default async function DownloadDetailPage({ params }: PageProps) {
  const resolved = (await (params ?? Promise.resolve({}))) as { id?: string | string[] };
  const id = Array.isArray(resolved.id) ? resolved.id[0] : resolved.id;
  if (!id) notFound();
  return (
    <div className="min-h-screen bg-white">
      <section className="section-padding">
        <div className="container-width max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">Resource</h1>
          <p className="text-gray-700">Placeholder for resource detail page. ID: {id}</p>
        </div>
      </section>
    </div>
  );
}
