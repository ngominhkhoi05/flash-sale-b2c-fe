<!DOCTYPE html>

<html lang="vi"><head><meta charset="utf-8"/><meta content="width=device-width, initial-scale=1.0" name="viewport"/><meta content="web_standard" name="shell-type"/><title>Vibe Mart - Checkout</title><link href="https://fonts.googleapis.com" rel="preconnect"/><link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/><style>@layer base{html,body{margin:0;padding:0;}body{overscroll-behavior:none;}main>:first-child{margin-top:0!important;}main>:last-child{margin-bottom:0!important;}}::-webkit-scrollbar{display:none;}</style><script src="https://cdn.tailwindcss.com"></script><script id="tailwind-config">tailwind.config = { darkMode: "class", theme: { extend: { "colors": { "on-surface": "#131b2e", "on-tertiary": "#ffffff", "surface-container-high": "#e2e7ff", "tertiary-fixed-dim": "#ffb3b6", "secondary-container": "#6cf8bb", "surface-dim": "#d2d9f4", "surface-container-low": "#f2f3ff", "on-background": "#131b2e", "on-secondary-fixed": "#002113", "error-container": "#ffdad6", "surface-bright": "#faf8ff", "on-tertiary-fixed": "#40000c", "on-secondary-container": "#00714d", "tertiary": "#ba0035", "on-tertiary-container": "#fffbff", "surface-container-highest": "#dae2fd", "surface": "#faf8ff", "on-error": "#ffffff", "surface-container": "#eaedff", "on-primary": "#ffffff", "primary-fixed": "#cce5ff", "on-primary-fixed-variant": "#004b73", "on-surface-variant": "#3f4850", "on-error-container": "#93000a", "outline": "#707881", "tertiary-fixed": "#ffdada", "error": "#ba1a1a", "on-tertiary-fixed-variant": "#920028", "secondary": "#006c49", "primary-fixed-dim": "#93ccff", "on-primary-fixed": "#001d31", "on-secondary-fixed-variant": "#005236", "surface-tint": "#006398", "inverse-on-surface": "#eef0ff", "on-primary-container": "#fdfcff", "inverse-surface": "#283044", "surface-container-lowest": "#ffffff", "background": "#faf8ff", "outline-variant": "#bfc7d2", "secondary-fixed": "#6ffbbe", "secondary-fixed-dim": "#4edea3", "tertiary-container": "#e21e49", "primary": "#006194", "inverse-primary": "#93ccff", "primary-container": "#007bb9", "surface-variant": "#dae2fd", "on-secondary": "#ffffff" }, "borderRadius": { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" }, "spacing": { "space-md": "1rem", "gutter-desktop": "1.25rem", "space-xs": "0.25rem", "margin-desktop": "2rem", "space-lg": "1.5rem", "gutter": "1rem", "space-xl": "2rem", "space-sm": "0.5rem", "margin": "1rem" }, "fontFamily": { "label-lg": ["Be Vietnam Pro"], "headline-md": ["Be Vietnam Pro"], "label-md": ["Be Vietnam Pro"], "headline-lg": ["Be Vietnam Pro"], "label-sm": ["Be Vietnam Pro"], "body-lg": ["Be Vietnam Pro"], "price-md": ["Be Vietnam Pro"], "display-lg-mobile": ["Be Vietnam Pro"], "body-md": ["Be Vietnam Pro"], "body-sm": ["Be Vietnam Pro"], "price-lg": ["Be Vietnam Pro"], "display-lg": ["Be Vietnam Pro"], "headline-sm": ["Be Vietnam Pro"] }, "fontSize": { "label-lg": ["14px", { "lineHeight": "20px", "fontWeight": "600" }], "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }], "label-md": ["12px", { "lineHeight": "16px", "fontWeight": "500" }], "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }], "label-sm": ["10px", { "lineHeight": "14px", "fontWeight": "600" }], "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }], "price-md": ["16px", { "lineHeight": "20px", "fontWeight": "700" }], "display-lg-mobile": ["28px", { "lineHeight": "36px", "fontWeight": "700" }], "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }], "body-sm": ["12px", { "lineHeight": "16px", "fontWeight": "400" }], "price-lg": ["20px", { "lineHeight": "24px", "fontWeight": "700" }], "display-lg": ["36px", { "lineHeight": "44px", "fontWeight": "700" }], "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600" }] } } } };</script></head><body class="bg-background font-body-md text-on-surface antialiased"><header class="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-20 max-w-[1240px] mx-auto px-margin-desktop flex items-center justify-between"><div class="flex items-center gap-space-md"><div class="flex items-center gap-space-sm"><span class="font-headline-lg text-headline-lg text-primary tracking-tight">Vibe Mart</span></div><span class="h-6 w-px bg-outline-variant"></span><span class="font-headline-sm text-headline-sm text-on-surface">Kết quả đặt hàng</span></div><div class="hidden md:flex items-center gap-space-md"><div class="flex items-center gap-space-xs text-secondary"><span class="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center"><span class="material-symbols-outlined text-sm leading-none">check</span></span><span class="font-label-md text-label-md">Giỏ hàng</span></div><span class="w-8 h-px bg-outline-variant"></span><div class="flex items-center gap-space-xs text-secondary"><span class="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center"><span class="material-symbols-outlined text-sm leading-none">check</span></span><span class="font-label-md text-label-md">Thanh toán</span></div><span class="w-8 h-px bg-outline-variant"></span><div class="flex items-center gap-space-xs text-primary"><span class="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md font-bold">3</span><span class="font-label-md text-label-md font-bold">Kết quả đơn hàng</span></div></div><div class="flex items-center gap-space-md"><div class="hidden lg:flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md"><span class="material-symbols-outlined text-base text-secondary">lock</span><span>Bảo mật SSL 256-bit</span></div><div class="hidden sm:flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md"><span class="material-symbols-outlined text-base text-primary">support_agent</span><span>Hotline: <strong class="text-on-surface font-semibold">1900 8888</strong></span></div><div class="flex items-center pl-space-xs"><img alt="Profile" class="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high" src="https://lh3.googleusercontent.com/aida/AEtjO1U017l_RuVIS3I_KgAxpob4GJtrIxNUY9ZKsIlOiv6OhHnXLBJnTynFtCUErMx4TaVpX27p0SjKFdFG5IprOh7juoNG6quWx1DTrJoHlC0TVcSrozTwhjm5liOPjqWbRzr5tY642SWOiTL-qLJjRCacNOLKW3mqhWSHvQ-GC-TvNqb0W0iOXRkWeo3LclKiuC6PqzIucVp4oQtSAG3RUip_9wLzh8A0wv0L4ZIif7J1Yr0LexscEp1d2NigHVDPiSQPLow8QCXfYZk"/></div></div></div></header><main class="w-full pt-20 bg-background min-h-screen"><div class="flex flex-col w-full items-center py-space-xl px-margin">
<!-- Desktop Success Card -->
<div class="w-full max-w-[560px] bg-surface-container-lowest rounded-2xl shadow-sm p-8 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
<!-- Top Pill Badge -->
<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wide font-bold">
<span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
      TRẠNG THÁI: THÀNH CÔNG
    </div>
