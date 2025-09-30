import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { contentDetailService } from '@/services/business/ContentDetailService';
import '@/services/business/HeritageContentService';
import type { HeritageCustomFields } from '@/types/heritage-content';
import { HeritageDetail } from '@/components/heritage/HeritageDetail';

export const dynamic = 'force-dynamic';

type HeritagePageProps = {
  params: Promise<{ id: string }>;
};

async function getHeritageDetail(id: string) {
  const decodedId = decodeURIComponent(id);
  const result = await contentDetailService.getContentDetail<HeritageCustomFields>('heritage', decodedId);
  if (!result.success || !result.content) {
    return null;
  }
  return result.content;
}

export async function generateMetadata({ params }: HeritagePageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getHeritageDetail(id);
  const canonicalPath = `/heritage/${id}`;
  if (!detail) {
    return {
      title: 'Heritage Contribution not found — Culture Bridge',
      alternates: {
        canonical: canonicalPath,
      },
    };
  }

  const shareImage = detail.media?.[0]?.source.url;
  const description = detail.summary ?? detail.description.slice(0, 160);

  return {
    title: `${detail.title} — Culture Bridge Heritage`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: detail.title,
      description,
      type: 'article',
      url: canonicalPath,
      images: shareImage ? [{ url: shareImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: detail.title,
      description,
      images: shareImage ? [shareImage] : undefined,
    },
  };
}

export default async function HeritagePage({ params }: HeritagePageProps) {
  const { id } = await params;
  const detail = await getHeritageDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10">
      <div className="container-width space-y-10">
        <HeritageDetail detail={detail} />
      </div>
    </div>
  );
}
