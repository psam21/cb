import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { exhibitions } from '../../../data/exhibitions';
import ExhibitionDetail from '../../../components/pages/ExhibitionDetail';
import dynamic from 'next/dynamic';
const ExhibitionDetailInteractive = dynamic(() => import('../../../components/pages/ExhibitionDetailInteractive'));

export function generateStaticParams() {
  return exhibitions.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params?: Promise<{ slug?: string | string[] }>;
}): Promise<Metadata> {
  const resolved = (await (params ?? Promise.resolve({}))) as {
    slug?: string | string[];
  };
  const slug = Array.isArray(resolved.slug) ? resolved.slug[0] : resolved.slug;
  if (!slug) return { title: 'Exhibition Not Found – Culture Bridge' };
  const ex = exhibitions.find((e) => e.slug === slug);
  if (!ex) return { title: 'Exhibition Not Found – Culture Bridge' };
  return {
    title: `${ex.title} – Culture Bridge`,
    description: ex.description,
  };
}

// Conform to Next generated PageProps where params may be a Promise and optional.
type PageProps = { params?: Promise<{ slug?: string | string[] }> };

export default async function ExhibitionPage({ params }: PageProps) {
  const resolved = (await (params ?? Promise.resolve({}))) as { slug?: string | string[] };
  const slug = Array.isArray(resolved.slug) ? resolved.slug[0] : resolved.slug;
  if (!slug) notFound();
  const ex = exhibitions.find((e) => e.slug === slug);
  if (!ex) notFound();
  if (process.env.NEXT_PUBLIC_ENABLE_INTERACTIONS === 'true') {
    return <ExhibitionDetailInteractive exhibition={ex} />;
  }
  return <ExhibitionDetail exhibition={ex} />;
}
