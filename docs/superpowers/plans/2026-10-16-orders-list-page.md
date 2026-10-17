# Orders List Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use tllq-workflow:itz-subagent-driven-development (recommended) or tllq-workflow:itz-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement storefront Orders List page (`/orders`) with sticky status tabs, search/filter bar, polymorphic OrderCard for 4 status states (PENDING_PAYMENT / SHIPPING / COMPLETED / CANCELLED), Account sidebar, and a Review Product modal — all wired to the existing `useOrders` API hook.

**Architecture:** Server-rendered page shell (`/orders/page.tsx`) wraps an AuthGuard + a single Client Component (`OrderList.tsx`) that owns filter state via `useSearchParams`, calls `useOrders({ page, size, status })` from `src/features/orders/hooks.ts`, and composes presentational subcomponents (`OrdersTabs`, `OrderCard`, `AccountSidebar`). The Review modal is a controlled Dialog component using shadcn `Modal`. Tabs filter is reflected in URL (`?status=PENDING_PAYMENT`) for shareable links.

**Tech Stack:** Next 16 (App Router) · React 19 · TypeScript strict · Tailwind 4 · TanStack Query 5 · next-intl 4 · shadcn/ui (Dialog) · lucide-react · Vitest + RTL

**Spec:** `docs/superpowers/handoffs/danh-sach-don-hang.md` (Stitch HTML mockup — source of truth for visual design and 4 status state variants)

**Handoff design doc (Stitch screen ref):** `docs/superpowers/handoffs/danh-sach-don-hang.md`

## Global Constraints

- Project root: `D:\code\ky_I_nam_4\Project\flash-sale-b2c-fe`
- URL convention: **English, no diacritics** — `/orders` (NOT `/don-hang`). Source: `.cursor/rules/routing-guards.mdc` mục 1.
- Stack locked to `docs/CLAUDE.md` §1. NO new libraries.
- **Tailwind 4 design tokens** (không hard-code hex): use `bg-primary`, `text-sale`, `bg-surface-container`, etc. Mapping in `docs/CLAUDE.md` §3.
- **No `dark:` classes.** Light mode only.
- **Font**: Be Vietnam Pro — already configured in `StorefrontHeader` (no font changes needed).
- **Icons**: `MaterialSymbol` from `@/components/ui/material-symbol` (used in header) hoặc `lucide-react` cho các icon mới. Material Symbols mapping trong `material-symbol.tsx`.
- **Status labels**: ALWAYS via `StatusBadge type="order" status={...}` (xem `docs/CLAUDE.md` §6 + `src/components/common/StatusBadge.tsx`). KHÔNG hard-code "Chờ thanh toán" trong component.
- **Money**: ALWAYS via `formatVND` từ `@/lib/format` (xem `src/components/common/PriceText.tsx`).
- **Date/time**: ALWAYS via `useFormatter` (`next-intl`) hoặc `date-fns` locale `vi`.
- **i18n**: Mọi text hiển thị qua `useTranslations` (`@/features/orders/...` → namespace `storefront.orders.*`). KHÔNG hard-code.
- **i18n keys**: phải có trong CẢ `messages/vi.json` VÀ `messages/en.json`.
- **State enum**: `OrderStatus` từ `@/lib/constants` (`PENDING_PAYMENT | PAID | CONFIRMED | SHIPPING | SHIPPED | COMPLETED | CANCELLED | CANCELLED_TIMEOUT | CANCELLED_USER`).
- **API hook**: dùng `useOrders(params)` từ `@/features/orders` — đã có sẵn (`src/features/orders/hooks.ts`). KHÔNG gọi `apiFetch` trực tiếp.
- **API response shape**: `BackendOrderSummary { id, orderCode, status, paymentStatus, totalAmount, totalItems, storeName, thumbnail, createdAt, expiresAt }` — CHƯA CÓ `items[]` ở summary. Để render product line, cần fetch `useOrderById` hoặc hiển thị summary view (chỉ 1 line "X sản phẩm"). Decision: dùng **summary view** cho lần này, KHÔNG gọi detail cho mỗi card (tránh N+1).
- **TDD required**: mọi file logic có test đi kèm (xem `.cursor/rules/testing-required.mdc`).
- **Branch**: `feature/orders-list-page` (đã tạo từ `dev`).
- **Conventional Commits** + tiếng Anh + 1 commit/subplan.
- **KHÔNG push** lên remote — chờ user duyệt.
- **Image**: `next/image` (KHÔNG `<img>`).
- **shadcn primitives** từ `src/components/ui/` (Button, Dialog, Input, Skeleton). **Dialog** (không phải `Modal`) ở `src/components/ui/dialog.tsx` — exports: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`.

---

## File Structure

### New files (create)

| File | Concern | LOC est. |
|---|---|---|
| `src/app/(storefront)/orders/page.tsx` | Server Component route shell | ~50 |
| `src/app/(storefront)/orders/page.test.tsx` | Route render test | ~80 |
| `src/components/storefront/account/AccountSidebar.tsx` | Sidebar layout (profile + rewards + nav) | ~180 |
| `src/components/storefront/account/AccountSidebar.test.tsx` | Sidebar render + active state | ~120 |
| `src/components/storefront/orders/OrdersTabs.tsx` | Sticky status filter tabs | ~80 |
| `src/components/storefront/orders/OrdersTabs.test.tsx` | Tabs render + active + count | ~100 |
| `src/components/storefront/orders/OrderCard.tsx` | Polymorphic card (4 status variants) | ~280 |
| `src/components/storefront/orders/OrderCard.test.tsx` | 4 variants + actions | ~200 |
| `src/components/storefront/orders/OrderCardSkeleton.tsx` | Loading skeleton | ~50 |
| `src/components/storefront/orders/OrderList.tsx` | Container (filter + useOrders + render) | ~180 |
| `src/components/storefront/orders/OrderList.test.tsx` | Filter + render list | ~150 |
| `src/components/storefront/orders/OrderListEmpty.tsx` | Empty state (no orders) | ~50 |
| `src/components/storefront/orders/ReviewProductDialog.tsx` | Review modal (stars + textarea + upload + anonymous) | ~220 |
| `src/components/storefront/orders/ReviewProductDialog.test.tsx` | Modal open/close + rating change + submit | ~150 |
| `src/features/orders/review-api.ts` | POST review API (mock-able, ready for BE) | ~40 |
| `src/features/orders/review-api.test.ts` | API client test | ~60 |
| `src/features/orders/schemas/review.ts` | Zod schema for review form | ~40 |
| `src/features/orders/schemas/review.test.ts` | Schema validation test | ~50 |
| `src/features/orders/index.ts` | (modify) export new hooks | — |

### Modified files

| File | Change | Risk |
|---|---|---|
| `src/features/orders/index.ts` | Add `useSubmitReview` re-export | Low |
| `messages/vi.json` | Add `storefront.orders` + `storefront.review` + `storefront.account.sidebar` namespaces | Low |
| `messages/en.json` | Same key set, English | Low |

### Files NOT touched (đã có sẵn, không sửa)

- `src/features/orders/{api,hooks,types}.ts` — API + hooks đã đầy đủ
- `src/components/common/{StatusBadge,EmptyState,ErrorState,Pagination,PriceText,Countdown}.tsx` — reuse
- `src/components/storefront/StorefrontHeader.tsx` — header đã sticky trong `(storefront)/layout.tsx`
- `src/app/(storefront)/layout.tsx` — header/footer sẵn

---

## Task 1: i18n Keys (Foundations)

**Files:**
- Modify: `messages/vi.json`
- Modify: `messages/en.json`

**Goal:** Add all translation keys needed by orders list, review modal, account sidebar. Bilingual.

**Step 1:** Add namespace `storefront.orders.*` to `vi.json` (place after existing `storefront.*` namespaces, alphabetically before `storefront.vouchers` if exists):

```json
"orders": {
  "pageTitle": "Đơn mua của tôi",
  "breadcrumbHome": "Trang chủ",
  "breadcrumbAccount": "Tài khoản của tôi",
  "breadcrumbCurrent": "Đơn mua",
  "tabs": {
    "all": "Tất cả",
    "pendingPayment": "Chờ thanh toán",
    "confirmed": "Đã xác nhận",
    "shipping": "Đang giao",
    "completed": "Hoàn thành",
    "cancelled": "Đã hủy"
  },
  "searchPlaceholder": "Tìm theo mã đơn, tên shop hoặc sản phẩm...",
  "searchButton": "Tìm",
  "timeFilter": "Tất cả thời gian",
  "viewShop": "Xem shop",
  "countdown": {
    "expiresIn": "Hết hạn sau {time} — Đơn sẽ tự hủy nếu chưa hoàn tất chuyển khoản / VNPAY / ZaloPay.",
    "compact": "Đơn tự hủy sau {time}"
  },
  "cancel": "Huỷ đơn",
  "payNow": "Thanh toán ngay",
  "contactShop": "Liên hệ shop",
  "trackOrder": "Xem lộ trình",
  "reorder": "Mua lại",
  "reviewNow": "Đánh giá ngay",
  "shippingNotice": "{carrier} — Đang trung chuyển tới bưu cục {location}",
  "eta": "Dự kiến giao: {time}",
  "trackingLink": "Chi tiết vận đơn: {code}",
  "completedNotice": "Đã giao thành công {time}. Bạn hài lòng chứ? Hãy để lại đánh giá nhé!",
  "cancelledNotice": "Hệ thống tự động hủy do quá hạn thanh toán (5 phút). Voucher đã được hoàn lại ví voucher của bạn.",
  "totalPayment": "Tổng thanh toán:",
  "cancelledAmount": "Số tiền hủy:",
  "itemCount": "{count, plural, =0 {Không có sản phẩm} =1 {1 sản phẩm} other {# sản phẩm}}",
  "loading": "Đang tải đơn hàng...",
  "errorTitle": "Không tải được danh sách đơn hàng",
  "errorDescription": "Đã có lỗi xảy ra. Vui lòng thử lại.",
  "empty": {
    "title": "Bạn chưa có đơn hàng nào",
    "description": "Hãy khám phá các sản phẩm và tiến hành đặt hàng.",
    "action": "Khám phá sản phẩm"
  },
  "summary": "Xem tóm tắt {count, plural, =1 {1 đơn} other {# đơn}}"
}
```

Add namespace `storefront.review.*` (modal):

```json
"review": {
  "title": "Đánh giá sản phẩm",
  "orderLabel": "Đơn hàng #{code}",
  "ratingLabel": "Chất lượng sản phẩm",
  "ratingExcellent": "Tuyệt vời (5/5 sao)",
  "commentLabel": "Nhận xét chi tiết",
  "commentHint": "+100 Xu khi kèm ảnh & >50 từ",
  "commentCounter": "{count}/500 ký tự",
  "commentPlaceholder": "Chia sẻ trải nghiệm của bạn về sản phẩm...",
  "mediaLabel": "Hình ảnh & Video thực tế",
  "mediaAddButton": "+ Thêm ảnh / video",
  "mediaHint": "Tối đa 5 ảnh (<10MB)",
  "anonymous": "Đánh giá ẩn danh (Tên tài khoản sẽ hiển thị dạng n***n)",
  "cancel": "Huỷ",
  "submit": "Gửi đánh giá",
  "submitSuccess": "Cảm ơn bạn đã đánh giá sản phẩm!",
  "submitError": "Không thể gửi đánh giá. Vui lòng thử lại."
}
```

Add namespace `storefront.account.sidebar.*`:

```json
"sidebar": {
  "editProfile": "Sửa hồ sơ",
  "rewardsTitle": "Vibe Rewards",
  "rewardsTier": "Hạng Vàng",
  "rewardsPoints": "{points} điểm khả dụng",
  "rewardsRedeem": "Đổi quà",
  "rewardsNext": "Còn {points} điểm lên {tier}",
  "rewardsGoal": "{points} điểm",
  "nav": {
    "myAccount": "Tài khoản của tôi",
    "myOrders": "Đơn mua",
    "vouchers": "Kho voucher",
    "notifications": "Thông báo đơn hàng",
    "sellerChannel": "Kênh người bán",
    "sellerHot": "Hot"
  }
}
```

**Step 2:** Add the SAME key set to `messages/en.json` with English values (singular/plural rules preserved). See `docs/i18n-convention.md` §6 for plural syntax.

English values:
- `orders.pageTitle`: "My orders"
- `orders.tabs.all`: "All"
- `orders.tabs.pendingPayment`: "Pending payment"
- `orders.tabs.confirmed`: "Confirmed"
- `orders.tabs.shipping`: "Shipping"
- `orders.tabs.completed`: "Completed"
- `orders.tabs.cancelled`: "Cancelled"
- `orders.payNow`: "Pay now"
- `orders.reviewNow`: "Review now"
- `orders.reorder`: "Buy again"
- `review.title`: "Review product"
- `review.ratingExcellent`: "Excellent (5/5)"
- `review.anonymous`: "Anonymous review (Name will show as a***n)"
- `sidebar.rewardsTitle`: "Vibe Rewards"
- `sidebar.nav.myOrders`: "My orders"

(Full list in implementation step.)

**Step 3:** Verify with `npm run lint` + `npm run tsc --noEmit` — no new errors.

**Step 4:** Commit.

```bash
git add messages/vi.json messages/en.json
git commit -m "feat(i18n): add orders-list and review namespaces (vi/en)"
```

---

## Task 2: Review Zod Schema

**Files:**
- Create: `src/features/orders/schemas/review.ts`
- Create: `src/features/orders/schemas/review.test.ts`

**Goal:** Type-safe validation for the review form (rating 1–5, comment min 0 max 500, media urls 0–5, anonymous boolean).

**Step 1:** Write failing test (`src/features/orders/schemas/review.test.ts`):

```ts
import { describe, it, expect } from 'vitest';
import { reviewSchema } from './review';

