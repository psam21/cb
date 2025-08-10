import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// QW15: Simple smoke test ensuring the homepage renders key heading.

describe('HomePage', () => {
  it('renders hero heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /Preserve Heritage/i })).toBeInTheDocument();
  });
});
