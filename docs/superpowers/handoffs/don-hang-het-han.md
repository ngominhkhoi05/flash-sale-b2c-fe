<!DOCTYPE html>

<html lang="vi"><head><meta charset="utf-8"/><meta content="width=device-width, initial-scale=1.0" name="viewport"/><meta content="web_standard" name="shell-type"/><title>Vibe Mart - Checkout</title><link href="https://fonts.googleapis.com" rel="preconnect"/><link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/><style>@layer base{html,body{margin:0;padding:0;}body{overscroll-behavior:none;}main>:first-child{margin-top:0!important;}main>:last-child{margin-bottom:0!important;}}::-webkit-scrollbar{display:none;}</style><script src="https://cdn.tailwindcss.com"></script><script id="tailwind-config">tailwind.config = { darkMode: "class", theme: { extend: { "colors": { "on-surface": "#131b2e", "on-tertiary": "#ffffff", "surface-container-high": "#e2e7ff", "tertiary-fixed-dim": "#ffb3b6", "secondary-container": "#6cf8bb", "surface-dim": "#d2d9f4", "surface-container-low": "#f2f3ff", "on-background": "#131b2e", "on-secondary-fixed": "#002113", "error-container": "#ffdad6", "surface-bright": "#faf8ff", "on-tertiary-fixed": "#40000c", "on-secondary-container": "#00714d", "tertiary": "#ba0035", "on-tertiary-container": "#fffbff", "surface-container-highest": "#dae2fd", "surface": "#faf8ff", "on-error": "#ffffff", "surface-container": "#eaedff", "on-primary": "#ffffff", "primary-fixed": "#cce5ff", "on-primary-fixed-variant": "#004b73", "on-surface-variant": "#3f4850", "on-error-container": "#93000a", "outline": "#707881", "tertiary-fixed": "#ffdada", "error": "#ba1a1a", "on-tertiary-fixed-variant": "#920028", "secondary": "#006c49", "primary-fixed-dim": "#93ccff", "on-primary-fixed": "#001d31", "on-secondary-fixed-variant": "#005236", "surface-tint": "#006398", "inverse-on-surface": "#eef0ff", "on-primary-container": "#fdfcff", "inverse-surface": "#283044", "surface-container-lowest": "#ffffff", "background": "#faf8ff", "outline-variant": "#bfc7d2", "secondary-fixed": "#6ffbbe", "secondary-fixed-dim": "#4edea3", "tertiary-container": "#e21e49", "primary": "#006194", "inverse-primary": "#93ccff", "primary-container": "#007bb9", "surface-variant": "#dae2fd", "on-secondary": "#ffffff" }, "borderRadius": { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" }, "spacing": { "space-md": "1rem", "gutter-desktop": "1.25rem", "space-xs": "0.25rem", "margin-desktop": "2rem", "space-lg": "1.5rem", "gutter": "1rem", "space-xl": "2rem", "space-sm": "0.5rem", "margin": "1rem" }, "fontFamily": { "label-lg": ["Be Vietnam Pro"], "headline-md": ["Be Vietnam Pro"], "label-md": ["Be Vietnam Pro"], "headline-lg": ["Be Vietnam Pro"], "label-sm": ["Be Vietnam Pro"], "body-lg": ["Be Vietnam Pro"], "price-md": ["Be Vietnam Pro"], "display-lg-mobile": ["Be Vietnam Pro"], "body-md": ["Be Vietnam Pro"], "body-sm": ["Be Vietnam Pro"], "price-lg": ["Be Vietnam Pro"], "display-lg": ["Be Vietnam Pro"], "headline-sm": ["Be Vietnam Pro"] }, "fontSize": { "label-lg": ["14px", { "lineHeight": "20px", "fontWeight": "600" }], "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }], "label-md": ["12px", { "lineHeight": "16px", "fontWeight": "500" }], "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }], "label-sm": ["10px", { "lineHeight": "14px", "fontWeight": "600" }], "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }], "price-md": ["16px", { "lineHeight": "20px", "fontWeight": "700" }], "display-lg-mobile": ["28px", { "lineHeight": "36px", "fontWeight": "700" }], "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }], "body-sm": ["12px", { "lineHeight": "16px", "fontWeight": "400" }], "price-lg": ["20px", { "lineHeight": "24px", "fontWeight": "700" }], "display-lg": ["36px", { "lineHeight": "44px", "fontWeight": "700" }], "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600" }] } } } };</script></head><body class="bg-background font-body-md text-on-surface antialiased"><header class="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-20 max-w-[1240px] mx-auto px-margin-desktop flex items-center justify-between"><div class="flex items-center gap-space-md"><div class="flex items-center gap-space-sm"><span class="font-headline-lg text-headline-lg text-primary tracking-tight">Vibe Mart</span></div><span class="h-6 w-px bg-outline-variant"></span><span class="font-headline-sm text-headline-sm text-on-surface">Kết quả đặt hàng</span></div><div class="hidden md:flex items-center gap-space-md"><div class="flex items-center gap-space-xs text-secondary"><span class="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center"><span class="material-symbols-outlined text-sm leading-none">check</span></span><span class="font-label-md text-label-md">Giỏ hàng</span></div><span class="w-8 h-px bg-outline-variant"></span><div class="flex items-center gap-space-xs text-secondary"><span class="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center"><span class="material-symbols-outlined text-sm leading-none">check</span></span><span class="font-label-md text-label-md">Thanh toán</span></div><span class="w-8 h-px bg-outline-variant"></span><div class="flex items-center gap-space-xs text-primary"><span class="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md font-bold">3</span><span class="font-label-md text-label-md font-bold">Kết quả đơn hàng</span></div></div><div class="flex items-center gap-space-md"><div class="hidden lg:flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md"><span class="material-symbols-outlined text-base text-secondary">lock</span><span>Bảo mật SSL 256-bit</span></div><div class="hidden sm:flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md"><span class="material-symbols-outlined text-base text-primary">support_agent</span><span>Hotline: <strong class="text-on-surface font-semibold">1900 8888</strong></span></div><div class="flex items-center pl-space-xs"><img alt="Profile" class="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high" src="https://lh3.googleusercontent.com/aida/AEtjO1U017l_RuVIS3I_KgAxpob4GJtrIxNUY9ZKsIlOiv6OhHnXLBJnTynFtCUErMx4TaVpX27p0SjKFdFG5IprOh7juoNG6quWx1DTrJoHlC0TVcSrozTwhjm5liOPjqWbRzr5tY642SWOiTL-qLJjRCacNOLKW3mqhWSHvQ-GC-TvNqb0W0iOXRkWeo3LclKiuC6PqzIucVp4oQtSAG3RUip_9wLzh8A0wv0L4ZIif7J1Yr0LexscEp1d2NigHVDPiSQPLow8QCXfYZk"/></div></div></div></header><main class="w-full pt-20 bg-background min-h-screen"><div class="flex flex-col w-full py-space-xl px-margin items-center justify-center">
<div class="w-full max-w-[560px] bg-surface-container-lowest rounded-2xl shadow-sm p-8 flex flex-col items-center text-center">
<!-- Status Badge -->
<div class="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-label-sm text-label-sm tracking-wide uppercase mb-6">
<span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
<span>Trạng thái: Đã hủy tự động</span>
</div>
<!-- Hourglass Visual Circle -->
<div class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mb-6 shadow-inner">
<span class="material-symbols-outlined text-[36px]" style="font-variation-settings: 'FILL' 1;">hourglass_disabled</span>
</div>
<!-- Main Title -->
<h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-2">
      Đơn hàng đã hết hạn
    </h1>
