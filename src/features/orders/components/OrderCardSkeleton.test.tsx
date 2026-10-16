import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderCardSkeleton } from './OrderCardSkeleton';

describe('OrderCardSkeleton', () => {
  it('renders a loading placeholder with accessible label', () => {
    render(<OrderCardSkeleton />);
    expect(screen.getByLabelText('Loading order')).toBeInTheDocument();
  });

  it('renders multiple skeletons (img + lines + buttons)', () => {
    const { container } = render(<OrderCardSkeleton />);
    // At least 4 skeleton elements
    const skeletons = container.querySelectorAll('[data-slot="skeleton"], [class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});
