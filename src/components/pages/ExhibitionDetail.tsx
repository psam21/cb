'use client';
import React from 'react';
import Image from 'next/image';
// Removed blur import - using placeholder
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Tag } from 'lucide-react';
import Link from 'next/link';
import type { Exhibition } from '@/types/content';
// Interactions removed; stubbed UI only

interface Props { exhibition: Exhibition; interactions?: unknown }

export default function ExhibitionDetail({ exhibition }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="section-padding bg-white border-b border-gray-200">
        <div className="container-width max-w-5xl">
          <Link
            href="/exhibitions"
            className="inline-flex items-center text-sm text-primary-700 hover:text-accent-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Exhibitions
          </Link>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <Image
                src={exhibition.image}
                alt={`Hero image for ${exhibition.title}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-3">
                {exhibition.title}
              </h1>
              <p className="text-lg text-gray-700 mb-4">{exhibition.subtitle}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="font-medium text-accent-600">{exhibition.category}</span>
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {exhibition.region}
                </span>
                <span>{exhibition.contributors} contributors</span>
                {exhibition.difficulty && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-md text-xs font-medium">
                    {exhibition.difficulty}
                  </span>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">{exhibition.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {exhibition.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section-padding bg-gray-50">
        <div className="container-width max-w-5xl grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
          <h2 className="text-2xl font-serif font-bold text-primary-800 mb-6">Artifacts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exhibition.artifacts.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="card p-4 flex flex-col"
              >
                <div className="mb-3 font-serif font-semibold text-primary-800">{a.title}</div>
                <div className="text-xs uppercase tracking-wide text-accent-600 font-medium mb-2">
                  {a.type}
                </div>
                <p className="text-sm text-gray-700 mb-3 line-clamp-4">{a.description}</p>
                {a.attribution && (
                  <div className="text-xs text-gray-500 mb-2">Attribution: {a.attribution}</div>
                )}
                <div className="flex flex-wrap gap-1 mt-auto">
                  {a.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          </div>
          <aside className="lg:col-span-4 space-y-8">
            <div className="p-4 bg-white border rounded">
              <h3 className="font-semibold mb-2">Community Interactions</h3>
              <p className="text-sm text-gray-600">Interactive ratings and comments are disabled in this build.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
