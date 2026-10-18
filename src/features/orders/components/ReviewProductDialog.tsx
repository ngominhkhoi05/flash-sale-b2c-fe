'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { reviewSchema, type ReviewInput } from '../schemas/review';
import { useSubmitReview } from '../hooks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MaterialSymbol } from '@/components/ui/material-symbol';
import { cn } from '@/lib/utils';

export interface ReviewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderCode: string;
  productName?: string;
}

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export function ReviewProductDialog({
  open,
  onOpenChange,
  orderId,
  orderCode,
  productName,
}: ReviewProductDialogProps) {
  const t = useTranslations('review');
  const { control, watch, handleSubmit, setValue, formState, reset } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '', mediaUrls: [], anonymous: false },
  });
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() pattern hợp lệ
  const rating = watch('rating');
  const comment = watch('comment');
  const [mediaInputs, setMediaInputs] = useState<string[]>([]);

  const submit = useSubmitReview({
    onSuccess: () => {
      toast.success(t('submitSuccess'));
      reset();
      setMediaInputs([]);
      onOpenChange(false);
    },
    onError: () => {
      toast.error(t('submitError'));
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset({ rating: 0, comment: '', mediaUrls: [], anonymous: false });
      setMediaInputs([]);
    }
  }, [open, reset]);

  const onSubmit = (data: ReviewInput) => {
    submit.mutate({ orderId, body: { ...data, mediaUrls: mediaInputs } });
  };

  const addMedia = () => {
    if (mediaInputs.length >= 5) return;
    setMediaInputs((prev) => [...prev, '']);
  };

  const updateMedia = (idx: number, value: string) => {
    setMediaInputs((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  const removeMedia = (idx: number) => {
    setMediaInputs((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('orderLabel', { code: orderCode })}
            {productName ? ` — ${productName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-space-md" noValidate>
          {/* Rating */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface">{t('ratingLabel')}</label>
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <div className="flex items-center gap-1" role="radiogroup" aria-label={t('ratingLabel')}>
                  {STAR_VALUES.map((value) => {
                    const active = value <= (field.value ?? 0);
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={field.value === value}
                        aria-label={`${value}/5 sao`}
                        data-testid={`star-${value}`}
                        onClick={() => setValue('rating', value, { shouldValidate: true })}
                        className="p-1 rounded hover:bg-surface-container-low transition-colors"
                      >
                        <MaterialSymbol
                          name="star"
                          size="[32px]"
                          className={cn(
                            'transition-colors',
                            active ? 'text-warning' : 'text-outline'
                          )}
                          fill={active}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {rating === 5 && (
              <p className="font-body-sm text-body-sm text-tertiary">{t('ratingExcellent')}</p>
            )}
            {formState.errors.rating && (
              <p className="font-body-sm text-body-sm text-error">{formState.errors.rating.message}</p>
            )}
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-2">
            <label htmlFor="review-comment" className="font-label-md text-label-md text-on-surface">
              {t('commentLabel')}
            </label>
            <p className="font-body-sm text-body-sm text-tertiary">{t('commentHint')}</p>
            <Controller
              control={control}
              name="comment"
              render={({ field }) => (
                <textarea
                  {...field}
                  id="review-comment"
                  rows={4}
                  maxLength={500}
                  placeholder={t('commentPlaceholder')}
                  className="w-full rounded-lg bg-surface-container-low border border-line px-3 py-2 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              )}
            />
            <p className="font-body-sm text-body-sm text-on-surface-variant text-right">
              {t('commentCounter', { count: comment?.length ?? 0 })}
            </p>
            {formState.errors.comment && (
              <p className="font-body-sm text-body-sm text-error">{formState.errors.comment.message}</p>
            )}
          </div>

          {/* Media */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface">{t('mediaLabel')}</label>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t('mediaHint')}</p>
            {mediaInputs.length === 0 ? (
              <button
                type="button"
                onClick={addMedia}
                className="w-full rounded-lg border-2 border-dashed border-line py-6 flex items-center justify-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
              >
                <MaterialSymbol name="add" size="[24px]" />
                <span className="font-label-md text-label-md">{t('mediaAddButton')}</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaInputs.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg border border-line bg-surface-container-low overflow-hidden"
                  >
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateMedia(idx, e.target.value)}
                      placeholder="https://..."
                      className="w-full h-full px-2 py-1 text-xs bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink/80 text-card flex items-center justify-center"
                      aria-label="Remove"
                    >
                      <MaterialSymbol name="close" size="[14px]" />
                    </button>
                  </div>
                ))}
                {mediaInputs.length < 5 && (
                  <button
                    type="button"
                    onClick={addMedia}
                    className="aspect-square rounded-lg border-2 border-dashed border-line flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary"
                    aria-label="Add"
                  >
                    <MaterialSymbol name="add" size="[24px]" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Anonymous */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Controller
              control={control}
              name="anonymous"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-5 h-5 rounded border-line text-primary focus:ring-2 focus:ring-primary"
                />
              )}
            />
            <span className="font-body-md text-body-md text-on-surface">{t('anonymous')}</span>
          </label>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={submit.isPending}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={submit.isPending || rating === 0}>
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
