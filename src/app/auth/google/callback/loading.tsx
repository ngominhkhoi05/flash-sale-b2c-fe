/**
 * Loading skeleton cho Google OAuth callback.
 * Next 16 tự động dùng khi Suspense fallback.
 */
export function LoadingSkeleton() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-6"
      data-testid="google-callback-loading"
    >
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" />
        <p className="text-lg font-semibold text-on-surface">
          Đang hoàn tất đăng nhập
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Vui lòng đợi trong giây lát...
        </p>
      </div>
    </div>
  );
}

export default LoadingSkeleton;
