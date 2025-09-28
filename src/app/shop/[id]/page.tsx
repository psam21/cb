import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { contentDetailService } from '@/services/business/ContentDetailService';
import '@/services/business/ShopContentService';
import type { ShopCustomFields } from '@/types/shop-content';
import { ShopProductDetail } from '@/components/shop/ShopProductDetail';
import { ShopProductJsonLd } from '@/components/shop/ShopProductJsonLd';

export const dynamic = 'force-dynamic';

type ShopProductPageProps = {
  params: Promise<{ id: string }>;
};

async function getProductDetail(id: string) {
  const decodedId = decodeURIComponent(id);
  const result = await contentDetailService.getContentDetail<ShopCustomFields>('shop', decodedId);
  if (!result.success || !result.content) {
    return null;
  }
  return result.content;
}

export async function generateMetadata({ params }: ShopProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getProductDetail(id);
  const canonicalPath = `/shop/${id}`;
  if (!detail) {
    return {
      title: 'Product not found — Culture Bridge Shop',
      alternates: {
        canonical: canonicalPath,
      },
    };
  }

  const shareImage = detail.media?.[0]?.source.url;
  const description = detail.summary ?? detail.description.slice(0, 160);

  return {
    title: `${detail.title} — Culture Bridge Shop`,
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

export default async function ShopProductPage({ params }: ShopProductPageProps) {
  const { id } = await params;
  const detail = await getProductDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10">
      <div className="container-width space-y-10">
        <ShopProductDetail detail={detail} />
        <ShopProductJsonLd detail={detail} />
      </div>
    </div>
  );
}
