<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực email - Vibe Mart</title>
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
            primary: {
              DEFAULT: '#0284C7',
              50: '#F0F9FF',
              100: '#E0F2FE',
              600: '#0284C7',
              700: '#0369A1',
            }
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
    .material-symbols-outlined.fill-1 {
      font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .cursor-blink {
      animation: blink 1s infinite;
    }
  </style>
</head>
<body class="bg-[#F8FAFC] min-h-screen text-slate-800 flex flex-col antialiased selection:bg-[#E0F2FE] selection:text-[#0284C7]">

  <!-- AUTH HEADER: fixed top, h-16, backdrop-blur-xl bg-white/80 border-b border-slate-100 -->
  <header class="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
    <div class="max-w-[1240px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
      
      <!-- Trái: Logo Vibe Mart + Breadcrumb -->
      <div class="flex items-center gap-3">
        <a href="#" class="flex items-center gap-2 group transition-transform active:scale-95" title="Trang chủ Vibe Mart">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6eM3rnvZ5G4UfpDhHuaXhcjoNxDxwn_S60EJBbrjVIQRV_0UKbkHbSthvSGglCM7jH_LzzFbMmxwdAZw9Oxv-LJwEebmOjVTgngWcrq6Qg2kVsg23Idovnc3CDN4xrGgk-BZpm4GtD7RRYgPa5FZyKuDE6QFFU0O99QFoXQKzcwUUQWAJk56boKEpZW8W_CUU0-eCtiVjvUeKytIMB7P_knygX9YAI3kPJT3aJnKfscQFr0AEUbcVXj4ZbDfL1mOWmt7myyim6BTW" alt="Vibe Mart" class="h-8 w-auto object-contain" />
        </a>
        <div class="h-4 w-[1px] bg-slate-200"></div>
        <span class="text-sm font-medium text-slate-600">Xác thực tài khoản</span>
      </div>

      <!-- Phải: Trợ giúp | Về trang chủ -->
      <div class="flex items-center gap-4 text-xs font-medium text-slate-500">
        <a href="#" class="flex items-center gap-1.5 hover:text-[#0284C7] transition-colors">
          <span class="material-symbols-outlined text-[17px]">help</span>
          <span>Trợ giúp</span>
        </a>
        <span class="text-slate-300">|</span>
        <a href="#" class="flex items-center gap-1 hover:text-[#0284C7] transition-colors">
          <span class="material-symbols-outlined text-[17px]">arrow_back</span>
          <span>Về trang chủ</span>
        </a>
      </div>

    </div>
  </header>

  <!-- MAIN CONTENT: pt-24 pb-20 nền #F8FAFC, flex flex-col items-center -->
  <main class="flex-1 w-full pt-28 pb-16 px-4 flex flex-col items-center justify-center">

    <div class="w-full max-w-[420px]">
      
      <!-- STEPPER 3 BƯỚC CÂN ĐỐI (max-w-[420px] mx-auto mb-8 w-full flex items-center justify-between) -->
      <div class="w-full mb-8">
        <div class="flex items-center justify-between relative">
          
          <!-- Bước 1: HOÀN THÀNH -->
          <div class="flex flex-col items-center z-10 w-24">
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[15px] font-bold">check</span>
            </div>
            <span class="mt-2 text-[12px] text-emerald-600 font-medium whitespace-nowrap text-center">Tạo tài khoản</span>
          </div>

          <!-- Line nối 1-2 -->
          <div class="h-[2px] flex-1 bg-emerald-500 -mt-5 mx-1 z-0"></div>

          <!-- Bước 2: HIỆN TẠI -->
          <div class="flex flex-col items-center z-10 w-24">
            <div class="w-8 h-8 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-semibold text-[13px] shadow-sm ring-4 ring-[#E0F2FE]">
              2
            </div>
            <span class="mt-2 text-[12px] text-[#0284C7] font-semibold whitespace-nowrap text-center">Xác thực email</span>
          </div>

          <!-- Line nối 2-3 -->
          <div class="h-[2px] flex-1 bg-slate-200 -mt-5 mx-1 z-0"></div>

          <!-- Bước 3: CHƯA -->
          <div class="flex flex-col items-center z-10 w-24">
            <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-semibold text-[13px]">
              3
            </div>
            <span class="mt-2 text-[12px] text-slate-400 font-medium whitespace-nowrap text-center">Hoàn tất</span>
          </div>

        </div>
      </div>

      <!-- CARD: max-w-[420px] bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center -->
      <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100/90 text-center relative">
        
        <!-- 1. Icon phong bì có tick 56px nền #E0F2FE màu #0284C7 -->
        <div class="w-14 h-14 rounded-full bg-[#E0F2FE] text-[#0284C7] mx-auto flex items-center justify-center relative shadow-sm">
          <span class="material-symbols-outlined text-[28px]">mail</span>
          <div class="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white">
            <span class="material-symbols-outlined text-[13px] font-bold">check</span>
          </div>
        </div>

        <!-- 2. Tiêu đề "Xác thực email của bạn" -->
        <h1 class="font-bold text-2xl text-slate-800 mt-5 mb-2 tracking-tight">
          Xác thực email của bạn
        </h1>

        <!-- 3. Mô tả text-sm -->
        <p class="text-sm text-slate-500 leading-relaxed">
          Nhập mã gồm 6 chữ số đã gửi tới
          <span class="block text-slate-800 font-semibold mt-0.5">
            an***@gmail.com
            <a href="#" class="text-[#0284C7] font-normal hover:underline ml-1.5 text-xs inline-flex items-center gap-0.5">
              <span>Đổi email</span>
            </a>
          </span>
        </p>

        <!-- 4. 6 ô nhập số 48x56px gap-2 my-6 -->
        <div class="flex justify-center items-center gap-2 my-6">
          <!-- Ô 1: Đã nhập số "3" viền 2px #94A3B8 -->
          <div class="w-12 h-14 rounded-lg border-2 border-[#94A3B8] bg-white flex items-center justify-center text-2xl font-semibold text-slate-800 shadow-sm transition-all">
            3
          </div>

          <!-- Ô 2: Focus viền 2px #0284C7 ring #E0F2FE -->
          <div class="w-12 h-14 rounded-lg border-2 border-[#0284C7] ring-4 ring-[#E0F2FE] bg-white flex items-center justify-center text-2xl font-semibold text-slate-800 shadow-sm relative">
            <span class="w-[2px] h-6 bg-[#0284C7] cursor-blink inline-block"></span>
          </div>

          <!-- Ô 3: Trống viền #E2E8F0 -->
          <div class="w-12 h-14 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-center text-2xl font-semibold text-slate-300">
            •
          </div>

          <!-- Ô 4: Trống viền #E2E8F0 -->
          <div class="w-12 h-14 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-center text-2xl font-semibold text-slate-300">
            •
          </div>

          <!-- Ô 5: Trống viền #E2E8F0 -->
          <div class="w-12 h-14 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-center text-2xl font-semibold text-slate-300">
            •
          </div>

          <!-- Ô 6: Trống viền #E2E8F0 -->
          <div class="w-12 h-14 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-center text-2xl font-semibold text-slate-300">
            •
          </div>
        </div>

        <!-- 5. "Mã có hiệu lực trong 10 phút" + icon clock -->
        <div class="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-5">
          <span class="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
          <span>Mã có hiệu lực trong <strong class="text-slate-700 font-medium">10 phút</strong></span>
        </div>

        <!-- 6. Nút "Xác thực" #0284C7 h-10 rounded-lg full-width mờ opacity-60 -->
        <button type="button" disabled class="w-full h-10 bg-[#0284C7] text-white font-medium text-sm rounded-lg opacity-60 cursor-not-allowed flex items-center justify-center shadow-sm">
          Xác thực
        </button>

        <!-- 7. "Chưa nhận được mã?" + "Gửi lại sau 00:59" #94A3B8 -->
        <div class="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1">
          <span>Chưa nhận được mã?</span>
          <span class="text-[#94A3B8] font-medium">Gửi lại sau 00:59</span>
        </div>

        <!-- 8. "← Quay lại đăng ký" text-slate-500 -->
        <div class="mt-6 pt-5 border-t border-slate-100">
          <a href="#" class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0284C7] transition-colors">
            <span class="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Quay lại đăng ký</span>
          </a>
        </div>

      </div>

      <!-- Khung thông tin chứng nhận nhỏ gọn bên dưới card -->
      <div class="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
        <span class="material-symbols-outlined text-[16px] text-emerald-500">verified_user</span>
        <span>Bảo mật kết nối TLS 256-bit chuẩn thương mại điện tử</span>
      </div>

    </div>

  </main>

  <!-- AUTH FOOTER: copyright + 3 links -->
  <footer class="w-full border-t border-slate-100 bg-white py-4 px-4 sm:px-6">
    <div class="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      <div>
        © 2026 Vibe Mart. Mọi quyền được bảo lưu.
      </div>
      <div class="flex items-center gap-5">
        <a href="#" class="hover:text-[#0284C7] transition-colors">Điều khoản dịch vụ</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-[#0284C7] transition-colors">Chính sách bảo mật</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-[#0284C7] transition-colors">Trung tâm trợ giúp</a>
      </div>
    </div>
  </footer>

</body>
</html>