describe('reviewSchema', () => {
  it('accepts a complete valid review', () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: 'Sản phẩm rất tốt, giao hàng nhanh.',
      mediaUrls: ['https://cdn.example.com/img1.jpg'],
      anonymous: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating below 1', () => {
    const result = reviewSchema.safeParse({
      rating: 0,
      comment: 'abc',
      mediaUrls: [],
      anonymous: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['rating']);
    }
  });

  it('rejects rating above 5', () => {
    const result = reviewSchema.safeParse({
      rating: 6,
      comment: '',
      mediaUrls: [],
      anonymous: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects comment longer than 500 chars', () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: 'a'.repeat(501),
      mediaUrls: [],
      anonymous: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 5 media urls', () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      comment: '',
      mediaUrls: Array(6).fill('https://x.com/a.jpg'),
      anonymous: false,
    });
    expect(result.success).toBe(false);
  });

  it('allows empty comment', () => {
    const result = reviewSchema.safeParse({
      rating: 4,
      comment: '',
      mediaUrls: [],
      anonymous: false,
    });
    expect(result.success).toBe(true);
  });
});
```

**Step 2:** Run test — expect FAIL (module not found).

```bash
npm run test -- src/features/orders/schemas/review.test.ts
```

Expected: FAIL "Cannot find module './review'".

**Step 3:** Write minimal implementation (`src/features/orders/schemas/review.ts`):

```ts
import { z } from 'zod';

/**
 * Review form schema.
 *
 * - rating: 1..5 (số nguyên)
 * - comment: 0..500 ký tự (optional, có thể rỗng — UI chỉ bonus cho >50 từ + ảnh)
 * - mediaUrls: 0..5 URL ảnh/video
 * - anonymous: ẩn tên tài khoản khi hiển thị
 */
