<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kết quả xác thực email - State B: Thành công - Vibe Mart</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Be Vietnam Pro"', 'sans-serif'],
          },
          colors: {
            primary: '#006194',
            'primary-hover': '#004f7a',
            mint: '#059669',
            'surface-bg': '#f8fafc',
            'border-light': '#e2e8f0',
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Be Vietnam Pro', sans-serif;
    }
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .material-symbols-outlined.fill-icon {
      font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
    }
  </style>
</head>
<body class="bg-[#f8fafc] text-slate-800 min-h-screen flex flex-col justify-between selection:bg-sky-100 selection:text-sky-900 relative">

  <!-- AUTH HEADER -->
  <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 h-16">
    <div class="max-w-[1240px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
      <!-- Logo + Breadcrumb -->
      <div class="flex items-center gap-3 sm:gap-4">
        <a href="#" class="flex items-center gap-2 group transition-opacity hover:opacity-90">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcouu5lgSN4eWfH51aHhOzt4HTKIhmf2PYY3w_pTrS0tHdDzu4M2Ej7DgxKPv9aj60YEa_J_oMgtaLW3-RIboQjLgC7TLbhq1Jin4JMPBAZLZhK-anvvK0n0Ik6P5RlOexFGOOyuJ728rlNr4wbO03JyKyQWSbtJSaBdXI0FdiqsTwSasgMkvnaSWi8p7GDYi9-X6g8AEg1Q3y5uO7_PB2FTj5dbp6ulMvPjpTCvFE3lDOBwEYHNzqbGNgIUi8toBDtKRw2-0cKv8h" alt="Vibe Mart Logo" class="h-8 md:h-9 w-auto object-contain" />
        </a>
        <div class="h-4 w-px bg-slate-300"></div>
        <div class="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Xác thực tài khoản</span>
        </div>
      </div>

      <!-- Navigation links right -->
      <nav class="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600">
        <a href="#" class="hover:text-primary transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-[18px]">help</span>
          <span>Trợ giúp</span>
        </a>
        <div class="h-3.5 w-px bg-slate-200"></div>
        <a href="#" class="hover:text-primary transition-colors flex items-center gap-1 font-medium">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Về trang chủ</span>
        </a>
      </nav>
    </div>
  </header>

  <!-- MAIN AUTH CONTENT (NO LEFT PANEL, CENTERED CARD 420px) -->
  <main class="flex-1 min-h-screen flex items-center justify-center px-4 pt-20 pb-20">
    <div class="w-full max-w-[420px]">
      
      <!-- Card trắng rounded-2xl p-8 shadow-lg -->
      <div class="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center transition-all duration-300">
        
        <!-- Icon tick tròn màu #16A34A đường kính 64px với dấu tick trắng -->
        <div class="relative mb-6">
          <div class="w-16 h-16 rounded-full bg-[#16A34A] flex items-center justify-center shadow-md shadow-emerald-500/20 ring-8 ring-emerald-50">
            <svg class="w-8 h-8 text-white stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <!-- Tiny accent sparkle badge -->
          <span class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
            <span class="material-symbols-outlined fill-icon text-emerald-600 text-[18px]">verified</span>
          </span>
        </div>

        <!-- Tiêu đề "Xác thực thành công" bold -->
        <h1 class="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight mb-2">
          Xác thực thành công
        </h1>

        <!-- Subtitle -->
        <p class="text-sm text-slate-600 mb-6 leading-relaxed">
          Email <span class="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs sm:text-sm">an***@gmail.com</span> đã được xác thực.
        </p>

        <!-- Brief security info badge -->
        <div class="w-full bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 mb-6 flex items-center gap-2.5 text-left text-xs text-emerald-800">
          <span class="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">check_circle</span>
          <span class="leading-snug">Tài khoản của bạn đã được kích hoạt và sẵn sàng mua sắm an toàn trên Vibe Mart.</span>
        </div>

        <!-- Nút Primary "Đăng nhập" màu #006194, h-10, rounded-lg, full-width -->
        <a href="#" class="w-full h-10 bg-[#006194] hover:bg-[#004f7a] active:scale-[0.99] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-[#006194]/25 transition-all duration-150 mb-3.5 group">
          <span>Đăng nhập</span>
          <span class="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
        </a>

        <!-- Dòng nhỏ xám: "Tự chuyển trang sau 5 giây." -->
        <div class="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-normal">
          <span class="material-symbols-outlined text-[15px] animate-spin text-slate-400" style="animation-duration: 2.5s;">progress_activity</span>
          <span>Tự chuyển trang sau <span id="countdown" class="font-medium text-slate-700">5</span> giây.</span>
        </div>

      </div>

      <!-- Trust note below card -->
      <div class="mt-4 text-center">
        <p class="text-[11px] text-slate-600 flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-[13px] text-slate-600">lock</span>
          <span>Bảo mật kết nối SSL 256-bit chuẩn PCI-DSS</span>
        </p>
      </div>

    </div>
  </main>

  <!-- AUTH FOOTER -->
  <footer class="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/80 py-3.5">
    <div class="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
      <div>
        © 2026 Vibe Mart. Mọi quyền được bảo lưu.
      </div>
      <div class="flex items-center gap-4 text-slate-600">
        <a href="#" class="hover:text-primary transition-colors">Điều khoản dịch vụ</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-primary transition-colors">Chính sách bảo mật</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-primary transition-colors">Liên hệ</a>
      </div>
    </div>
  </footer>

  <!-- Simple countdown script simulation -->
  <script>
    let seconds = 5;
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
      const interval = setInterval(() => {
        seconds--;
        if (seconds >= 0) {
          countdownEl.textContent = seconds;
        } else {
          clearInterval(interval);
        }
      }, 1000);
    }
  </script>
</body>
</html>
