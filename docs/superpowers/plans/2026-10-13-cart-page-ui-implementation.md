# Plan: Cart Page UI (Stitch Alignment)

> **Date**: 2026-10-13 | **Author**: Agent | **Status**: Draft

## Context

User cần làm giao diện trang Giỏ hàng (`/cart`) theo Stitch design (2026-10-13). Plan này align UI từ Stitch HTML mockup sang Next.js với các component và pattern đã có trong codebase.

## Scope

### Files cần tạo/sửa

| File | Action | Mô tả |
|------|--------|--------|
| `src/components/storefront/cart/CartHeader.tsx` | Create | Header riêng cho cart page (logo + "Giỏ hàng" + search disabled + user info + subnav) |
| `src/components/storefront/cart/CartItemCard.tsx` | Create | Component hiển thị 1 item trong giỏ |
| `src/components/storefront/cart/CartShopGroup.tsx` | Create | Wrapper group theo shop (header + items + footer voucher) |
| `src/components/storefront/cart/CartStickyFooter.tsx` | Create | Sticky footer với tổng tiền + nút Mua hàng |
| `src/components/storefront/cart/CartPageContent.tsx` | Create | Main content: cart header + shop groups |
| `src/components/storefront/cart/index.ts` | Create | Barrel export |
| `src/app/(storefront)/cart/page.tsx` | Edit | Thay stub bằng CartPageContent (bỏ AuthGuard vì dùng layout cha) |
| `messages/vi.json` | Edit | Thêm i18n keys cho cart |
| `messages/en.json` | Edit | Thêm i18n keys cho cart (en) |

### Đã có sẵn (SPA reuse)

- **Footer** — từ layout, reuse hoàn toàn
- **EmptyState component** — từ `components/common/EmptyState.tsx`
- **MaterialSymbol** — từ `components/ui/material-symbol`
- **useAuth, useCartCount** — từ hooks/features

## Design Reference

Dựa trên Stitch HTML mockup (docs/superpowers/plans/2026-10-13-cart-page-ui-stitch.md):

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header (compact)                                            │
├─────────────────────────────────────────────────────────────┤
│ Breadcrumb                                                  │
├─────────────────────────────────────────────────────────────┤
│ Cart Header Banner (progress freeship, 5 products)         │
├─────────────────────────────────────────────────────────────┤
│ Column Headers (Chọn / Đơn giá / Số lượng / Thành tiền)   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Shop Header (Mall badge, shop name, chat, view shop)    │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ CartItemCard 1                                           │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ CartItemCard 2                                           │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ CartItemCard 3 (unchecked, dimmed)                       │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Shop Voucher Row                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ (More shop groups...)                                       │
├─────────────────────────────────────────────────────────────┤
│ Sticky Footer (checkbox, voucher, total, mua hàng button)  │
└─────────────────────────────────────────────────────────────┘
```

### Key UI Patterns

1. **Cart Header Banner**: Gradient bg, số lượng items, freeship progress
2. **Shop Group**: Border rounded-xl, header với Mall badge + shop name + actions
3. **CartItemCard**: Grid 12 cols, mobile stack, quantity +/- buttons
4. **Sticky Footer**: backdrop-blur, shadow-[0_-6px_25px], tổng tiền + nút mua
5. **Empty State**: centered, icon, CTA button

## Subplan

### Subplan 1: Component Library (Cart)
- Tạo `CartItemCard.tsx` — hiển thị 1 item (image, name, variant, price, qty controls)
- Tạo `CartShopGroup.tsx` — group items theo shop với voucher row
- Tạo `CartStickyFooter.tsx` — sticky bar với checkout summary
- Tạo `CartEmptyState.tsx` — empty state component

### Subplan 2: Page Integration
- Tạo `CartPageContent.tsx` — layout chính kết hợp tất cả components
- Update `page.tsx` để use CartPageContent thay vì stub

### Subplan 3: i18n
- Thêm messages cho `storefront.cart` namespace vào `vi.json` + `en.json`

## Test Strategy

| Component | Test |
|-----------|------|
| `CartItemCard` | Render với data đủ + dimmed state |
| `CartShopGroup` | Render với nhiều items + voucher row |
| `CartStickyFooter` | Render với tổng tiền + disabled state |
| `CartEmptyState` | Render + click handler |
| `CartPageContent` | Integration test với mock data |

## Implementation Notes

1. **Tailwind Tokens**: Dùng design tokens từ `tailwind.config.ts`:
   - `primary` = `#006194` (brand blue)
   - `surface-container-lowest` = card bg
   - `tertiary` = sale red (#BA0035)
   
2. **Responsive**:
   - Desktop: `grid-cols-12` với 5/2/2/2/1 cols
   - Mobile: Stack vertical, labels hiện inline

3. **Material Symbols**: Dùng `MaterialSymbol` component từ `src/components/ui/material-symbol`

4. **Icons**: Lucide React cho các icon cơ bản

5. **Mock Data**: Tạo mock cart data để test UI (backend API chưa ready)

## Checklist Before Start

- [x] Branch created from `dev`
- [x] Stitch design reviewed
- [x] Existing cart components/hooks reviewed
- [ ] User approved this plan
