import React from 'react';
import { Skeleton, SkeletonText } from '@/components/primitives/Skeleton';

export default function ExhibitionDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="section-padding bg-white border-b border-gray-200">
        <div className="container-width max-w-5xl">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <Skeleton className="aspect-video w-full" />
            <div>
              <Skeleton className="h-10 w-3/4 mb-4" />
              <SkeletonText lines={3} className="mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
              <SkeletonText lines={4} />
            </div>
          </div>
        </div>
      </section>
      <section className="section-padding bg-gray-50">
        <div className="container-width max-w-5xl">
          <Skeleton className="h-8 w-56 mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-20" />
                <SkeletonText lines={4} />
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