<!-- Description -->
<p class="font-body-md text-body-md text-on-surface-variant max-w-[440px] mb-6">
      Bạn chưa hoàn tất thanh toán trong 5 phút nên 2 đơn hàng đã tự động hủy. Sản phẩm trong giỏ đã được hoàn lại kho.
    </p>
<!-- Restored Benefits Box -->
<div class="w-full bg-emerald-50 rounded-xl p-4 my-2 text-left space-y-2.5">
<div class="flex items-center gap-1.5 text-emerald-800 font-label-lg text-label-lg">
<span class="material-symbols-outlined text-lg leading-none" style="font-variation-settings: 'FILL' 1;">verified</span>
<span>Quyền lợi đã được phục hồi tự động:</span>
</div>
<div class="flex items-start gap-2 font-label-md text-label-md text-emerald-700">
<span class="material-symbols-outlined text-base leading-tight">check_circle</span>
<span>Voucher Vibe Mart <strong class="font-semibold">FREESHIP50K</strong> đã được hoàn lại vào Ví Voucher của bạn.</span>
</div>
<div class="flex items-start gap-2 font-label-md text-label-md text-emerald-700">
<span class="material-symbols-outlined text-base leading-tight">check_circle</span>
<span>2 mã giảm giá shop (-20.000₫) đã được mở khóa để có thể sử dụng lại.</span>
</div>
</div>
<!-- Inventory Restocked Preview Box -->
<div class="w-full bg-surface-container-low rounded-[10px] p-3 text-left font-body-sm text-body-sm text-on-surface-variant flex items-center justify-between gap-2 mt-2 mb-6">
<div class="flex items-center gap-2 min-w-0">
<span class="material-symbols-outlined text-base text-outline">inventory_2</span>
<span class="truncate font-medium text-on-surface">Áo Polo Oversize (UTC) &amp; Cáp C-to-C (TechZone)</span>
</div>
<span class="shrink-0 inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm bg-secondary-container/40 px-2 py-0.5 rounded-full font-semibold">
<span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
        Còn hàng tại shop
      </span>
</div>
<!-- Action Buttons -->
<div class="w-full flex flex-col gap-3">
<a class="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm" data-path="flash-sale" href="#">
<span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">bolt</span>
<span>Quay lại Flash Sale</span>
</a>
<a class="w-full h-12 bg-surface-container hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg rounded-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.99]" data-path="gio-hang" href="#">
<span class="material-symbols-outlined text-xl text-outline">shopping_cart</span>
<span>Xem lại giỏ hàng (2 sản phẩm)</span>
</a>
</div>
<!-- Subtle Help Footer Note -->
<div class="mt-6 flex items-center justify-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
<span>Cần trợ giúp đơn hàng?</span>
<a class="text-primary hover:underline font-label-md text-label-md" data-path="ho-tro" href="#">Liên hệ bộ phận CSKH 24/7</a>
</div>
</div>
</div></main><footer class="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.02)] py-space-xl mt-space-xl"><div class="max-w-[1240px] mx-auto px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-space-md"><p class="text-on-surface-variant font-body-sm text-body-sm">© 2026 Vibe Mart. Tất cả quyền được bảo lưu.</p><nav class="flex items-center gap-space-lg" data-active-classes="text-primary font-semibold"><a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors" data-path="dieu-khoan-dich-vu" href="#">Điều khoản dịch vụ</a><a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors" data-path="chinh-sach-bao-mat" href="#">Chính sách bảo mật</a><a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors" data-path="tro-giup" href="#">Trợ giúp</a></nav></div></footer></body></html>