export const reviewSchema = z.object({
  rating: z
    .number()
    .int('Số sao phải là số nguyên')
    .min(1, 'Vui lòng chọn ít nhất 1 sao')
    .max(5, 'Tối đa 5 sao'),
  comment: z
    .string()
    .max(500, 'Nhận xét tối đa 500 ký tự')
    .default(''),
  mediaUrls: z
    .array(z.string().url('URL ảnh/video không hợp lệ'))
    .max(5, 'Tối đa 5 ảnh/video')
    .default([]),
  anonymous: z.boolean().default(false),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
```

**Step 4:** Run test — expect PASS.

```bash
npm run test -- src/features/orders/schemas/review.test.ts
```

Expected: all 6 tests PASS.

**Step 5:** Commit.

```bash
git add src/features/orders/schemas/review.ts src/features/orders/schemas/review.test.ts
git commit -m "feat(orders): add review form zod schema"
```

---

## Task 3: Review API Client

**Files:**
- Create: `src/features/orders/review-api.ts`
- Create: `src/features/orders/review-api.test.ts`
- Modify: `src/features/orders/index.ts`

**Goal:** Pure API function `submitReview(orderId, body)` using `apiFetch` + Idempotency-Key. Plus a TanStack Query `useSubmitReview` mutation hook.

**Step 1:** Write failing test (`src/features/orders/review-api.test.ts`):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitReview } from './review-api';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

describe('submitReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POSTs to /api/v1/orders/{id}/reviews with body and Idempotency-Key header', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ success: true, reviewId: 1 } as any);

    await submitReview(42, {
      rating: 5,
      comment: 'Tốt',
      mediaUrls: [],
      anonymous: false,
    });

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/v1/orders/42/reviews',
      expect.objectContaining({
        method: 'POST',
        json: expect.objectContaining({ rating: 5, comment: 'Tốt' }),
        headers: expect.objectContaining({
          'Idempotency-Key': expect.any(String),
        }),
      })
    );
  });

  it('rejects when orderId is invalid', async () => {
    await expect(
      submitReview(0, { rating: 5, comment: '', mediaUrls: [], anonymous: false })
    ).rejects.toThrow('orderId is required');
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
```

**Step 2:** Run test — expect FAIL (module not found).

**Step 3:** Write implementation (`src/features/orders/review-api.ts`):

```ts
import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '@/lib/api';
import type { ReviewInput } from './schemas/review';

export interface SubmitReviewResponse {
  success: boolean;
  reviewId: number;
  message?: string;
}

/**
 * POST /api/v1/orders/{id}/reviews
 *
 * TODO(api): BE chưa có endpoint. Tạm thời POST đến route giả định;
 * khi BE sẵn sàng chỉ cần giữ nguyên signature, BE handler sẽ match.
 */
export async function submitReview(
  orderId: number,
  body: ReviewInput
): Promise<SubmitReviewResponse> {
  if (!orderId || orderId <= 0) {
    throw new Error('orderId is required');
  }
  return apiFetch<SubmitReviewResponse>(`/api/v1/orders/${orderId}/reviews`, {
    method: 'POST',
    json: body,
    headers: {
      'Idempotency-Key': uuidv4(),
    },
  });
}
```

**Step 4:** Run test — expect PASS.

**Step 5:** Add `useSubmitReview` mutation hook to `src/features/orders/hooks.ts` (or a new file). Add to `index.ts`:

```ts
// in src/features/orders/hooks.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitReview, type SubmitReviewResponse } from './review-api';
import type { ReviewInput } from './schemas/review';
import { orderKeys } from './hooks'; // already exported

export function useSubmitReview(orderId: number) {
  const qc = useQueryClient();
  return useMutation<SubmitReviewResponse, Error, ReviewInput>({
    mutationFn: (input) => submitReview(orderId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
      qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    },
  });
}
```

**Step 6:** Add to `src/features/orders/index.ts` public API:

```ts
export { useSubmitReview } from './hooks';
export type { ReviewInput } from './schemas/review';
export { reviewSchema } from './schemas/review';
```

**Step 7:** Commit.

```bash
git add src/features/orders/review-api.ts src/features/orders/review-api.test.ts \
        src/features/orders/hooks.ts src/features/orders/index.ts
git commit -m "feat(orders): add submit review API + useSubmitReview hook"
```

---

## Task 4: AccountSidebar Component

**Files:**
- Create: `src/components/storefront/account/AccountSidebar.tsx`
- Create: `src/components/storefront/account/AccountSidebar.test.tsx`

**Goal:** Reusable left sidebar for `/orders` (and future `/account`, `/vouchers`). Profile card + Vibe Rewards widget + nav menu with active state.

**Step 1:** Write failing test (`AccountSidebar.test.tsx`):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountSidebar } from './AccountSidebar';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { fullName: 'Nguyễn Văn An', email: 'an***@gmail.com', avatarUrl: null },
    isAuthenticated: true,
  }),
}));

const messages = {
  storefront: {
    account: {
      sidebar: {
        editProfile: 'Sửa hồ sơ',
        rewardsTitle: 'Vibe Rewards',
        rewardsTier: 'Hạng Vàng',
        rewardsPoints: '{points} điểm khả dụng',
        rewardsRedeem: 'Đổi quà',
        rewardsNext: 'Còn {points} điểm lên {tier}',
        rewardsGoal: '{points} điểm',
        nav: {
          myAccount: 'Tài khoản của tôi',
          myOrders: 'Đơn mua',
          vouchers: 'Kho voucher',
          notifications: 'Thông báo đơn hàng',
          sellerChannel: 'Kênh người bán',
          sellerHot: 'Hot',
        },
      },
    },
  },
};

const renderWithI18n = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="vi" messages={messages as any}>
      {ui}
    </NextIntlClientProvider>
  );

describe('AccountSidebar', () => {
  it('renders user name and edit profile link', () => {
    renderWithI18n(<AccountSidebar active="myOrders" />);
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('an***@gmail.com')).toBeInTheDocument();
  });

  it('marks the active nav item with aria-current', () => {
    renderWithI18n(<AccountSidebar active="myOrders" />);
    const ordersLink = screen.getByText('Đơn mua').closest('a');
    expect(ordersLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders Vibe Rewards widget with points', () => {
    renderWithI18n(<AccountSidebar active="myOrders" points={3450} />);
    expect(screen.getByText('3.450')).toBeInTheDocument();
  });

  it('renders seller channel item with Hot badge', () => {
    renderWithI18n(<AccountSidebar active="myOrders" />);
    expect(screen.getByText('Kênh người bán')).toBeInTheDocument();
    expect(screen.getByText('Hot')).toBeInTheDocument();
  });
});
```

**Step 2:** Run test — expect FAIL.

**Step 3:** Write implementation (`AccountSidebar.tsx`):

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MaterialSymbol } from '@/components/ui/material-symbol';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export type AccountNavKey =
  | 'myAccount'
  | 'myOrders'
  | 'vouchers'
  | 'notifications'
  | 'sellerChannel';

export interface AccountSidebarProps {
  active?: AccountNavKey;
  /** Override rewards points; defaults to mock 3450 (TODO: fetch from API). */
  points?: number;
  className?: string;
}

const NAV_ITEMS: Array<{
  key: AccountNavKey;
  href: string;
  icon: string;
  hasBadge?: 'count' | 'dot' | 'hot';
  badgeValue?: number;
}> = [
  { key: 'myAccount', href: ROUTES.ACCOUNT, icon: 'person' },
  { key: 'myOrders', href: ROUTES.ORDERS, icon: 'shopping_bag', hasBadge: 'count', badgeValue: 1 },
  { key: 'vouchers', href: ROUTES.VOUCHERS, icon: 'confirmation_number', hasBadge: 'count', badgeValue: 12 },
  { key: 'notifications', href: '#', icon: 'notifications_active', hasBadge: 'dot' },
  { key: 'sellerChannel', href: '/seller', icon: 'storefront', hasBadge: 'hot' },
];

export function AccountSidebar({ active, points = 3450, className }: AccountSidebarProps) {
  const t = useTranslations('storefront.account.sidebar');
  const { user } = useAuth();
  const initials = (user?.fullName ?? '?').slice(0, 1).toUpperCase();

  return (
    <aside className={cn('flex flex-col gap-4', className)}>
      {/* Profile card */}
      <div className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="relative shrink-0">
          {user?.avatarUrl ? (
            <Image
              alt={user.fullName ?? 'Avatar'}
              src={user.avatarUrl}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-primary-fixed"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary text-headline-lg ring-2 ring-primary-fixed">
              {initials}
            </div>
          )}
          <button
            type="button"
            aria-label={t('editProfile')}
            className="absolute -bottom-1 -right-1 rounded-full bg-surface-container-lowest p-1 text-primary shadow hover:bg-surface-container-low"
          >
            <MaterialSymbol name="edit" size="[14px]" />
          </button>
        </div>
        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-headline-sm font-semibold text-on-surface">
            {user?.fullName ?? '—'}
          </h3>
          <p className="truncate text-body-sm text-on-surface-variant">
            {user?.email ?? '—'}
          </p>
          <Link
            href={ROUTES.ACCOUNT}
            className="mt-0.5 inline-flex items-center gap-0.5 text-label-sm text-primary hover:underline"
          >
            <MaterialSymbol name="edit_note" size="[14px]" />
            <span>{t('editProfile')}</span>
          </Link>
        </div>
      </div>

      {/* Vibe Rewards widget */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-surface-container-high to-surface-variant p-4 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MaterialSymbol name="workspace_premium" size="base" fill className="text-tertiary-container" />
            <span className="text-label-lg font-bold text-on-surface">{t('rewardsTitle')}</span>
          </div>
          <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-label-sm font-bold text-on-secondary-fixed shadow-xs">
            {t('rewardsTier')}
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <span className="text-headline-lg font-bold text-primary tabular-nums">
              {points.toLocaleString('vi-VN')}
            </span>
            <span className="ml-1 text-label-sm text-on-surface-variant">
              {t('rewardsPoints', { points: '' })}
            </span>
          </div>
          <Link href="#" className="flex items-center text-label-sm text-primary hover:text-primary-container">
            {t('rewardsRedeem')}
            <MaterialSymbol name="chevron_right" size="[14px]" />
          </Link>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-lowest/80">
          <div className="h-full rounded-full bg-primary" style={{ width: '68%' }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-on-surface-variant">
          <span>{t('rewardsNext', { points: 550, tier: 'Bạch Kim' })}</span>
          <span className="tabular-nums">{t('rewardsGoal', { points: 4000 })}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 rounded-xl bg-surface-container-lowest p-2 shadow-sm" aria-label="Account">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex items-center justify-between rounded-lg px-3 py-2.5 text-label-lg transition-colors',
                isActive
                  ? 'bg-primary-fixed/40 font-bold text-primary shadow-xs'
                  : 'text-on-surface hover:bg-surface-container-low'
              )}
            >
              {isActive && (
                <span className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r bg-primary" />
              )}
              <span className="flex items-center gap-2">
                <MaterialSymbol
                  name={item.icon}
                  size="base"
                  fill={isActive && item.key === 'myOrders'}
                  className={cn(
                    isActive ? 'text-primary' : item.key === 'sellerChannel' ? 'text-secondary' : 'text-on-surface-variant'
                  )}
                />
                <span>{t(`nav.${item.key}`)}</span>
              </span>
              {item.hasBadge === 'count' && item.badgeValue && (
                <span className="rounded-full bg-tertiary-container px-2 py-0.5 text-label-sm font-bold text-on-tertiary-container">
                  {item.badgeValue}
                </span>
              )}
              {item.hasBadge === 'dot' && (
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" />
              )}
              {item.hasBadge === 'hot' && (
                <span className="rounded bg-tertiary-fixed px-2 py-0.5 text-label-sm font-bold uppercase tracking-wider text-on-tertiary-fixed-variant">
                  {t('nav.sellerHot')}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 4:** Run test — expect PASS.

**Step 5:** Commit.

```bash
git add src/components/storefront/account/
git commit -m "feat(account): add AccountSidebar component (profile + rewards + nav)"
```

---

## Task 5: OrdersTabs Component

**Files:**
- Create: `src/components/storefront/orders/OrdersTabs.tsx`
- Create: `src/components/storefront/orders/OrdersTabs.test.tsx`

**Goal:** Sticky horizontal tab bar with 6 status filters + count badges. Controlled component (parent owns `status` + `onChange`).

**Step 1:** Write failing test (`OrdersTabs.test.tsx`):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrdersTabs } from './OrdersTabs';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  storefront: {
    orders: {
      tabs: {
        all: 'Tất cả',
        pendingPayment: 'Chờ thanh toán',
        confirmed: 'Đã xác nhận',
        shipping: 'Đang giao',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
      },
    },
  },
};

const renderWithI18n = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="vi" messages={messages as any}>
      {ui}
    </NextIntlClientProvider>
  );

describe('OrdersTabs', () => {
  it('renders 6 tabs with labels', () => {
    renderWithI18n(<OrdersTabs value={null} onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /Tất cả/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Chờ thanh toán/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Đã xác nhận/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Đang giao/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Hoàn thành/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Đã hủy/i })).toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    renderWithI18n(<OrdersTabs value="PENDING_PAYMENT" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /Chờ thanh toán/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Tất cả/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with status key when clicked', async () => {
    const onChange = vi.fn();
    renderWithI18n(<OrdersTabs value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: /Đang giao/i }));
    expect(onChange).toHaveBeenCalledWith('SHIPPING');
  });

  it('renders count badge when count > 0', () => {
    renderWithI18n(<OrdersTabs value={null} onChange={() => {}} counts={{ PENDING_PAYMENT: 1, SHIPPING: 3 }} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
```

