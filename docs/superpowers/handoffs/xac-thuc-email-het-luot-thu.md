<!DOCTYPE html>

<html class="h-full" lang="vi"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Xác thực mã OTP - Vibe Mart</title>
<!-- Google Fonts: Be Vietnam Pro -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols Outlined -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          "colors": {
            "on-tertiary-fixed": "#40000c",
            "error": "#ba1a1a",
            "surface-bright": "#faf8ff",
            "tertiary-fixed": "#ffdada",
            "surface-container-high": "#e2e7ff",
            "on-secondary-fixed-variant": "#005236",
            "inverse-primary": "#93ccff",
            "on-tertiary-container": "#fffbff",
            "on-surface": "#131b2e",
            "on-primary-container": "#fdfcff",
            "inverse-surface": "#283044",
            "surface-container-lowest": "#ffffff",
            "inverse-on-surface": "#eef0ff",
            "primary-fixed-dim": "#93ccff",
            "outline": "#707881",
            "on-secondary-fixed": "#002113",
            "secondary-fixed": "#6ffbbe",
            "on-tertiary-fixed-variant": "#920028",
            "primary-container": "#007bb9",
            "tertiary-fixed-dim": "#ffb3b6",
            "on-secondary-container": "#00714d",
            "surface-container": "#eaedff",
            "outline-variant": "#bfc7d2",
            "on-tertiary": "#ffffff",
            "on-primary-fixed-variant": "#004b73",
            "primary-fixed": "#cce5ff",
            "on-error": "#ffffff",
            "tertiary": "#ba0035",
            "surface": "#faf8ff",
            "secondary-container": "#6cf8bb",
            "surface-tint": "#006398",
            "on-primary-fixed": "#001d31",
            "on-error-container": "#93000a",
            "background": "#faf8ff",
            "tertiary-container": "#e21e49",
            "on-secondary": "#ffffff",
            "secondary-fixed-dim": "#4edea3",
            "primary": "#006194",
            "surface-dim": "#d2d9f4",
            "surface-container-low": "#f2f3ff",
            "on-surface-variant": "#3f4850",
            "secondary": "#006c49",
            "surface-variant": "#dae2fd",
            "on-primary": "#ffffff",
            "error-container": "#ffdad6",
            "surface-container-highest": "#dae2fd",
            "on-background": "#131b2e"
          },
          "borderRadius": {
            "DEFAULT": "0.25rem",
            "lg": "0.5rem",
            "xl": "0.75rem",
            "full": "9999px"
          },
          "spacing": {
            "margin": "1rem",
            "gutter-desktop": "1.25rem",
            "space-xs": "0.25rem",
            "gutter": "1rem",
            "space-md": "1rem",
            "space-xl": "2rem",
            "space-lg": "1.5rem",
            "margin-desktop": "2rem",
            "space-sm": "0.5rem"
          },
          "fontFamily": {
            "body-md": ["Be Vietnam Pro"],
            "label-sm": ["Be Vietnam Pro"],
            "display-lg": ["Be Vietnam Pro"],
            "headline-lg": ["Be Vietnam Pro"],
            "label-md": ["Be Vietnam Pro"],
            "headline-sm": ["Be Vietnam Pro"],
            "headline-md": ["Be Vietnam Pro"],
            "price-lg": ["Be Vietnam Pro"],
            "label-lg": ["Be Vietnam Pro"],
            "display-lg-mobile": ["Be Vietnam Pro"],
            "body-sm": ["Be Vietnam Pro"],
            "body-lg": ["Be Vietnam Pro"],
            "price-md": ["Be Vietnam Pro"]
          },
          "fontSize": {
            "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
            "label-sm": ["10px", { "lineHeight": "14px", "fontWeight": "600" }],
            "display-lg": ["36px", { "lineHeight": "44px", "fontWeight": "700" }],
            "headline-lg": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
            "label-md": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
            "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600" }],
            "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
            "price-lg": ["20px", { "lineHeight": "24px", "fontWeight": "700" }],
            "label-lg": ["14px", { "lineHeight": "20px", "fontWeight": "600" }],
            "display-lg-mobile": ["28px", { "lineHeight": "36px", "fontWeight": "700" }],
            "body-sm": ["12px", { "lineHeight": "16px", "fontWeight": "400" }],
            "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
            "price-md": ["16px", { "lineHeight": "20px", "fontWeight": "700" }]
          }
        }
      }
    }
  </script>
<style>
    body {
      font-family: 'Be Vietnam Pro', sans-serif;
      background-color: #F8FAFC;
    }
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
  </style>