<!-- Animated Checkmark Circle -->
<div class="mt-6 mb-4 w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-secondary relative">
<div class="absolute inset-0 rounded-full bg-secondary-container animate-ping opacity-25"></div>
<span class="material-symbols-outlined text-[36px] font-bold" style="font-variation-settings: 'FILL' 1, 'wght' 700;">check</span>
</div>
<!-- Main Title -->
<h1 class="font-headline-lg text-headline-lg text-on-surface mb-2 font-bold tracking-tight">
      Đặt hàng thành công!
    </h1>
<!-- Subtitle -->
<p class="font-body-md text-body-md text-on-surface-variant max-w-[420px] mb-6">
      Cảm ơn bạn! 2 đơn hàng đã được gửi tới shop và đang được chuẩn bị để giao.
    </p>
<!-- Orders Breakdown Card -->
<div class="w-full bg-surface-container-low rounded-xl p-4 text-left flex flex-col gap-3.5 mb-6">
<!-- Order 1 -->
<div class="flex flex-col gap-1.5">
<div class="flex items-center justify-between gap-2">
<div class="flex items-center gap-2 min-w-0">
<span class="material-symbols-outlined text-primary text-[18px] shrink-0">storefront</span>
<span class="font-label-lg text-label-lg text-on-surface truncate">UTC Fashion Mall</span>
</div>
<span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm shrink-0 font-medium">
            Đã thanh toán
          </span>
</div>
<div class="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pl-6">
<span class="font-mono text-label-md text-label-md">Mã: FS-261001-A7K2Q</span>
<span class="font-price-md text-price-md text-on-surface">538.000₫</span>
</div>
<div class="text-on-surface-variant font-body-sm text-body-sm pl-6 flex items-center gap-1 opacity-80">
<span class="material-symbols-outlined text-sm">qr_code_2</span>
<span>ZaloPay QR</span>
</div>
</div>
<!-- Divider -->
<div class="w-full h-px bg-surface-container-highest"></div>
<!-- Order 2 -->
<div class="flex flex-col gap-1.5">
<div class="flex items-center justify-between gap-2">
<div class="flex items-center gap-2 min-w-0">
<span class="material-symbols-outlined text-primary text-[18px] shrink-0">storefront</span>
<span class="font-label-lg text-label-lg text-on-surface truncate">TechZone Official</span>
</div>
<span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm shrink-0 font-medium">
            Đã thanh toán
          </span>