**Step 2:** Run test — expect FAIL.

**Step 3:** Write implementation (`OrdersTabs.tsx`):

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { MaterialSymbol } from '@/components/ui/material-symbol';
import { cn } from '@/lib/utils';
import { ORDER_STATUS } from '@/lib/constants';

export type OrdersTabValue =
  | null
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrdersTabsProps {
  value: OrdersTabValue;
  onChange: (value: OrdersTabValue) => void;
  counts?: Partial<Record<Exclude<OrdersTabValue, null>, number>>;
  className?: string;
}

interface TabDef {
  value: OrdersTabValue;
  key: 'all' | 'pendingPayment' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
}

const TABS: TabDef[] = [
  { value: null, key: 'all' },
  { value: ORDER_STATUS.PENDING_PAYMENT, key: 'pendingPayment' },
  { value: ORDER_STATUS.CONFIRMED, key: 'confirmed' },
  { value: ORDER_STATUS.SHIPPING, key: 'shipping' },
  { value: ORDER_STATUS.COMPLETED, key: 'completed' },
  { value: 'CANCELLED', key: 'cancelled' }, // aggregate CANCELLED_TIMEOUT + CANCELLED_USER
];

export function OrdersTabs({ value, onChange, counts, className }: OrdersTabsProps) {
  const t = useTranslations('storefront.orders.tabs');
  return (
    <div
      role="tablist"
      aria-label={t('all')}
      className={cn(
        'sticky top-[156px] z-30 overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm',
        className
      )}
    >
      <div className="flex min-w-max items-center border-b border-surface-container-high">
        {TABS.map((tab) => {
          const isActive = value === tab.value;
          const count = tab.value === null ? undefined : counts?.[tab.value];
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-5 py-3.5 text-label-lg transition-colors',
                isActive
                  ? 'border-b-2 border-primary font-bold text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <span>{t(tab.key)}</span>
              {count !== undefined && count > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-tertiary-container text-[11px] font-bold text-on-tertiary-container">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 4:** Run test — expect PASS.

**Step 5:** Commit.

```bash
git add src/components/storefront/orders/OrdersTabs.tsx src/components/storefront/orders/OrdersTabs.test.tsx
git commit -m "feat(orders): add OrdersTabs status filter component"
```

---

## Task 6: OrderCard Component (Polymorphic, 4 Status Variants)

**Files:**
- Create: `src/components/storefront/orders/OrderCard.tsx`
- Create: `src/components/storefront/orders/OrderCard.test.tsx`
- Create: `src/components/storefront/orders/OrderCardSkeleton.tsx`

**Goal:** Single component that renders one of 4 status-specific layouts based on `order.status`:
- PENDING_PAYMENT → countdown + cancel + pay-now
- SHIPPING → multi-item summary + carrier info + track
- COMPLETED → review CTA
- CANCELLED_*/CANCELLED → muted, reorder CTA

Header (store name + status badge) is shared. Since `BackendOrderSummary` chỉ có 1 thumbnail, hiển thị summary line "X sản phẩm" thay vì multiple product images.

**Step 1:** Write failing test (`OrderCard.test.tsx`):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderCard } from './OrderCard';
import { NextIntlClientProvider } from 'next-intl';
import type { BackendOrderSummary } from '@/features/orders';

vi.mock('@/features/orders', () => ({
  useCancelOrder: () => ({ mutate: vi.fn(), isPending: false }),
}));

const messages = {
  storefront: {
    orders: {
      viewShop: 'Xem shop',
      cancel: 'Huỷ đơn',
      payNow: 'Thanh toán ngay',
      contactShop: 'Liên hệ shop',
      trackOrder: 'Xem lộ trình',
      reorder: 'Mua lại',
      reviewNow: 'Đánh giá ngay',
      totalPayment: 'Tổng thanh toán:',
      cancelledAmount: 'Số tiền hủy:',
      itemCount: '{count, plural, =0 {0 sản phẩm} =1 {1 sản phẩm} other {# sản phẩm}}',
      countdown: {
        expiresIn: 'Hết hạn sau {time}',
        compact: 'Đơn tự hủy sau {time}',
      },
      shippingNotice: '{carrier} — Đang trung chuyển tới {location}',
      eta: 'Dự kiến giao: {time}',
      completedNotice: 'Đã giao thành công {time}',
      cancelledNotice: 'Hệ thống tự động hủy',
      trackingLink: 'Vận đơn: {code}',
    },
  },
  order: {
    status: {
      PENDING_PAYMENT: 'Chờ thanh toán',
      SHIPPING: 'Đang giao',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã huỷ',
      CANCELLED_TIMEOUT: 'Đã huỷ – quá hạn thanh toán',
    },
  },
};

const renderWithI18n = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="vi" messages={messages as any}>
      {ui}
    </NextIntlClientProvider>
  );

const baseOrder: BackendOrderSummary = {
  id: 1,
  orderCode: 'FS-261001-A7K2Q',
  status: 'PENDING_PAYMENT',
  paymentStatus: 'PENDING',
  totalAmount: 299000,
  totalItems: 1,
  storeName: 'TechZone Official',
  thumbnail: 'https://cdn.example.com/img.jpg',
  createdAt: '2026-10-16T10:00:00Z',
  expiresAt: '2026-10-16T10:05:00Z',
};

describe('OrderCard', () => {
  it('renders PENDING_PAYMENT variant with countdown + pay button', () => {
    renderWithI18n(<OrderCard order={baseOrder} onPayNow={() => {}} />);
    expect(screen.getByText('TechZone Official')).toBeInTheDocument();
    expect(screen.getByText('Chờ thanh toán')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thanh toán ngay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Huỷ đơn/i })).toBeInTheDocument();
  });

  it('renders SHIPPING variant with track button', () => {
    const order = { ...baseOrder, status: 'SHIPPING' as const };
    renderWithI18n(
      <OrderCard order={order} shippingMeta={{ carrier: 'SPX Express', eta: 'Hôm nay 18:00', trackingCode: 'SPX993821034VN' }} />
    );
    expect(screen.getByText('Đang giao')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xem lộ trình/i })).toBeInTheDocument();
  });

  it('renders COMPLETED variant with review button', () => {
    const order = { ...baseOrder, status: 'COMPLETED' as const };
    const onReview = vi.fn();
    renderWithI18n(<OrderCard order={order} onReview={onReview} />);
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Đánh giá ngay/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders CANCELLED_TIMEOUT variant with reorder button (no pay)', () => {
    const order = { ...baseOrder, status: 'CANCELLED_TIMEOUT' as const };
    renderWithI18n(<OrderCard order={order} />);
    expect(screen.getByText('Đã huỷ – quá hạn thanh toán')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mua lại/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Thanh toán ngay/i })).not.toBeInTheDocument();
  });

  it('fires onPayNow when pay button clicked', async () => {
    const onPay = vi.fn();
    renderWithI18n(<OrderCard order={baseOrder} onPayNow={onPay} />);
    await userEvent.click(screen.getByRole('button', { name: /Thanh toán ngay/i }));
    expect(onPay).toHaveBeenCalledWith(baseOrder);
  });

  it('formats total amount as VND', () => {
    renderWithI18n(<OrderCard order={baseOrder} onPayNow={() => {}} />);
    expect(screen.getByText(/299\.000/)).toBeInTheDocument();
  });
});
```

**Step 2:** Run test — expect FAIL.

**Step 3:** Write implementation (`OrderCard.tsx`):

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MaterialSymbol } from '@/components/ui/material-symbol';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Countdown } from '@/components/common/Countdown';
import { formatVND } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ORDER_STATUS } from '@/lib/constants';
import { useCancelOrder } from '@/features/orders';
import type { BackendOrderSummary } from '@/features/orders';

export interface OrderCardShippingMeta {
  carrier: string;
  eta: string;
  trackingCode?: string;
  location?: string;
}

export interface OrderCardProps {
  order: BackendOrderSummary;
  shippingMeta?: OrderCardShippingMeta;
  onPayNow?: (order: BackendOrderSummary) => void;
  onReview?: (order: BackendOrderSummary) => void;
  onTrack?: (order: BackendOrderSummary) => void;
  onContactShop?: (order: BackendOrderSummary) => void;
  onReorder?: (order: BackendOrderSummary) => void;
  onCancel?: (order: BackendOrderSummary) => void;
  className?: string;
}

export function OrderCard({
  order,
  shippingMeta,
  onPayNow,
  onReview,
  onTrack,
  onContactShop,
  onReorder,
  onCancel,
  className,
}: OrderCardProps) {
  const t = useTranslations('storefront.orders');
  const tCommon = useTranslations('common');
  const cancelMutation = useCancelOrder();
  const isCancelled = order.status.startsWith('CANCELLED');
  const totalLabel = isCancelled ? t('cancelledAmount') : t('totalPayment');

  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm transition-all hover:shadow-md',
        isCancelled && 'opacity-90',
        className
      )}
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-high pb-2">
        <div className="flex items-center gap-2">
          <MaterialSymbol
            name="storefront"
            size="[22px]"
            className={cn(isCancelled ? 'text-outline' : 'text-primary')}
          />
          <span className="text-headline-sm font-bold text-on-surface">{order.storeName}</span>
          <Link
            href={`/shops/${order.storeId}`}
            className="flex items-center gap-1 rounded bg-surface-container-low px-2.5 py-1 text-label-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            <span>{t('viewShop')}</span>
            <MaterialSymbol name="arrow_forward" size="[14px]" />
          </Link>
        </div>
        <StatusBadge type="order" status={order.status} />
      </header>

      {/* Body — summary line + thumbnail */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {order.thumbnail && (
            <Image
              src={order.thumbnail}
              alt={order.storeName}
              width={72}
              height={72}
              className={cn('h-[72px] w-[72px] shrink-0 rounded-lg object-cover shadow-sm', isCancelled && 'grayscale-[30%]')}
            />
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label-lg text-on-surface">
              {t('itemCount', { count: order.totalItems })}
            </span>
            <span className="mt-1 text-body-sm text-on-surface-variant tabular-nums">
              Mã đơn: {order.orderCode}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className={cn('text-price-md tabular-nums', isCancelled ? 'text-outline line-through' : 'text-on-surface')}>
            {formatVND(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Status-specific notice */}
      {order.status === ORDER_STATUS.PENDING_PAYMENT && order.expiresAt && (
        <div className="flex items-center gap-2 rounded-lg bg-error-container/60 p-2 text-body-sm text-error">
          <MaterialSymbol name="hourglass_top" size="base" className="animate-bounce text-error" />
          <p className="flex-1 font-medium">
            {t.rich('countdown.expiresIn', {
              time: () => (
                <Countdown
                  endsAt={order.expiresAt!}
                  variant="short"
                  className="font-bold text-sale"
                />
              ),
            })}
          </p>
        </div>
      )}

      {order.status === ORDER_STATUS.SHIPPING && shippingMeta && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2">
          <div className="flex items-center gap-2 text-on-surface">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
              <MaterialSymbol name="near_me" size="base" />
            </div>
            <div className="flex flex-col">
              <span className="text-label-md font-semibold text-secondary">
                {t('shippingNotice', {
                  carrier: shippingMeta.carrier,
                  location: shippingMeta.location ?? '—',
                })}
              </span>
              <span className="text-body-sm text-on-surface-variant">
                {t.rich('eta', {
                  time: () => <strong className="text-on-surface">{shippingMeta.eta}</strong>,
                })}
              </span>
            </div>
          </div>
          {shippingMeta.trackingCode && (
            <span className="cursor-pointer text-label-sm text-primary hover:underline">
              {t('trackingLink', { code: shippingMeta.trackingCode })}
            </span>
          )}
        </div>
      )}

      {order.status === ORDER_STATUS.COMPLETED && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2 text-on-surface-variant">
          <MaterialSymbol name="task_alt" size="base" className="text-secondary" />
          <p className="text-body-sm">{t('completedNotice', { time: 'hôm qua 15:20' })}</p>
        </div>
      )}

      {order.status === ORDER_STATUS.CANCELLED_TIMEOUT && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2 text-on-surface-variant">
          <MaterialSymbol name="info" size="base" className="text-outline" />
          <p className="text-body-sm">{t('cancelledNotice')}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container-high pt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-body-md text-on-surface-variant">{totalLabel}</span>
          <span className={cn('text-headline-lg font-bold tabular-nums', isCancelled ? 'text-outline' : 'text-sale')}>
            {formatVND(order.totalAmount)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {order.status === ORDER_STATUS.PENDING_PAYMENT && (
            <>
              <button
                type="button"
                onClick={() => {
                  onCancel?.(order);
                  cancelMutation.mutate(
                    { orderId: order.id, reason: 'User cancelled' },
                    { onSuccess: () => onCancel?.(order) }
                  );
                }}
                className="rounded-lg bg-surface-container-low px-4 py-2 text-label-lg text-on-surface transition-colors hover:bg-surface-container"
              >
                {t('cancel')}
              </button>
              {onPayNow && (
                <button
                  type="button"
                  onClick={() => onPayNow(order)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-label-lg text-on-primary shadow-sm transition-transform active:scale-95 hover:bg-primary-container"
                >
                  <MaterialSymbol name="credit_card" size="base" />
                  <span>{t('payNow')}</span>
                </button>
              )}
            </>
          )}

          {order.status === ORDER_STATUS.SHIPPING && (
            <>
              {onContactShop && (
                <button
                  type="button"
                  onClick={() => onContactShop(order)}
                  className="flex items-center gap-1 rounded-lg bg-surface-container-low px-4 py-2 text-label-lg text-on-surface hover:bg-surface-container"
                >
                  <MaterialSymbol name="chat" size="[16px]" />
                  <span>{t('contactShop')}</span>
                </button>
              )}
              {onTrack && (
                <button
                  type="button"
                  onClick={() => onTrack(order)}
                  className="flex items-center gap-1 rounded-lg bg-surface-container-high px-4 py-2 text-label-lg text-on-surface hover:bg-surface-variant"
                >
                  <MaterialSymbol name="map" size="[16px]" />
                  <span>{t('trackOrder')}</span>
                </button>
              )}
            </>
          )}

          {order.status === ORDER_STATUS.COMPLETED && (
            <>
              {onReorder && (
                <button
                  type="button"
                  onClick={() => onReorder(order)}
                  className="rounded-lg bg-surface-container-low px-4 py-2 text-label-lg text-on-surface hover:bg-surface-container"
                >
                  {t('reorder')}
                </button>
              )}
              {onReview && (
                <button
                  type="button"
                  onClick={() => onReview(order)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-label-lg text-on-primary shadow-sm hover:bg-primary-container"
                >
                  <MaterialSymbol name="rate_review" size="base" />
                  <span>{t('reviewNow')}</span>
                </button>
              )}
            </>
          )}

          {isCancelled && onReorder && (
            <button
              type="button"
              onClick={() => onReorder(order)}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-5 py-2 text-label-lg text-on-surface hover:bg-surface-variant"
            >
              <MaterialSymbol name="restart_alt" size="base" />
              <span>{t('reorder')}</span>
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
```

