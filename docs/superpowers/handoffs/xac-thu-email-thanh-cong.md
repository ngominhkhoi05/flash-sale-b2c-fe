<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực email - State (d) Thành công - Vibe Mart</title>
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
    @keyframes subtle-pulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.08); opacity: 0.4; }
    }
    .pulse-ring {
      animation: subtle-pulse 2.4s ease-in-out infinite;
    }
  </style>
</head>
<body class="bg-[#F8FAFC] text-slate-800 min-h-screen flex flex-col justify-between antialiased">

  <!-- AUTH HEADER -->
  <header class="fixed top-0 left-0 right-0 h-16 backdrop-blur-xl bg-white/80 border-b border-slate-100 z-50">
    <div class="max-w-[1240px] h-full mx-auto px-4 md:px-8 flex items-center justify-between">
      <!-- Left: Logo + Breadcrumb -->
      <div class="flex items-center space-x-3">
        <a href="#" class="flex items-center gap-2 group">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdWL9PXwwV37mFDupd9V4vt_DsHXazBRdJDMjbh3ZsVlaGMhiFsDGuUfAssnJAENifb4SvLmG9uYQFDc6sQobz4LsxDS5k67FtIrcFO-AR62HZntObsaxqKc5buBlkU9jIwJvJn8Y-zrHXodMnuweS6dYZxUyWMQeEwXh9-oPc15sk3dghqsR7HFnOK12ap6Tq9HXjOtBL8rJa2zQCebVITMXJk4UrWUF3KgZ9uw6m0nSXrbAGevjlZNzUu6ARuLa1NBnN2Pwh0AVt" alt="Vibe Mart Logo" class="h-8 w-auto object-contain">
        </a>
        <div class="h-4 w-px bg-slate-200"></div>
        <span class="text-sm font-medium text-slate-600">Xác thực tài khoản</span>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center space-x-6 text-sm">
        <a href="#" class="text-slate-600 hover:text-primary transition-colors flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px]">help</span>
          <span>Trợ giúp</span>
        </a>
        <div class="h-3.5 w-px bg-slate-200"></div>
        <a href="#" class="text-slate-600 hover:text-primary transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Về trang chủ</span>
        </a>
      </div>
    </div>
  </header>

  <!-- MAIN WRAPPER -->
  <main class="flex-grow flex flex-col items-center justify-center pt-24 pb-16 px-4">
    <div class="w-full max-w-[420px] mx-auto">

      <!-- STEPPER 3 BƯỚC (CÂN ĐỐI - ĐỒNG BỘ 100% CẤU TRÚC 3 TRANG TRƯỚC) -->
      <div class="w-full max-w-[420px] mx-auto mb-8">
        <div class="flex items-center justify-between">
          
          <!-- BƯỚC 1: HOÀN THÀNH -->
          <div class="flex flex-col items-center flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
            <span class="mt-2 text-[12px] text-emerald-600 font-medium whitespace-nowrap">Tạo tài khoản</span>
          </div>

          <!-- LINE NỐI 1 - 2 (XANH EMERALD) -->
          <div class="h-[2px] flex-1 bg-emerald-500 -mt-5 mx-2 rounded-full"></div>

          <!-- BƯỚC 2: HOÀN THÀNH (Checkmark xanh lá) -->
          <div class="flex flex-col items-center flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[16px] font-bold">check</span>
            </div>
            <span class="mt-2 text-[12px] text-emerald-600 font-medium whitespace-nowrap">Xác thực email</span>
          </div>

          <!-- LINE NỐI 2 - 3 (MÀU XANH EMERALD NỐI BƯỚC THÀNH CÔNG ĐẾN BƯỚC HOÀN TẤT) -->
          <div class="h-[2px] flex-1 bg-emerald-500 -mt-5 mx-2 rounded-full"></div>

          <!-- BƯỚC 3: HIỆN TẠI (Màu xanh dương #0284C7) -->
          <div class="flex flex-col items-center flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-semibold text-[13px] shadow-sm">
              3
            </div>
            <span class="mt-2 text-[12px] text-[#0284C7] font-semibold whitespace-nowrap">Hoàn tất</span>
          </div>

        </div>
      </div>

      <!-- MAIN STATE CARD -->
      <div class="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center relative overflow-hidden">
        <!-- Accent top border matching success theme -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#0284c7] to-emerald-400"></div>

        <!-- 1. Icon check trong vòng tròn 64px bg-emerald-50 màu #16A34A với pulse ring -->
        <div class="relative w-16 h-16 mx-auto mt-1 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-emerald-200/60 pulse-ring"></div>
          <div class="relative w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
            <span class="material-symbols-outlined text-emerald-600 text-[32px] font-bold" style="font-variation-settings: 'wght' 600;">check</span>
          </div>
        </div>

        <!-- 2. Tiêu đề -->
        <h1 class="text-2xl font-bold text-slate-800 mt-5 mb-2 tracking-tight">
          Email đã được xác thực
        </h1>

        <!-- 3. Mô tả -->
        <p class="text-sm text-slate-500 leading-relaxed mb-6">
          Tài khoản của bạn đã sẵn sàng.<br>
          <span class="font-semibold text-slate-700">an***@gmail.com</span> đã được kích hoạt thành công.
        </p>

        <!-- 4. Hộp thông tin tài khoản -->
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex items-center justify-between text-left">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div>
              <div class="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Tài khoản</div>
              <div class="text-sm font-semibold text-slate-700 font-mono">an***@gmail.com</div>
            </div>
          </div>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex-shrink-0">
            <span class="material-symbols-outlined text-[13px] font-bold">check</span>
            Đã kích hoạt
          </span>
        </div>

        <!-- 5. Nút Primary full-width "Bắt đầu mua sắm" -->
        <a href="#" class="w-full h-11 bg-[#0284C7] hover:bg-[#0369a1] active:scale-[0.99] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-600/20">
          <span class="material-symbols-outlined text-[18px]">shopping_bag</span>
          <span>Bắt đầu mua sắm</span>
        </a>

        <!-- 6. Chuyển trang tự động đếm ngược -->
        <div class="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <svg class="animate-spin h-3.5 w-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Tự chuyển trang sau <strong class="text-slate-600 font-semibold">5</strong> giây.</span>
        </div>

      </div>

      <!-- Trust Badge -->
      <div class="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <span class="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
        <span>Bảo mật kết nối TLS 256-bit chuẩn thương mại điện tử</span>
      </div>

    </div>
  </main>

  <!-- AUTH FOOTER -->
  <footer class="w-full border-t border-slate-200/60 bg-white py-4 px-4 text-xs text-slate-500">
    <div class="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
      <div>
        © 2026 Vibe Mart. Mọi quyền được bảo lưu.
      </div>
      <div class="flex items-center space-x-6">
        <a href="#" class="hover:text-primary transition-colors">Điều khoản dịch vụ</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-primary transition-colors">Chính sách bảo mật</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-primary transition-colors">Trung tâm trợ giúp</a>
      </div>
    </div>
  </footer>

</body>
</html>