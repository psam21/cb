import type { Metadata } from 'next';
import { CartPage } from '@/components/shop/CartPage';

export const metadata: Metadata = {
  title: 'Shopping Cart — Culture Bridge',
  description: 'Review your cart and proceed to checkout for cultural and heritage products.',
  alternates: {
    canonical: '/cart',
  },
};

export default function Cart() {
  return <CartPage />;
}