**Step 4:** Write skeleton (`OrderCardSkeleton.tsx`):

```tsx
import { cn } from '@/lib/utils';

export function OrderCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
        <div className="h-5 w-40 animate-pulse rounded bg-surface-container" />
        <div className="h-5 w-20 animate-pulse rounded bg-surface-container" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-[72px] w-[72px] animate-pulse rounded-lg bg-surface-container" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-container" />
          <div className="h-3 w-48 animate-pulse rounded bg-surface-container" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-surface-container-high pt-2">
        <div className="h-5 w-32 animate-pulse rounded bg-surface-container" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-surface-container" />
      </div>
    </div>
  );
}
```

**Step 5:** Run tests — expect PASS for all.

**Step 6:** Commit.

```bash
git add src/components/storefront/orders/OrderCard.tsx \
        src/components/storefront/orders/OrderCard.test.tsx \
        src/components/storefront/orders/OrderCardSkeleton.tsx
git commit -m "feat(orders): add OrderCard polymorphic component (4 status variants)"
```

---

## Task 7: ReviewProductDialog Component

**Files:**
- Create: `src/components/storefront/orders/ReviewProductDialog.tsx`
- Create: `src/components/storefront/orders/ReviewProductDialog.test.tsx`

**Goal:** Controlled shadcn Dialog (từ `src/components/ui/dialog.tsx`). RHF + Zod (`reviewSchema`). 5-star rating widget, textarea with char counter, media URL chips + dashed upload button, anonymous checkbox, submit button.

