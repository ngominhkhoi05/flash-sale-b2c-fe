<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực Email OTP - State (a) Sai mã - Vibe Mart</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Be Vietnam Pro', sans-serif;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }
    .shake-error {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
  </style>
</head>
<body class="bg-[#F8FAFC] min-h-screen text-slate-800 flex flex-col justify-between selection:bg-rose-100 selection:text-rose-700 antialiased">

  <!-- AUTH HEADER -->
  <header class="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
    <div class="max-w-[1240px] h-full mx-auto px-4 md:px-8 flex items-center justify-between">
      <!-- Logo + Tên luồng -->
      <div class="flex items-center gap-3">
        <a href="#" class="flex items-center gap-2 group">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZO519r_kuf1BMFC0AG-4D5FCc2YAala36Te8h0fBZMCNf5g6kQhmlD6eh6P1iKueqEKI_9Fxjs8EzGxELA6kQrmj__FbbZLLTYUTiujEgJmh2ED-11HlfKB_0N5ETH2kETxif_AEsnGGqGlP-ZMLqysp-uU5pMAMoCzjCv5q7Fr45_h2ppIg4JHdicDSxmvSzsC504xAYBFBH2OoBvxvbEK2BdeCDEKjYeFdjCtbQkUO03hfChjPTtZb5-ERDI2UBIz--BK-K7cTV" alt="Vibe Mart Logo" class="h-8 w-auto object-contain">
        </a>
        <span class="h-4 w-[1px] bg-slate-300"></span>
        <span class="text-sm font-medium text-slate-600">Xác thực tài khoản</span>
      </div>

      <!-- Links phụ bên phải -->
      <div class="flex items-center gap-3 text-sm text-slate-500">
        <a href="#" class="hover:text-slate-800 transition-colors flex items-center gap-1.5">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Trợ giúp
        </a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-[#0284C7] transition-colors flex items-center gap-1">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Về trang chủ
        </a>
      </div>
    </div>
  </header>

  <!-- MAIN CONTAINER -->
  <main class="flex-grow pt-28 pb-16 px-4 flex flex-col items-center justify-center">

    <div class="w-full max-w-[420px] mx-auto">

      <!-- STEPPER 3 BƯỚC CÂN ĐỐI -->
      <div class="w-full mb-8">
        <div class="flex items-center justify-between relative">
          <!-- Step 1 -->
          <div class="flex flex-col items-center z-10 w-24">
            <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <svg class="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-xs font-medium text-emerald-600 mt-2 whitespace-nowrap">Tạo tài khoản</span>
          </div>

          <!-- Line 1-2 (đã hoàn tất bước 1 sang 2) -->
          <div class="h-[2px] flex-1 bg-emerald-500 -mt-6 mx-1"></div>

          <!-- Step 2 (Trạng thái lỗi - Màu Đỏ) -->
          <div class="flex flex-col items-center z-10 w-24">
            <div class="w-8 h-8 rounded-full bg-[#DC2626] text-white font-semibold text-xs flex items-center justify-center shadow-sm ring-4 ring-rose-100">
              2
            </div>
            <span class="text-xs font-semibold text-[#DC2626] mt-2 whitespace-nowrap">Xác thực email</span>
          </div>

          <!-- Line 2-3 -->
          <div class="h-[2px] flex-1 bg-slate-200 -mt-6 mx-1"></div>

          <!-- Step 3 -->
          <div class="flex flex-col items-center z-10 w-24">
            <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 font-medium text-xs flex items-center justify-center">
              3
            </div>
            <span class="text-xs text-slate-400 mt-2 whitespace-nowrap">Hoàn tất</span>
          </div>
        </div>
      </div>

      <!-- CARD NỘI DUNG CHÍNH -->
      <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
        <!-- Đường line nhấn đỏ cảnh báo đỉnh card -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-[#DC2626]"></div>

        <!-- 1. Icon phong bì có dấu X -->
        <div class="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto text-[#DC2626] relative">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
          <!-- Badge X nhỏ ở góc -->
          <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-[#DC2626] text-white rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
            <svg class="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        </div>

        <!-- 2. Tiêu đề -->
        <h1 class="font-bold text-2xl text-slate-800 mt-5">Mã chưa đúng</h1>

        <!-- 3. Mô tả -->
        <p class="text-sm text-slate-500 mt-2 leading-relaxed">
          Vui lòng kiểm tra lại mã đã nhập cho tài khoản <br>
          <span class="font-semibold text-slate-700">an***@gmail.com</span>
        </p>

        <!-- 4. 6 ô nhập số (48×56px, shake-error, viền đỏ, nền đỏ nhạt) -->
        <div class="flex justify-center items-center gap-2 my-6 shake-error">
          <div class="w-12 h-14 rounded-lg bg-[#FEF2F2] border-2 border-[#DC2626] text-rose-700 text-2xl font-semibold flex items-center justify-center shadow-inner">
            8
          </div>
          <div class="w-12 h-14 rounded-lg bg-[#FEF2F2] border-2 border-[#DC2626] text-rose-700 text-2xl font-semibold flex items-center justify-center shadow-inner">
            5
          </div>
          <div class="w-12 h-14 rounded-lg bg-[#FEF2F2] border-2 border-[#DC2626] text-rose-700 text-2xl font-semibold flex items-center justify-center shadow-inner">
            2
          </div>
          <div class="w-12 h-14 rounded-lg bg-[#FEF2F2] border-2 border-[#DC2626] text-rose-700 text-2xl font-semibold flex items-center justify-center shadow-inner">
            1
          </div>
          <div class="w-12 h-14 rounded-lg bg-[#FEF2F2] border-2 border-[#DC2626] text-rose-700 text-2xl font-semibold flex items-center justify-center shadow-inner">
            7
          </div>
          <div class="w-12 h-14 rounded-lg bg-[#FEF2F2] border-2 border-[#DC2626] text-rose-700 text-2xl font-semibold flex items-center justify-center shadow-inner">
            3
          </div>
        </div>

        <!-- 5. Dòng đỏ cảnh báo -->
        <div class="flex items-center justify-center gap-1.5 mb-6 text-xs text-[#DC2626] font-medium bg-rose-50/80 py-2 px-3 rounded-lg border border-rose-100/80">
          <svg class="w-4 h-4 flex-shrink-0 text-[#DC2626]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Mã chưa đúng. Bạn còn 4 lần thử.</span>
        </div>

        <!-- 6. Nút "Thử lại" -->
        <button type="button" class="w-full h-10 bg-[#0284C7] hover:bg-[#0369a1] active:scale-[0.99] text-white font-medium text-sm rounded-lg transition-all shadow-sm flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Thử lại
        </button>

        <!-- 7. Gửi lại sau đếm ngược -->
        <div class="mt-4 text-xs text-slate-500 flex items-center justify-center gap-1">
          <span>Chưa nhận được mã?</span>
          <span class="text-[#94A3B8] font-medium flex items-center gap-1">
            <svg class="w-3.5 h-3.5 inline text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Gửi lại sau 00:42
          </span>
        </div>

        <!-- Phân cách nhẹ -->
        <div class="w-full h-[1px] bg-slate-100 my-5"></div>

        <!-- 8. Link quay lại đăng ký -->
        <div>
          <a href="#" class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Quay lại đăng ký
          </a>
        </div>

      </div>

      <!-- Trust Badge mỏng dưới card -->
      <div class="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
        <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
        <span>Bảo mật kết nối TLS 256-bit chuẩn thương mại điện tử</span>
      </div>

    </div>

  </main>

  <!-- AUTH FOOTER -->
  <footer class="w-full border-t border-slate-200/80 bg-white py-4 px-4 text-xs text-slate-500">
    <div class="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
      <div>
        © 2026 Vibe Mart. Mọi quyền được bảo lưu.
      </div>
      <div class="flex items-center gap-6">
        <a href="#" class="hover:text-slate-800 transition-colors">Điều khoản dịch vụ</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-slate-800 transition-colors">Chính sách bảo mật</a>
        <span class="text-slate-300">•</span>
        <a href="#" class="hover:text-slate-800 transition-colors">Trung tâm trợ giúp</a>
      </div>
    </div>
  </footer>

</body>
</html>