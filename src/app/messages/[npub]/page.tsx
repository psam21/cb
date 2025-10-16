/**
 * Messages by Npub Route
 * Routing Layer - Npub to Hex Conversion
 * 
 * Handles /messages/npub1... URLs and converts to canonical format.
 * Follows SOA principles: Single responsibility (npub decoding only).
 */

import { redirect } from 'next/navigation';
import { decodeNpub } from '@/utils/keyManagement';

interface MessagesByNpubProps {
  params: Promise<{
    npub: string;
  }>;
  searchParams?: Promise<{
    context?: string;
    contextTitle?: string;
    contextImage?: string;
  }>;
}

/**
 * Dynamic route that accepts npub and redirects to canonical messages URL
 * 
 * Supported formats:
 * - /messages/npub1abc... → /messages?recipient=hexPubkey
 * - /messages/npub1abc...?context=product:123 → /messages?recipient=hexPubkey&context=product:123
 * 
 * @param params - Route parameters containing npub
 * @param searchParams - Optional query parameters (context, contextTitle, contextImage)
 */
export default async function MessagesByNpub({ params, searchParams }: MessagesByNpubProps) {
  try {
    // Await params (Next.js 15 requirement)
    const { npub } = await params;
    const search = searchParams ? await searchParams : undefined;
    
    // Decode npub to hex pubkey
    const pubkey = decodeNpub(npub);
    
    // Build query parameters
    const queryParams = new URLSearchParams({ recipient: pubkey });
    
    // Preserve context parameters if present
    if (search?.context) {
      queryParams.set('context', search.context);
    }
    if (search?.contextTitle) {
      queryParams.set('contextTitle', search.contextTitle);
    }
    if (search?.contextImage) {
      queryParams.set('contextImage', search.contextImage);
    }
    
    // Redirect to canonical messages URL
    redirect(`/messages?${queryParams.toString()}`);
  } catch (error) {
    // Invalid npub format - redirect to messages home
    const { npub } = await params;
    console.error('Invalid npub in URL:', npub, error);
    redirect('/messages');
  }
}
