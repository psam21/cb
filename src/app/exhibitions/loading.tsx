import React from 'react';
import { Skeleton, SkeletonText } from '@/components/primitives/Skeleton';

export default function ExhibitionsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 section-padding">
      <div className="container-width">
        <div className="mb-10">
          <Skeleton className="h-10 w-80 mb-4" />
          <SkeletonText lines={2} className="w-full max-w-2xl" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-0 overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-6 space-y-4">
                <Skeleton className="h-5 w-3/4" />
                <SkeletonText lines={3} />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
