<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kết quả xác thực email - Đang xác thực - Vibe Mart</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Be Vietnam Pro"', 'sans-serif'],
          },
          colors: {
            primary: '#0284c7',
            'primary-dark': '#0369a1',
            'primary-light': '#e0f2fe',
            surface: '#faf8ff',
            'surface-container-lowest': '#ffffff',
            'surface-container-low': '#f8fafc',
            'on-surface': '#0f172a',
            'on-surface-variant': '#64748b',
            outline: '#cbd5e1',
            'outline-variant': '#e2e8f0',
          }
        }
      }
    }
  </script>
  <style>
    @keyframes spin-slow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .animate-spin-custom {
      animation: spin-slow 1s linear infinite;
    }
    @keyframes pulse-subtle {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.85; transform: scale(0.97); }
    }
    .animate-pulse-subtle {
      animation: pulse-subtle 2s ease-in-out infinite;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col justify-between selection:bg-sky-100 selection:text-sky-900">

  <!-- AUTH HEADER -->
  <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
    <div class="max-w-[1240px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
      <!-- Logo + Breadcrumb -->
      <div class="flex items-center space-x-3 sm:space-x-4">
        <a href="#" class="flex items-center space-x-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1" title="Vibe Mart Trang chủ">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDELNA2E34Gju7EKX8UuUNELClfvXMMWDB_LTx0lh2nZeVhModnoqdGsfZl6lGwJa4d_toG28fNCGNhu7zxg0C2PNNGm1PswqOG_mQUZ7qTmIR9-I4QNctxU9mby58vyHB_pQ0rQ-uDWMTohpypJCZxB6b7eL913usJlQDvzSk_mt21wdJ0TFHmApKO77Vxd7eQGbSTiepR1OBR80hXUHam6aV1vO3ryw7Pw6hU03-nij6Sj0eoXAwFU9_nTR7q8VysDVEtzZfn4ABl" alt="Vibe Mart" class="h-8 sm:h-9 w-auto object-contain">
        </a>
        <div class="h-4 w-[1.5px] bg-slate-300"></div>
        <div class="flex items-center space-x-2 text-xs sm:text-sm font-medium text-slate-600">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span class="text-slate-700 font-semibold">Xác thực tài khoản</span>
        </div>
      </div>

      <!-- Nav actions: Trợ giúp | Về trang chủ -->
      <nav class="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm">
        <a href="#" class="inline-flex items-center space-x-1.5 text-slate-600 hover:text-primary transition-colors duration-150 py-1.5 px-2 rounded-lg hover:bg-slate-100/60 font-medium">
          <span class="material-symbols-outlined text-[18px]">help</span>
          <span>Trợ giúp</span>
        </a>
        <a href="#" class="inline-flex items-center space-x-1.5 text-slate-600 hover:text-primary transition-colors duration-150 py-1.5 px-2 rounded-lg hover:bg-slate-100/60 font-medium">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Về trang chủ</span>
        </a>
      </nav>
    </div>
  </header>

  <!-- MAIN AUTH FORM CARD -->
  <main class="flex-1 flex items-center justify-center px-4 py-24 min-h-screen">
    <div class="max-w-[420px] w-full bg-white rounded-2xl p-8 sm:p-10 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center transition-all">
      
      <!-- Spinner 64px màu #0284C7 -->
      <div class="relative w-16 h-16 mb-6 flex items-center justify-center">
        <!-- Vòng hào quang mờ nhẹ -->
        <div class="absolute inset-0 rounded-full bg-sky-100/70 animate-ping opacity-25"></div>
        
        <!-- Vòng xoay spinner chính -->
        <svg class="w-16 h-16 animate-spin-custom" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Vòng nền mờ -->
          <circle cx="32" cy="32" r="26" stroke="#E2E8F0" stroke-width="5" stroke-linecap="round"/>
          <!-- Vòng xoay xanh thương hiệu #0284c7 -->
          <circle cx="32" cy="32" r="26" stroke="#0284c7" stroke-width="5" stroke-linecap="round" stroke-dasharray="163" stroke-dashoffset="118"/>
        </svg>

        <!-- Icon ổ khóa / email nhỏ ở tâm spinner -->
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="material-symbols-outlined text-primary text-[22px] animate-pulse-subtle">mark_email_read</span>
        </div>
      </div>

      <!-- Tiêu đề bold -->
      <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2.5">
        Đang xác thực email của bạn...
      </h1>

      <!-- Subtitle xám -->
      <p class="text-sm text-slate-500 font-normal leading-relaxed max-w-[340px]">
        Hệ thống đang kiểm tra mã token kích hoạt. Vui lòng đợi trong giây lát.
      </p>

      <!-- Badge bảo mật & Tiến trình tinh tế (Không nút) -->
      <div class="mt-8 pt-6 w-full border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-400">
        <span class="material-symbols-outlined text-[16px] text-slate-400">lock</span>
        <span>Bảo mật chuẩn TLS 256-bit • Vibe Mart</span>
      </div>

    </div>
  </main>

  <!-- AUTH FOOTER -->
  <footer class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80">
    <div class="max-w-[1240px] mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
      <!-- Copyright -->
      <div>
        © 2026 Vibe Mart. Mọi quyền được bảo lưu.
      </div>

      <!-- Links -->
      <div class="flex items-center space-x-3 text-slate-500">
        <a href="#" class="hover:text-primary transition-colors duration-150">Điều khoản dịch vụ</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-primary transition-colors duration-150">Chính sách bảo mật</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-primary transition-colors duration-150">Liên hệ</a>
      </div>
    </div>
  </footer>

</body>
</html>