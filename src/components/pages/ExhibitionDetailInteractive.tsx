"use client";
import React from 'react';
import type { Exhibition } from '@/types/content';
import ExhibitionDetail from './ExhibitionDetail';

interface Props { exhibition: Exhibition; }

export default function ExhibitionDetailInteractive({ exhibition }: Props) {
  return <ExhibitionDetail exhibition={exhibition} />;
}