</head>
<body class="bg-[#F8FAFC] text-on-surface flex flex-col min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed">
<!-- 1. AUTH HEADER -->
<header class="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
<div class="max-w-[1240px] mx-auto px-4 md:px-margin-desktop h-full flex items-center justify-between">
<!-- Left cluster: Logo & context label -->
<div class="flex items-center gap-3">
<a class="flex items-center focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">
<img alt="Vibe Mart Logo" class="h-8 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9ZSXY-ADQiNUZQo-howCIm3-UVu2Y2UAQgF1iT75jD095ICjYrGqzNxGXGRnVNVeLoBeMGabxRbgDA8uWlDtB6Fqj-8yawUJvJpA6uvew418hgbYC-zA9f6FQI5C4T4LNt_X5uaC2RSbGhLpBENlqvfuKEOLMqCOWwGLy1L9tELkMBUvAPu-4l0Kxeoab32h7HdH6SdjYAYIeI1IFlIL0Yt4X_KdDPH9nGI4itAHxa3u1KYvjv6emfJIzpMvJFzz8FtJYYfnnJUbp"/>
</a>
<span class="text-slate-300 font-light select-none">|</span>
<span class="text-slate-500 font-label-md text-label-md sm:font-body-md sm:text-body-md font-medium">Xác thực tài khoản</span>
</div>
<!-- Right cluster: Help & Back to home links -->
<div class="flex items-center gap-5">
<a class="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors text-label-md font-label-md" href="#">
<span class="material-symbols-outlined text-[18px]">help_outline</span>
<span>Trợ giúp</span>
</a>
<a class="hidden sm:inline-flex items-center gap-1.5 text-slate-600 hover:text-primary transition-colors text-label-md font-label-md font-medium" href="#">
<span class="material-symbols-outlined text-[18px]">home</span>
<span>Về trang chủ</span>
</a>
</div>
</div>
</header>
<!-- 2. MAIN CONTENT AREA -->
<main class="flex-1 flex flex-col items-center justify-center pt-24 pb-16 px-4">
<div class="max-w-[520px] w-full flex flex-col items-center">
<!-- A. STEPPER 3 BƯỚC CÂN ĐỐI -->
<div class="max-w-[420px] w-full mx-auto mb-8">
<div class="flex items-center justify-between w-full relative">
<!-- Step 1: Hoàn thành -->
<div class="flex flex-col items-center z-10 w-24">
<div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm font-bold text-sm">
<svg class="w-4 h-4" fill="currentColor" viewbox="0 0 20 20">
<path clip-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill-rule="evenodd"></path>
</svg>
</div>
<span class="text-emerald-600 font-label-sm text-label-sm font-semibold mt-1.5 tracking-tight text-center">Tạo tài khoản</span>
</div>
<!-- Connector 1 -->
<div class="h-[2px] flex-1 bg-emerald-500 mx-1 -mt-4"></div>
<!-- Step 2: Lỗi (Hết lượt thử) -->
<div class="flex flex-col items-center z-10 w-24">
<div class="w-8 h-8 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-sm font-bold text-sm ring-4 ring-red-100">
              2
            </div>
<span class="text-[#DC2626] font-label-sm text-label-sm font-semibold mt-1.5 tracking-tight text-center">Xác thực email</span>
</div>
<!-- Connector 2 -->
<div class="h-[2px] flex-1 bg-slate-200 mx-1 -mt-4"></div>
<!-- Step 3: Chưa thực hiện -->
<div class="flex flex-col items-center z-10 w-24">
<div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">
              3
            </div>
<span class="text-slate-400 font-label-sm text-label-sm font-medium mt-1.5 tracking-tight text-center">Hoàn tất</span>
</div>
</div>
</div>
<!-- B. CARD CHÍNH -->
<section class="max-w-[420px] w-full mx-auto bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
<!-- 1. Icon phong bì có ổ khóa -->
<div class="w-14 h-14 mx-auto rounded-full bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center relative">
<span class="material-symbols-outlined text-[28px] text-[#F59E0B]" data-icon="mail">mail</span>
<!-- Mini Locked Badge -->
<div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-md ring-2 ring-white">
<span class="material-symbols-outlined text-[13px]" data-icon="lock" style="font-variation-settings: 'FILL' 1;">lock</span>
</div>
</div>
<!-- 2. Tiêu đề -->
<h1 class="font-headline-lg text-headline-lg font-bold text-slate-800 mt-5">
          Đã hết lượt thử
        </h1>