</div>
<div class="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pl-6">
<span class="font-mono text-label-md text-label-md">Mã: TZ-261001-B9X8M</span>
<span class="font-price-md text-price-md text-on-surface">754.000₫</span>
</div>
<div class="text-on-surface-variant font-body-sm text-body-sm pl-6 flex items-center gap-1 opacity-80">
<span class="material-symbols-outlined text-sm">qr_code_2</span>
<span>ZaloPay QR</span>
</div>
</div>
<!-- Divider -->
<div class="w-full h-px bg-surface-container-highest"></div>
<!-- Total Row -->
<div class="flex items-center justify-between pt-1">
<span class="font-label-lg text-label-lg text-on-surface">Tổng thanh toán</span>
<span class="font-price-lg text-price-lg text-primary tracking-tight font-bold">1.292.000₫</span>
</div>
</div>
<!-- Shipping Summary -->
<div class="w-full bg-surface-container-lowest rounded-xl p-3.5 mb-6 text-left flex items-start gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
<span class="material-symbols-outlined text-primary text-xl mt-0.5 shrink-0" style="font-variation-settings: 'FILL' 1;">location_on</span>
<div class="flex flex-col gap-0.5 min-w-0">
<div class="font-body-md text-body-md text-on-surface">
<span class="font-bold text-on-surface">Nguyễn Văn An</span> <span class="text-on-surface-variant">(0901 234 567)</span>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          450 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM
        </p>
<div class="flex items-center gap-1.5 mt-1 text-secondary font-label-md text-label-md font-semibold">
<span class="material-symbols-outlined text-[16px]">local_shipping</span>
<span>Dự kiến giao ngày mai</span>
</div>
</div>
</div>
<!-- Action Buttons -->
<div class="w-full flex flex-col gap-3">
<button class="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-[10px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer" type="button">
<span class="material-symbols-outlined text-lg">receipt_long</span>
<span>Xem đơn hàng</span>
</button>
<button class="w-full h-12 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg rounded-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer" type="button">
<span class="material-symbols-outlined text-lg">shopping_bag</span>
<span>Tiếp tục mua sắm</span>
</button>
</div>
</div>
<!-- Decorative Separator Header for Mobile Mockup -->
<div class="w-full max-w-[560px] flex items-center gap-4 my-10">
<div class="h-px bg-surface-container-high flex-1"></div>
<div class="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant font-label-md text-label-md">
<span class="material-symbols-outlined text-[18px] text-primary">smartphone</span>
<span>Bản xem trước Giao diện Mobile (390px)</span>
</div>
<div class="h-px bg-surface-container-high flex-1"></div>
</div>
<!-- Mobile Device Mockup Frame (390px width) -->
<div class="w-[390px] bg-inverse-surface rounded-[44px] p-3 shadow-2xl relative">
<!-- Phone Bezel & Camera Dynamic Island -->
<div class="relative w-full bg-background rounded-[34px] overflow-hidden flex flex-col min-h-[740px]">
<!-- Top Speaker / Dynamic Island Simulation -->
<div class="w-full pt-3 pb-2 px-6 flex items-center justify-between bg-surface-container-lowest shrink-0">
<span class="font-label-sm text-label-sm font-bold text-on-surface">9:41</span>
<div class="w-20 h-4 bg-inverse-surface rounded-full flex items-center justify-center">
<div class="w-2 h-2 rounded-full bg-inverse-surface mr-3"></div>
</div>
<div class="flex items-center gap-1 text-on-surface">
<span class="material-symbols-outlined text-xs">signal_cellular_alt</span>
<span class="material-symbols-outlined text-xs">wifi</span>
<span class="material-symbols-outlined text-xs">battery_full</span>
</div>
</div>
<!-- Mobile Top Navigation Header -->
<div class="h-12 bg-surface-container-lowest px-4 flex items-center justify-between shadow-sm shrink-0">
<button class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container">
<span class="material-symbols-outlined text-xl">close</span>
</button>
<span class="font-headline-sm text-headline-sm text-on-surface font-semibold text-center truncate">Đơn hàng thành công</span>
<button class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container">
<span class="material-symbols-outlined text-xl">help</span>
</button>
</div>
<!-- Mobile Scrollable Content Area -->
<div class="p-4 flex-1 flex flex-col items-center overflow-y-auto">
<!-- Badge -->
<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase font-bold text-[10px] mt-1">
<span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          THÀNH CÔNG
        </div>
