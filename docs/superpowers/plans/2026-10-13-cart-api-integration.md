# Plan: Cart API Integration

> Branch: `feat/cart-page-ui` (tiếp tục)
> Date: 2026-10-13

## Scope

Gắn API backend thật cho cart page. Backend trả về `CartResponse` (grouped by store),
code hiện tại dùng `CartItem[]` (flat list) → cần refactor.

### Tham khảo

- API: `http://180.93.137.28/v3/api-docs` (openapi spec)
- 3 endpoints: `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PUT /api/v1/cart/items/{id}`, `DELETE /api/v1/cart/items/{id}`
- Schemas: `CartResponse`, `CartStoreGroupResponse`, `CartItemResponse`
- 3 file hiện có cần refactor: `types.ts`, `api.ts`, `hooks.ts` + test `hooks.test.tsx`
- 4 component UI (`CartHeader`, `CartItemCard`, `CartShopGroup`, `CartStickyFooter`, `CartPageContent`) cần update types

### API Contract (từ OpenAPI)

```
GET /api/v1/cart
→ 200 ApiResponse<CartResponse>
{
  id: int64,
  userId: int64,
  storeGroups: CartStoreGroupResponse[],  // grouped theo store
  totalItems: int32,
  grandTotal: number
}

CartStoreGroupResponse:
{
  storeId: int64,
  storeName: string,
  items: CartItemResponse[],
  storeSubtotal: number
}

CartItemResponse:
{
  id: int64,
  variantId: int64,
  sku: string,
  productName: string,
  variantName: string,
  imageUrl: string,
  price: number,
  stockQuantity: int32,
  quantity: int32,
  itemSubtotal: number,
  storeId: int64,
  storeName: string
}
```

### Subplan

#### Subplan 1: Refactor types.ts + api.ts + index.ts
- Thay `CartItem` (flat) bằng types khớp API: `CartResponse`, `CartStoreGroup`, `CartItemResponse`
- Thêm helper `getCartItemsFlat(cart)` trả về `CartItemResponse[]` để UI dùng
- Update `getCartItems` → `getCart()` trả về `CartResponse`
- Thêm `addToCart(variantId, quantity)`, `updateCartItem(itemId, quantity)`, `removeCartItem(itemId)`, `clearCart()`
- Keep `getCartSummary` (deprecated) hoặc tính từ `CartResponse` luôn

#### Subplan 2: Refactor hooks.ts + viết tests
- `useCart()` thay `useCartItems` + `useCartSummary`
- `useCartCount` select từ `useCart()` (`data.totalItems`)
- Thêm mutations: `useAddToCartMutation`, `useUpdateCartItemMutation`, `useRemoveCartItemMutation`, `useClearCartMutation`
- Mutations invalidate `cartKeys.all` để refetch
- Update `hooks.test.tsx` cho types mới + test mutations

#### Subplan 3: Update UI components để dùng types mới
- `CartItemCard`: nhận `CartItemResponse`
- `CartShopGroup`: nhận `CartStoreGroup` + items
- `CartStickyFooter`: nhận `totalItems`, `grandTotal`
- `CartPageContent`: dùng `useCart()`, bỏ mock, hookup mutations
- Xóa `MOCK_CART_ITEMS`, xóa `handleQuantityChange` mock console.log → mutation thật

## Test strategy

- Unit test hooks: `getCart()` success + 401, mutations thành công → invalidate query
- Component test: chưa có → TODO (sẽ thêm sau khi có backend chạy được)
- Manual smoke: mở `/cart` với user thật, kiểm tra load + add + update + remove

## Files

| File | Action | Mô tả |
|------|--------|--------|
| `src/features/cart/types.ts` | Edit | Refactor types khớp API |
| `src/features/cart/api.ts` | Edit | Refactor API layer + mutations |
| `src/features/cart/hooks.ts` | Edit | useCart + 4 mutations |
| `src/features/cart/index.ts` | Edit | Export new APIs |
| `src/features/cart/hooks.test.tsx` | Edit | Update test cho new types + mutations |
| `src/components/storefront/cart/CartItemCard.tsx` | Edit | Dùng `CartItemResponse` |
| `src/components/storefront/cart/CartShopGroup.tsx` | Edit | Dùng `CartStoreGroup` |
| `src/components/storefront/cart/CartStickyFooter.tsx` | Edit | Dùng grandTotal |
| `src/components/storefront/cart/CartPageContent.tsx` | Edit | Dùng useCart + mutations, bỏ mock |

## Notes

- Ưu tiên sửa đúng flow, sau đó mới polish UI
- Nếu backend chưa start (401) → bỏ qua, để user chạy thử
- Mutations dùng `useMutation` + invalidate `cartKeys.all`
- Không test được mutations nếu backend offline → mock apiFn trong test
