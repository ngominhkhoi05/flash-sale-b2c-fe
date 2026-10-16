import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import viMessages from '@/../messages/vi.json';
import { ReviewProductDialog } from './ReviewProductDialog';
import { useSubmitReview } from '../hooks';
import type { UseMutationResult } from '@tanstack/react-query';

vi.mock('../hooks', () => ({
  useSubmitReview: vi.fn(),
}));

const mockMutate = vi.fn();

type SubmitResult = UseMutationResult<
  { success: boolean; reviewId: number; message?: string },
  Error,
  { orderId: number; body: { rating: number; comment: string; mediaUrls: string[]; anonymous: boolean } }
>;

function renderDialog(props: Partial<React.ComponentProps<typeof ReviewProductDialog>> = {}) {
  vi.mocked(useSubmitReview).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
  } as unknown as SubmitResult);

  const onOpenChange = vi.fn();
  const result = render(
    <NextIntlClientProvider locale="vi" messages={viMessages} timeZone="UTC">
      <ReviewProductDialog
        open={true}
        onOpenChange={onOpenChange}
        orderId={1}
        orderCode="FS-001"
        {...props}
      />
    </NextIntlClientProvider>
  );

  return { ...result, onOpenChange };
}

describe('ReviewProductDialog', () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it('renders title, order code, and rating label', () => {
    renderDialog();
    expect(screen.getByText(viMessages.review.title)).toBeInTheDocument();
    expect(screen.getByText(viMessages.review.orderLabel.replace('{code}', 'FS-001'))).toBeInTheDocument();
    expect(screen.getByText(viMessages.review.ratingLabel)).toBeInTheDocument();
  });

  it('shows 5 star buttons for rating', () => {
    renderDialog();
    const stars = screen.getAllByRole('radio', { name: /^[1-5](\.\d)?\/5 sao$/ });
    // OR fallback: query by aria-label
    expect(stars.length).toBeGreaterThanOrEqual(5);
  });

  it('disables submit button when rating is 0', () => {
    renderDialog();
    const submit = screen.getByRole('button', { name: viMessages.review.submit });
    expect(submit).toBeDisabled();
  });

  it('calls mutate with rating + body when submitted with valid data', async () => {
    const user = userEvent.setup();
    renderDialog();

    // Click 5th star
    const stars = screen.getAllByRole('radio');
    await user.click(stars[4]);

    // Type comment
    const comment = screen.getByPlaceholderText(viMessages.review.commentPlaceholder);
    await user.type(comment, 'Sản phẩm tốt');

    // Submit
    const submit = screen.getByRole('button', { name: viMessages.review.submit });
    await user.click(submit);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 1,
        body: expect.objectContaining({
          rating: 5,
          comment: 'Sản phẩm tốt',
        }),
      })
    );
  });

  it('shows character counter for comment', async () => {
    const user = userEvent.setup();
    renderDialog();

    const comment = screen.getByPlaceholderText(viMessages.review.commentPlaceholder);
    await user.type(comment, 'Hello');

    expect(screen.getByText(viMessages.review.commentCounter.replace('{count}', '5'))).toBeInTheDocument();
  });

  it('toggles anonymous checkbox', async () => {
    const user = userEvent.setup();
    renderDialog();

    const stars = screen.getAllByRole('radio');
    await user.click(stars[4]);

    const anonymousCheckbox = screen.getByRole('checkbox', { name: viMessages.review.anonymous });
    expect(anonymousCheckbox).not.toBeChecked();
    await user.click(anonymousCheckbox);
    expect(anonymousCheckbox).toBeChecked();

    const submit = screen.getByRole('button', { name: viMessages.review.submit });
    await user.click(submit);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ anonymous: true }),
      })
    );
  });

  it('renders cancel button that calls onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    const cancel = screen.getByRole('button', { name: viMessages.review.cancel });
    await user.click(cancel);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows pending state and disables submit while submitting', () => {
    vi.mocked(useSubmitReview).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isSuccess: false,
      isError: false,
    } as unknown as SubmitResult);

    render(
      <NextIntlClientProvider locale="vi" messages={viMessages} timeZone="UTC">
        <ReviewProductDialog open={true} onOpenChange={vi.fn()} orderId={1} orderCode="FS-001" />
      </NextIntlClientProvider>
    );

    const submit = screen.getByRole('button', { name: viMessages.review.submit });
    expect(submit).toBeDisabled();
  });
});