<!-- Checkmark Circle -->
<div class="mt-4 mb-3 w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
<span class="material-symbols-outlined text-[30px]" style="font-variation-settings: 'FILL' 1, 'wght' 700;">check</span>
</div>
<h2 class="font-headline-sm text-headline-sm text-on-surface font-bold text-center mb-1">
          Đặt hàng thành công!
        </h2>
<p class="font-body-sm text-body-sm text-on-surface-variant text-center max-w-[280px] mb-4">
          2 đơn hàng đã gửi tới shop và đang chuẩn bị giao đến bạn.
        </p>
<!-- Orders Breakdown in Mobile -->
<div class="w-full bg-surface-container-low rounded-xl p-3 flex flex-col gap-2.5 mb-3.5 text-left">
<!-- Mobile Order 1 -->
<div>
<div class="flex items-center justify-between mb-1">
<span class="font-label-md text-label-md text-on-surface font-semibold truncate max-w-[170px]">UTC Fashion Mall</span>
<span class="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[9px] font-medium">Đã thanh toán</span>
</div>
<div class="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm text-[11px]">
<span class="font-mono">FS-261001-A7K2Q</span>
<span class="font-bold text-on-surface">538.000₫</span>
</div>
</div>
<div class="w-full h-px bg-surface-container-highest"></div>
<!-- Mobile Order 2 -->
<div>
<div class="flex items-center justify-between mb-1">
<span class="font-label-md text-label-md text-on-surface font-semibold truncate max-w-[170px]">TechZone Official</span>
<span class="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm text-[9px] font-medium">Đã thanh toán</span>
</div>
<div class="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm text-[11px]">
<span class="font-mono">TZ-261001-B9X8M</span>
<span class="font-bold text-on-surface">754.000₫</span>
</div>
</div>
<div class="w-full h-px bg-surface-container-highest"></div>
<!-- Mobile Total -->
<div class="flex items-center justify-between pt-0.5">
<span class="font-label-md text-label-md text-on-surface font-bold">Tổng thanh toán</span>
<span class="font-price-md text-price-md text-primary font-bold">1.292.000₫</span>
</div>
</div>
<!-- Mobile Delivery Info -->
<div class="w-full bg-surface-container-lowest rounded-xl p-3 mb-4 text-left shadow-sm flex items-start gap-2.5">
<span class="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0" style="font-variation-settings: 'FILL' 1;">location_on</span>
<div class="flex flex-col text-[12px] leading-snug">
<span class="font-bold text-on-surface">Nguyễn Văn An (0901 234 567)</span>
<span class="text-on-surface-variant mt-0.5 line-clamp-2">450 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM</span>
<span class="text-secondary font-semibold flex items-center gap-1 mt-1 text-[11px]">
<span class="material-symbols-outlined text-[13px]">local_shipping</span>
              Dự kiến giao ngày mai
            </span>
</div>
</div>
<!-- Action Buttons (Thumb zone optimized) -->
<div class="w-full flex flex-col gap-2 mt-auto pt-2">
<button class="w-full h-11 bg-primary text-on-primary font-label-md text-label-md rounded-[10px] flex items-center justify-center gap-1.5 font-semibold shadow-sm active:scale-95 transition-all" type="button">
<span class="material-symbols-outlined text-base">receipt_long</span>
<span>Xem đơn hàng</span>
</button>
<button class="w-full h-11 bg-surface-container-high text-on-surface font-label-md text-label-md rounded-[10px] flex items-center justify-center gap-1.5 active:scale-95 transition-all" type="button">
<span class="material-symbols-outlined text-base">shopping_bag</span>
<span>Tiếp tục mua sắm</span>
</button>
</div>
</div>
<!-- Mobile Home Indicator Bar -->
<div class="w-full pb-2 pt-1 flex justify-center bg-background shrink-0">
<div class="w-32 h-1 bg-outline-variant rounded-full"></div>
</div>
</div>
</div>
</div></main><footer class="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.02)] py-space-xl mt-space-xl"><div class="max-w-[1240px] mx-auto px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-space-md"><p class="text-on-surface-variant font-body-sm text-body-sm">© 2026 Vibe Mart. Tất cả quyền được bảo lưu.</p><nav class="flex items-center gap-space-lg" data-active-classes="text-primary font-semibold"><a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors" data-path="dieu-khoan-dich-vu" href="#">Điều khoản dịch vụ</a><a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors" data-path="chinh-sach-bao-mat" href="#">Chính sách bảo mật</a><a class="text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors" data-path="tro-giup" href="#">Trợ giúp</a></nav></div></footer></body></html>