<!-- 3. Mô tả xám -->
<p class="font-body-md text-body-md text-slate-500 mt-2 leading-relaxed">
          Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã mới để tiếp tục.
        </p>
<!-- 4. Khung cảnh báo bảo mật -->
<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 my-5 text-left flex items-start gap-3">
<span class="material-symbols-outlined text-[20px] text-[#F59E0B] shrink-0 mt-0.5" data-icon="warning">warning</span>
<p class="font-label-md text-label-md font-semibold text-amber-900 leading-snug">
            Bảo mật tài khoản: <span class="font-normal text-amber-800">Mã xác thực cũ đã bị vô hiệu hóa để đảm bảo an toàn. Hãy gửi yêu cầu mã mới.</span>
</p>
</div>
<!-- 5. 6 ô nhập số kích thước 48×56px bị khóa hoàn toàn -->
<div aria-label="Khung nhập OTP bị vô hiệu hóa" class="flex justify-center gap-2 mb-6">
<div class="w-12 h-14 bg-[#F1F5F9] border border-[#CBD5E1] text-slate-400 cursor-not-allowed rounded-lg flex items-center justify-center font-headline-md text-headline-md select-none">
            —
          </div>
<div class="w-12 h-14 bg-[#F1F5F9] border border-[#CBD5E1] text-slate-400 cursor-not-allowed rounded-lg flex items-center justify-center font-headline-md text-headline-md select-none">
            —
          </div>
<div class="w-12 h-14 bg-[#F1F5F9] border border-[#CBD5E1] text-slate-400 cursor-not-allowed rounded-lg flex items-center justify-center font-headline-md text-headline-md select-none">
            —
          </div>
<div class="w-12 h-14 bg-[#F1F5F9] border border-[#CBD5E1] text-slate-400 cursor-not-allowed rounded-lg flex items-center justify-center font-headline-md text-headline-md select-none">
            —
          </div>
<div class="w-12 h-14 bg-[#F1F5F9] border border-[#CBD5E1] text-slate-400 cursor-not-allowed rounded-lg flex items-center justify-center font-headline-md text-headline-md select-none">
            —
          </div>
<div class="w-12 h-14 bg-[#F1F5F9] border border-[#CBD5E1] text-slate-400 cursor-not-allowed rounded-lg flex items-center justify-center font-headline-md text-headline-md select-none">
            —
          </div>
</div>
<!-- 6. Nút Primary hành động chính -->
<button class="w-full h-11 px-4 bg-[#0284C7] hover:bg-sky-700 active:scale-[0.99] text-white font-label-lg text-label-lg font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500" type="button">
<span class="material-symbols-outlined text-[18px]" data-icon="refresh">refresh</span>
<span>Gửi mã mới</span>
</button>
<!-- 7. Dòng điều hướng phụ bên dưới -->
<div class="mt-4 flex flex-col items-center gap-2">
<p class="font-body-md text-body-md text-slate-500">
            Hoặc quay lại <a class="text-[#0284C7] font-medium hover:underline inline-block" href="#">đăng ký với email khác</a>
</p>
<a class="font-body-md text-body-md text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 mt-1 font-medium" href="#">
<span class="material-symbols-outlined text-[16px]">arrow_back</span>
<span>Quay lại đăng ký</span>
</a>
</div>
</section>
<!-- C. Huy hiệu bảo mật dưới Card -->
<div class="mt-6 flex items-center justify-center gap-1.5 text-slate-400 font-label-md text-label-md">
<span class="material-symbols-outlined text-[16px] text-emerald-600" data-icon="verified_user" style="font-variation-settings: 'FILL' 1;">verified_user</span>
<span>Hệ thống bảo mật dữ liệu TLS 256-bit chuẩn thương mại điện tử</span>
</div>
</div>
</main>
<!-- 3. AUTH FOOTER -->
<footer class="w-full border-t border-slate-100 py-6 bg-transparent mt-auto">
<div class="max-w-[1240px] mx-auto px-4 md:px-margin-desktop flex flex-col sm:flex-row items-center justify-between font-body-sm text-body-sm text-slate-400 gap-3">
<p>© 2026 Vibe Mart. Mọi quyền được bảo lưu.</p>
<div class="flex items-center gap-4">
<a class="hover:text-slate-600 transition-colors" href="#">Điều khoản dịch vụ</a>
<span class="text-slate-300">•</span>
<a class="hover:text-slate-600 transition-colors" href="#">Chính sách bảo mật</a>
<span class="text-slate-300">•</span>
<a class="hover:text-slate-600 transition-colors" href="#">Liên hệ hỗ trợ</a>
</div>
</div>
</footer>
</body></html>