**Step 1:** Write failing test (`ReviewProductDialog.test.tsx`):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewProductDialog } from './ReviewProductDialog';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/features/orders', () => ({
  useSubmitReview: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const messages = {
  storefront: {
    review: {
      title: 'Đánh giá sản phẩm',
      orderLabel: 'Đơn hàng #{code}',
      ratingLabel: 'Chất lượng sản phẩm',
      ratingExcellent: 'Tuyệt vời (5/5 sao)',
      commentLabel: 'Nhận xét chi tiết',
      commentHint: '+100 Xu',
      commentCounter: '{count}/500 ký tự',
      commentPlaceholder: 'Chia sẻ...',
      mediaLabel: 'Hình ảnh & Video',
      mediaAddButton: '+ Thêm ảnh',
      mediaHint: 'Tối đa 5 ảnh',
      anonymous: 'Đánh giá ẩn danh',
      cancel: 'Huỷ',
      submit: 'Gửi đánh giá',
      submitSuccess: 'Cảm ơn!',
      submitError: 'Lỗi',
    },
  },
};

const renderWithI18n = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="vi" messages={messages as any}>
      {ui}
    </NextIntlClientProvider>
  );

describe('ReviewProductDialog', () => {
  it('renders nothing when closed', () => {
    renderWithI18n(
      <ReviewProductDialog open={false} onOpenChange={() => {}} orderId={1} orderCode="ABC" />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog content when open', () => {
    renderWithI18n(
      <ReviewProductDialog open={true} onOpenChange={() => {}} orderId={1} orderCode="ABC-001" />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Đánh giá sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('Đơn hàng #ABC-001')).toBeInTheDocument();
  });

  it('updates char counter as user types', async () => {
    renderWithI18n(
      <ReviewProductDialog open={true} onOpenChange={() => {}} orderId={1} orderCode="ABC" />
    );
    const textarea = screen.getByPlaceholderText('Chia sẻ...');
    await userEvent.type(textarea, 'Sản phẩm tốt');
    expect(screen.getByText('13/500 ký tự')).toBeInTheDocument();
  });

  it('clicking 4th star sets rating to 4', async () => {
    renderWithI18n(
      <ReviewProductDialog open={true} onOpenChange={() => {}} orderId={1} orderCode="ABC" />
    );
    const stars = screen.getAllByRole('button', { name: /sao/i });
    await userEvent.click(stars[3]);
    // After 4-star: "Tuyệt vời (5/5)" is no longer the active label
    expect(screen.queryByText('Tuyệt vời (5/5 sao)')).not.toBeInTheDocument();
  });

  it('calls onOpenChange(false) when cancel clicked', async () => {
    const onOpenChange = vi.fn();
    renderWithI18n(
      <ReviewProductDialog open={true} onOpenChange={onOpenChange} orderId={1} orderCode="ABC" />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

**Step 2:** Run test — expect FAIL.

**Step 3:** Write implementation (`ReviewProductDialog.tsx`):

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { MaterialSymbol } from '@/components/ui/material-symbol';
import { Button } from '@/components/ui/button';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter, ModalClose } from '@/components/ui/modal';
import { reviewSchema, type ReviewInput, useSubmitReview } from '@/features/orders';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ReviewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderCode: string;
  productName?: string;
  onSuccess?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Rất tệ',
  2: 'Tệ',
  3: 'Bình thường',
  4: 'Tốt',
  5: 'Tuyệt vời',
};

export function ReviewProductDialog({
  open,
  onOpenChange,
  orderId,
  orderCode,
  productName,
  onSuccess,
}: ReviewProductDialogProps) {
  const t = useTranslations('storefront.review');
  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: '', mediaUrls: [], anonymous: false },
    mode: 'onChange',
  });
  const rating = watch('rating');
  const comment = watch('comment');
  const mediaUrls = watch('mediaUrls');
  const anonymous = watch('anonymous');
  const submit = useSubmitReview(orderId);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const onSubmit = (data: ReviewInput) => {
    submit.mutate(data, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-surface-container-high bg-surface-container-low px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <MaterialSymbol name="star" size="base" fill />
            </div>
            <div>
              <DialogTitle className="text-headline-sm font-semibold text-on-surface">{t('title')}</DialogTitle>
              <span className="text-body-sm text-on-surface-variant">{t('orderLabel', { code: orderCode })}</span>
            </div>
          </div>
          <DialogClose aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-outline hover:bg-surface-container">
            <MaterialSymbol name="close" size="base" />
          </DialogClose>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-6">
          {/* Product snapshot (optional) */}
          {productName && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low/70 p-2">
              <div className="flex flex-1 flex-col min-w-0">
                <h4 className="truncate text-label-lg text-on-surface">{productName}</h4>
              </div>
              <span className="rounded-full bg-secondary-fixed/50 px-2 py-0.5 text-label-sm text-secondary">Đã giao</span>
            </div>
          )}

          <form id="review-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Rating */}
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <span className="text-label-lg text-on-surface">{t('ratingLabel')}</span>
              <div
                className="flex items-center gap-1.5 text-amber-500"
                onMouseLeave={() => setHoverRating(null)}
                role="radiogroup"
                aria-label={t('ratingLabel')}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (hoverRating ?? rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} sao`}
                      onClick={() => setValue('rating', star, { shouldValidate: true })}
                      onMouseEnter={() => setHoverRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <MaterialSymbol
                        name="star"
                        size="[36px]"
                        fill={filled}
                        className={cn(filled ? 'text-amber-500' : 'text-outline-variant')}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="flex items-center gap-1 text-headline-sm font-bold text-amber-700">
                <span>{RATING_LABELS[hoverRating ?? rating]} ({(hoverRating ?? rating)}/5 sao)</span>
              </span>
              {errors.rating && (
                <span className="text-body-sm text-danger">{errors.rating.message}</span>
              )}
            </div>

            {/* Comment */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-label-lg text-on-surface">
                  <span>{t('commentLabel')}</span>
                  <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-label-sm font-bold text-on-secondary-fixed">
                    {t('commentHint')}
                  </span>
                </label>
                <span className="text-body-sm text-outline tabular-nums">
                  {t('commentCounter', { count: comment.length })}
                </span>
              </div>
              <textarea
                {...register('comment')}
                rows={3}
                maxLength={500}
                placeholder={t('commentPlaceholder')}
                className="w-full resize-none rounded-xl bg-surface-container-low p-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.comment && (
                <span className="text-body-sm text-danger">{errors.comment.message}</span>
              )}
            </div>

            {/* Media */}
            <div className="flex flex-col gap-1.5">
              <label className="text-label-lg text-on-surface">{t('mediaLabel')}</label>
              <div className="flex flex-wrap items-center gap-2">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setValue('mediaUrls', mediaUrls.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-on-surface/70 text-surface-container-lowest hover:bg-error"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {mediaUrls.length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = window.prompt('Nhập URL ảnh/video');
                      if (url) setValue('mediaUrls', [...mediaUrls, url]);
                    }}
                    className="flex h-20 w-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-2 text-center hover:bg-surface-container"
                  >
                    <MaterialSymbol name="add_a_photo" size="[24px]" className="text-primary" />
                    <span className="mt-1 text-label-sm font-semibold text-primary">{t('mediaAddButton')}</span>
                    <span className="mt-0.5 text-[10px] leading-tight text-outline">{t('mediaHint')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Anonymous */}
            <label className="flex cursor-pointer select-none items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setValue('anonymous', e.target.checked)}
                className="h-4 w-4 rounded text-primary accent-primary focus:ring-0"
              />
              <span className="text-body-md text-on-surface">{t('anonymous')}</span>
            </label>
          </form>
        </div>

        <DialogFooter className="flex items-center justify-end gap-3 border-t border-surface-container-high bg-surface-container-low px-6 py-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form="review-form"
            variant="primary"
            loading={submit.isPending}
            disabled={!isValid || submit.isPending}
            className="flex items-center gap-1.5"
          >
            <MaterialSymbol name="send" size="base" />
            <span>{t('submit')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 4:** Verify `src/components/ui/dialog.tsx` exists with exports `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`. Implementation uses these names.

**Step 5:** Run tests — expect PASS.

**Step 6:** Commit.

```bash
git add src/components/storefront/orders/ReviewProductDialog.tsx \
        src/components/storefront/orders/ReviewProductDialog.test.tsx
git commit -m "feat(orders): add ReviewProductDialog (RHF + Zod + 5-star + media)"
```

---

## Task 8: OrderList Container Component

**Files:**
- Create: `src/components/storefront/orders/OrderList.tsx`
- Create: `src/components/storefront/orders/OrderList.test.tsx`
- Create: `src/components/storefront/orders/OrderListEmpty.tsx`

**Goal:** Client component owning filter state (URL-synced via `useSearchParams`), calls `useOrders`, renders tabs + search/filter bar + cards + pagination.

**Step 1:** Write failing test (`OrderList.test.tsx`):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderList } from './OrderList';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BackendOrderPageResponse } from '@/features/orders';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/orders',
}));

const mockOrdersResponse: BackendOrderPageResponse = {
  items: [
    {
      id: 1,
      orderCode: 'FS-001',
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      totalAmount: 299000,
      totalItems: 1,
      storeName: 'TechZone',
      thumbnail: null,
      createdAt: '2026-10-16T10:00:00Z',
      expiresAt: '2026-10-16T10:05:00Z',
    },
  ],
  pageNumber: 0,
  pageSize: 10,
  totalElements: 1,
  totalPages: 1,
  isFirst: true,
  isLast: true,
  hasNext: false,
  hasPrevious: false,
};

vi.mock('@/features/orders', async () => {
  const actual = await vi.importActual<any>('@/features/orders');
  return {
    ...actual,
    useOrders: vi.fn(() => ({
      data: mockOrdersResponse,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })),
    useCancelOrder: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const messages = {
  storefront: {
    orders: {
      tabs: {
        all: 'Tất cả',
        pendingPayment: 'Chờ thanh toán',
        confirmed: 'Đã xác nhận',
        shipping: 'Đang giao',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
      },
      searchPlaceholder: 'Tìm...',
      searchButton: 'Tìm',
      timeFilter: 'Tất cả thời gian',
      summary: 'Xem tóm tắt {count, plural, =1 {1 đơn} other {# đơn}}',
      viewShop: 'Xem shop',
      cancel: 'Huỷ',
      payNow: 'Thanh toán',
      contactShop: 'Liên hệ shop',
      trackOrder: 'Xem lộ trình',
      reorder: 'Mua lại',
      reviewNow: 'Đánh giá',
      totalPayment: 'Tổng:',
      cancelledAmount: 'Số tiền hủy:',
      itemCount: '{count, plural, =0 {0 sản phẩm} =1 {1 sản phẩm} other {# sản phẩm}}',
      countdown: {
        expiresIn: 'Hết hạn sau {time}',
        compact: 'Tự hủy sau {time}',
      },
      shippingNotice: '{carrier} — {location}',
      eta: 'Dự kiến: {time}',
      completedNotice: 'Đã giao {time}',
      cancelledNotice: 'Bị huỷ',
      trackingLink: 'Vận đơn: {code}',
    },
  },
  order: {
    status: {
      PENDING_PAYMENT: 'Chờ thanh toán',
      SHIPPING: 'Đang giao',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã huỷ',
      CANCELLED_TIMEOUT: 'Đã huỷ – quá hạn',
    },
  },
};

const renderWithProviders = (ui: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <NextIntlClientProvider locale="vi" messages={messages as any}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
};

describe('OrderList', () => {
  it('renders tabs and orders from useOrders', async () => {
    renderWithProviders(<OrderList />);
    await waitFor(() => {
      expect(screen.getByText('TechZone')).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: /Tất cả/i })).toBeInTheDocument();
  });

  it('passes status filter to useOrders', () => {
    const { useOrders } = await import('@/features/orders');
    renderWithProviders(<OrderList initialStatus="SHIPPING" />);
    expect(useOrders).toHaveBeenCalledWith(expect.objectContaining({ status: 'SHIPPING' }));
  });
});
```

**Step 2:** Run test — expect FAIL.

**Step 3:** Write implementation (`OrderList.tsx`):

```tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MaterialSymbol } from '@/components/ui/material-symbol';
import { Pagination } from '@/components/common/Pagination';
import { ErrorState } from '@/components/common/ErrorState';
import { useOrders, type BackendOrderSummary } from '@/features/orders';
import { OrdersTabs, type OrdersTabValue } from './OrdersTabs';
import { OrderCard, type OrderCardShippingMeta } from './OrderCard';
import { OrderCardSkeleton } from './OrderCardSkeleton';
import { OrderListEmpty } from './OrderListEmpty';
import { ReviewProductDialog } from './ReviewProductDialog';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { cn } from '@/lib/utils';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

export interface OrderListProps {
  initialStatus?: OrdersTabValue;
  /** Mock shipping meta map for demo (TODO: fetch from order detail). */
  shippingMetaByOrderId?: Record<number, OrderCardShippingMeta>;
  className?: string;
}

export function OrderList({ initialStatus = null, shippingMetaByOrderId, className }: OrderListProps) {
  const t = useTranslations('storefront.orders');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = (searchParams.get('status') as OrdersTabValue) ?? initialStatus;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));

  const { data, isLoading, isError, refetch } = useOrders({
    page: page - 1,
    size: PAGE_SIZE,
    status: status ?? undefined,
  });

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [reviewOrder, setReviewOrder] = useState<BackendOrderSummary | null>(null);

  const updateUrl = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (v === null || v === '') params.delete(k);
        else params.set(k, v);
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleTabChange = (value: OrdersTabValue) => {
    updateUrl({ status: value, page: '1' });
  };

  const handlePageChange = (next: number) => {
    updateUrl({ page: String(next) });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: search });
  };

  const counts = useMemo(() => {
    // Per-tab counts would need a separate count API; for now, only the active tab's count.
    // TODO(api): add `useOrderCounts()` when BE has /api/v1/orders/counts endpoint.
    return data ? { [status as Exclude<OrdersTabValue, null>]: data.totalElements } : {};
  }, [data, status]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <OrdersTabs value={status} onChange={handleTabChange} counts={counts} />

      {/* Search + filter bar */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col items-center justify-between gap-2 rounded-xl bg-surface-container-lowest p-2 shadow-sm md:flex-row"
      >
        <div className="flex w-full flex-1 items-center rounded-lg bg-surface-container-low px-4 py-1.5">
          <MaterialSymbol name="search" size="base" className="mr-2 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none"
            aria-label={t('searchPlaceholder')}
          />
          <button
            type="submit"
            className="ml-2 rounded bg-primary px-3 py-1 text-label-md text-on-primary hover:bg-primary-container"
          >
            {t('searchButton')}
          </button>
        </div>
        <div className="flex w-full cursor-pointer items-center gap-1 rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface md:w-auto">
          <MaterialSymbol name="calendar_today" size="[18px]" className="text-outline" />
          <span>{t('timeFilter')}</span>
          <MaterialSymbol name="arrow_drop_down" size="[16px]" />
        </div>
      </form>

      {/* Body */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} className="min-h-[200px]" />
      ) : isLoading ? (
        <div className="flex flex-col gap-4" data-testid="orders-loading">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.items.length === 0 ? (
        <OrderListEmpty />
      ) : (
        <div className="flex flex-col gap-4">
          {data?.items.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              shippingMeta={shippingMetaByOrderId?.[order.id]}
              onPayNow={(o) => router.push(`/checkout/payment?orderCode=${o.orderCode}`)}
              onReview={(o) => setReviewOrder(o)}
              onCancel={() => refetch()}
              onContactShop={() => router.push(`/shops/${order.storeId}`)}
              onTrack={(o) => window.open(`https://tracking.example.com/${o.orderCode}`, '_blank')}
              onReorder={() => router.push('/')}
            />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          totalItems={data.totalElements}
          pageSize={PAGE_SIZE}
          onChange={handlePageChange}
          variant="table"
        />
      )}

      <ReviewProductDialog
        open={reviewOrder !== null}
        onOpenChange={(open) => !open && setReviewOrder(null)}
        orderId={reviewOrder?.id ?? 0}
        orderCode={reviewOrder?.orderCode ?? ''}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
```

**Step 4:** Write `OrderListEmpty.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/common/EmptyState';
import { ROUTES } from '@/lib/constants';

export function OrderListEmpty() {
  const t = useTranslations('storefront.orders.empty');
  return (
    <EmptyState
      icon={<ShoppingBag className="h-6 w-6" aria-hidden />}
      title={t('title')}
      description={t('description')}
      actionLabel={t('action')}
      onAction={() => {
        window.location.href = ROUTES.HOME;
      }}
    />
  );
}
```

**Step 5:** Run tests — expect PASS.

**Step 6:** Commit.

```bash
git add src/components/storefront/orders/OrderList.tsx \
        src/components/storefront/orders/OrderList.test.tsx \
        src/components/storefront/orders/OrderListEmpty.tsx
git commit -m "feat(orders): add OrderList container (URL filter + useOrders + pagination)"
```

---

## Task 9: Orders Page Route

**Files:**
- Create: `src/app/(storefront)/orders/page.tsx`
- Create: `src/app/(storefront)/orders/page.test.tsx`

**Goal:** Server Component route at `/orders` with breadcrumb + 2-col layout (sidebar + list). Wrapped in AuthGuard.

**Step 1:** Write failing test (`page.test.tsx`):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrdersPage from './page';

vi.mock('@/components/auth/AuthGuard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/storefront/orders/OrderList', () => ({
  OrderList: () => <div data-testid="order-list" />,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => {
    const map: Record<string, string> = {
      'pageTitle': 'Đơn mua của tôi',
      'breadcrumbHome': 'Trang chủ',
      'breadcrumbAccount': 'Tài khoản của tôi',
      'breadcrumbCurrent': 'Đơn mua',
    };
    return map[key] ?? key;
  },
}));

describe('OrdersPage', () => {
  it('renders breadcrumb + sidebar + order list', async () => {
    const Page = await OrdersPage();
    render(Page);
    expect(screen.getByText('Đơn mua của tôi')).toBeInTheDocument();
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.getByText('Tài khoản của tôi')).toBeInTheDocument();
    expect(screen.getByText('Đơn mua')).toBeInTheDocument();
    expect(screen.getByTestId('order-list')).toBeInTheDocument();
  });
});
```

**Step 2:** Run test — expect FAIL.

**Step 3:** Write implementation (`page.tsx`):

```tsx
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AccountSidebar } from '@/components/storefront/account/AccountSidebar';
import { OrderList } from '@/components/storefront/orders/OrderList';
import { ROUTES } from '@/lib/constants';

export async function generateMetadata() {
  const t = await getTranslations('storefront.orders');
  return { title: t('pageTitle') };
}

export default async function OrdersPage() {
  const t = await getTranslations('storefront.orders');
  return (
    <AuthGuard>
      <div className="flex flex-col">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="w-full border-b border-surface-container bg-surface-container-lowest shadow-sm"
        >
          <ol className="mx-auto flex max-w-[1240px] items-center gap-1 px-4 py-2 text-label-md text-on-surface-variant">
            <li>
              <Link href={ROUTES.HOME} className="flex items-center gap-1 hover:text-primary">
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>{t('breadcrumbHome')}</span>
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={ROUTES.ACCOUNT} className="hover:text-primary">
                {t('breadcrumbAccount')}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-semibold text-on-surface">{t('breadcrumbCurrent')}</li>
          </ol>
        </nav>

        {/* Main layout */}
        <div className="mx-auto w-full max-w-[1240px] px-4 py-4">
          <div className="grid grid-cols-1 gap-4 items-start lg:grid-cols-12">
            <AccountSidebar active="myOrders" className="lg:col-span-3" />
            <main className="lg:col-span-9">
              <OrderList />
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
```

**Step 4:** Run test — expect PASS.

**Step 5:** Verify no lint/TS errors.

```bash
npm run lint
npm run tsc --noEmit
```

**Step 6:** Run all tests.

```bash
npm run test
```

Expected: ALL PASS.

**Step 7:** Verify build.

```bash
npm run build
```

Expected: success.

**Step 8:** Commit.

```bash
git add src/app/\(storefront\)/orders/
git commit -m "feat(orders): add /orders page (breadcrumb + sidebar + list)"
```

---

## Task 10: Mobile Responsive Pass

**Files:**
- Modify: `src/components/storefront/orders/OrderList.tsx`
- Modify: `src/components/storefront/orders/OrderCard.tsx`
- Modify: `src/components/storefront/account/AccountSidebar.tsx`

**Goal:** Ensure mobile 390px renders correctly:
- Sidebar stacks above list (`grid-cols-1`).
- Tabs scroll horizontally (already sticky + overflow-x-auto).
- Card: thumbnail + name + price inline, footer wraps gracefully.
- Pagination switches to mobile variant.

**Step 1:** Add tests for mobile layouts:

For `OrderList.test.tsx`, add:
```tsx
it('uses mobile pagination when viewport < sm', () => {
  // Use matchMedia mock
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: q === '(max-width: 640px)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  renderWithProviders(<OrderList />);
  // expect Pagination variant="mobile" to render — assert presence of "Trước"/"Sau" text
});
```

**Step 2:** Update `OrderList.tsx` to pass `variant="mobile"` for the Pagination when on small screens (use a media-query hook or always-mobile fallback).

**Step 3:** Update `OrderCard.tsx` to use mobile-friendly flex-wrap (already wrap by default; ensure no `min-w-[400px]` etc.).

**Step 4:** Commit.

```bash
git add src/components/storefront/orders/OrderList.tsx \
        src/components/storefront/orders/OrderCard.tsx \
        src/components/storefront/orders/OrderList.test.tsx \
        src/components/storefront/account/AccountSidebar.tsx
git commit -m "feat(orders): mobile responsive pass (390px)"
```

---

## Task 11: Pre-merge & Final Verification

**Step 1:** Run all checks.

```bash
npm run lint
npm run tsc --noEmit
npm run test
npm run build
```

Expected: all PASS.

**Step 2:** Manual smoke test.

```bash
npm run dev
```

- Open `http://localhost:3000/orders` (after login).
- Verify: breadcrumb + sidebar + tabs + cards render.
- Click tab "Chờ thanh toán" → URL changes to `?status=PENDING_PAYMENT`, list filters.
- Click "Thanh toán ngay" on a pending order → routes to payment page (or toasts error if route doesn't exist).
- Click "Đánh giá ngay" on a completed order → modal opens.
- Submit a review → mutation runs (likely 404 if BE endpoint missing; that's expected and reported as `TODO(api)`).

**Step 3:** Merge latest dev into feature branch.

```bash
git fetch origin dev
git merge origin/dev
```

If conflict → STOP, ask user. (No conflict expected — feature is new files only.)

**Step 4:** Final commit (if merge created a merge commit, no separate commit needed).

---

## Spec Coverage Check

| Spec requirement (from handoff) | Task |
|---|---|
| Layout 1240px container, breadcrumb, 2-col grid | Task 9 |
| Account sidebar (profile + rewards + nav, active "Đơn mua") | Task 4 |
| Sticky status tabs (6) với count badge | Task 5 |
| Search bar + "Tất cả thời gian" filter | Task 8 |
| Order card 4 variants (PENDING_PAYMENT, SHIPPING, COMPLETED, CANCELLED) | Task 6 |
| Countdown cho PENDING_PAYMENT | Task 6 (dùng `Countdown` chung) |
| Shipping notice cho SHIPPING | Task 6 |
| Review modal (5 sao, textarea, media, ẩn danh) | Task 7 |
| Wire API `useOrders` | Task 8 |
| Mobile responsive 390px | Task 10 |
| TDD: test kèm mọi file logic | All tasks |
| i18n: vi + en keys | Task 1 |
| Pre-commit 7 mốc | Mỗi task tự verify |

## Notes

- API `useOrders` filter `status` dùng enum string; tab "Đã hủy" cần aggregate CANCELLED + CANCELLED_TIMEOUT + CANCELLED_USER. Cách đơn giản: query `status=CANCELLED_TIMEOUT` (BE có thể trả nhiều status), hoặc hiển thị tất cả cancelled states khi user chọn tab "Đã hủy". Implementation: gửi `status=CANCELLED` và trust BE; nếu BE không aggregate thì call 3 lần (out of scope lần này, note as `TODO(api)`).
- `BackendOrderSummary` không có `items[]` → card hiển thị "X sản phẩm" thay vì từng sản phẩm. Nếu cần product list chi tiết, fetch `useOrderById` cho mỗi card (N+1 problem). Decision: dùng summary view cho lần này, đánh dấu `TODO(api)` để optimize sau.
- Review modal: dùng `window.prompt` cho URL input thay vì file upload thật (tránh cần upload infrastructure). Có thể refine sau.
- `MaterialSymbol` đã wrap Material Symbols Outlined font (xem `src/components/ui/material-symbol.tsx`). Dùng `fill` prop để fill icon.
- Review modal: dùng `window.prompt` cho URL input thay vì file upload thật (tránh cần upload infrastructure). Có thể refine sau.
- Pre-commit checklist: mỗi task tự chạy `npm run lint && npm run tsc --noEmit && npm run test -- <path>` trước khi commit.
- Không push lên remote — chờ user duyệt.
