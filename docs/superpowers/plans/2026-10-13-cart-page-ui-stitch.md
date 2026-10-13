<!DOCTYPE html><html lang="vi" style=""><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Giỏ hàng - Vibe Mart</title>
<link href="https://fonts.googleapis.com" rel="preconnect">
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
<style>
@layer base { 
  html, body { margin: 0; padding: 0; } 
  body { overscroll-behavior: none; } 
  main > :first-child { margin-top: 0 !important; } 
  main > :last-child { margin-bottom: 0 !important; } 
} 
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
</style>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#006194",
        "primary-container": "#007bb9",
        "primary-fixed": "#cce5ff",
        "primary-brand": "#0284C7",
        "secondary": "#006c49",
        "secondary-fixed": "#6ffbbe",
        "tertiary": "#ba0035",
        "tertiary-container": "#FFE4E6",
        "surface": "#FAF8FF",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3ff",
        "surface-container": "#eaedff",
        "surface-container-high": "#e2e7ff",
        "on-surface": "#131b2e",
        "on-surface-variant": "#3f4850",
        "outline": "#707881",
        "outline-variant": "#bfc7d2"
      },
      fontFamily: {
        sans: ["Be Vietnam Pro", "sans-serif"]
      }
    }
  }
};
</script>
</head>
<body class="bg-[#F4F6F9] font-sans text-on-surface antialiased selection:bg-sky-100 selection:text-sky-800">
<!-- HEADER CHUẨN STOREFRONT VIBE MART -->
<header class="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-slate-100">
<!-- Top bar tiện ích -->
<div class="border-b border-slate-100 bg-[#F8FAFC] text-[11px] text-slate-600 py-1.5 hidden sm:block">
<div class="max-w-[1240px] mx-auto px-4 lg:px-8 flex items-center justify-between font-medium">
<div class="flex items-center gap-3">
<a class="hover:text-[#0284C7] transition-colors" href="#">Kênh Người Bán</a>
<span class="text-slate-300">|</span>
<a class="hover:text-[#0284C7] transition-colors" href="#">Trở thành Người bán Vibe Mart</a>
<span class="text-slate-300">|</span>
<a class="hover:text-[#0284C7] transition-colors flex items-center gap-1" href="#">
<span class="material-symbols-outlined text-[13px]">download</span> Tải ứng dụng
        </a>
<span class="text-slate-300">|</span>
<span class="flex items-center gap-1.5">
<span class="">Kết nối:</span>
<a class="hover:text-[#0284C7] font-semibold" href="#">Facebook</a>
<span class="text-slate-300">,</span>
<a class="hover:text-[#0284C7] font-semibold" href="#">Zalo</a>
</span>
</div>
<div class="flex items-center gap-3">
<a class="hover:text-[#0284C7] flex items-center gap-1 transition-colors" href="tel:19008888">
<span class="material-symbols-outlined text-[14px] text-[#0284C7]">headset_mic</span> Hỗ trợ 1900 8888
        </a>
<span class="text-slate-300">|</span>
<div class="flex items-center gap-1 cursor-pointer hover:text-[#0284C7]">
<span class="material-symbols-outlined text-[14px]">language</span>
<span class="">Tiếng Việt / VND</span>
<span class="material-symbols-outlined text-[12px]">expand_more</span>
</div>
</div>
</div>
</div>
<!-- Main header -->
<div class="max-w-[1240px] mx-auto px-4 lg:px-8 py-3">
<div class="flex items-center justify-between gap-6">
<div class="flex items-center gap-4 shrink-0">
<a class="flex items-center gap-2 group" href="#">
<img alt="Vibe Mart" class="h-9 w-auto object-contain transition-transform group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy79OcQcBJqBYuWsbyxBHYG_KNTVmWUtuHm6cTWSUHMBCklMREHkj1lZP61HP8UyknE3FygOx0-qIyt6jxOYDQsHbaurQZv4jMriUjeg8sqWiHGF8PtKwlT7eZUFIHvua7B0g0cH6uZtuUaE5GAYl6H6MOtdER8sYZ481KAE3Wc8k07ggWk2b8lR5VRRTqyRtEXbvHt-m0IIpNDkY_5V_O6G9qr1YeQr4Dx_mU3jzZXLWoXq_7bgv4im9x5rhOCKEOPgU">
</a>
<div class="h-6 w-px bg-slate-200 hidden sm:block"></div>
<span class="font-medium text-slate-800 hidden sm:block tracking-tight text-base">Giỏ hàng</span>
</div>
<!-- Search bar -->
<div class="flex-1 max-w-2xl mx-2">
<div class="relative flex items-center">
<input class="w-full h-10 pl-4 pr-12 rounded-lg bg-slate-100 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white text-xs sm:text-sm border border-transparent transition-all" placeholder="Tìm sản phẩm, thương hiệu hoặc deal hot..." type="text">
<button class="absolute right-1 top-1 h-8 px-3.5 bg-[#0284C7] hover:bg-sky-700 text-white rounded-md flex items-center justify-center transition-colors shadow-sm" type="button">
<span class="material-symbols-outlined text-[18px]">search</span>
</button>
</div>
</div>
<!-- User actions -->
<div class="flex items-center gap-3 sm:gap-4 shrink-0">
<!-- Notification -->
<a class="relative p-2 text-slate-600 hover:text-[#0284C7] transition-colors rounded-full hover:bg-slate-100 flex items-center justify-center" href="#" title="Thông báo">
<span class="material-symbols-outlined text-2xl">notifications</span>
<span class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
</a>
<!-- Cart button with badge -->

<!-- VIP User -->
<div class="flex items-center gap-2 pl-2 border-l border-slate-200">
<div class="text-right hidden md:block">
<div class="text-xs text-slate-900 leading-tight font-semibold">Minh Thư</div>
<div class="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">workspace_premium</span>
              Thành viên VIP
            </div>
</div>
<img alt="Minh Thư" class="w-8 h-8 rounded-full object-cover ring-2 ring-[#0284C7]/20" src="https://lh3.googleusercontent.com/aida/AEtjO1Wwf88_26XJ-0gblbzI6RDeUiMvKdTX2axTaCcfQvZC-MwX_A0uVbQKucYlUzuCxZZ8UrEAucYloaJ47EeT80zyw0pcoJtkZQIOAmGKxe0NO5gZM2iYPPolRMJ-WJNHF6zS4kWi-BMTQivIRo40cTJU9VCijXF0JOgKuu063WUtxUr9q169kG4-TaBxMUxz_vF0y1m6iye_Ijswg2fAL3ug4t02pjtwhmfI9C2RaXpFjkE-voV2T8BTY90W">
</div>
</div>
</div>
</div>
<!-- Subnav -->
<div class="border-t border-slate-100 bg-white hidden md:block">
<div class="max-w-[1240px] mx-auto px-4 lg:px-8 flex items-center gap-7 text-xs font-medium text-slate-700 py-2 overflow-x-auto">
<a class="hover:text-[#0284C7] transition-colors whitespace-nowrap" href="#">Trang chủ</a>
<a class="text-rose-600 font-semibold hover:text-rose-700 transition-colors flex items-center gap-1 whitespace-nowrap" href="#">
<span class="material-symbols-outlined text-[15px] fill-current" style="font-variation-settings: 'FILL' 1;">bolt</span> Flash Sale
      </a>
<a class="hover:text-[#0284C7] transition-colors whitespace-nowrap" href="#">Hàng mới về</a>
<a class="hover:text-[#0284C7] transition-colors whitespace-nowrap" href="#">Thương hiệu nổi bật</a>
<a class="hover:text-[#0284C7] transition-colors whitespace-nowrap" href="#">Bán chạy</a>
<a class="hover:text-[#0284C7] transition-colors flex items-center gap-1 text-emerald-700 font-semibold whitespace-nowrap" href="#">
<span class="material-symbols-outlined text-[14px]">confirmation_number</span> Voucher &amp; Khuyến mãi
      </a>
</div>
</div>
</header>
<!-- MAIN CONTENT -->
<main class="w-full min-h-screen pt-36 md:pt-40 pb-10">
<div class="max-w-[1240px] mx-auto px-4 lg:px-8 space-y-4">
<!-- Switch View Controls & Demo Actions -->
<div class="flex items-center justify-between pb-1 text-xs">
<!-- Breadcrumb -->
<nav class="flex items-center gap-1.5 text-slate-500 font-medium">
<a class="hover:text-[#0284C7] transition-colors" href="#">Trang chủ</a>
<span class="text-slate-300">/</span>
<span class="text-slate-800 font-semibold">Giỏ hàng</span>
</nav>
<div class="flex items-center gap-2">
<button class="px-2.5 py-1 text-xs rounded border border-slate-300 hover:border-[#0284C7] hover:text-[#0284C7] bg-white transition-all text-slate-600 flex items-center gap-1 shadow-2xs" onclick="toggleEmptyState()">
<span class="material-symbols-outlined text-sm">remove_shopping_cart</span>
<span id="state-toggle-label" class="">Demo Giỏ hàng trống</span>
</button>
</div>
</div>
<!-- Empty State Container (Ẩn mặc định, hiển thị khi toggle) -->
<div class="bg-white rounded-xl shadow-xs border border-slate-200/80 p-12 text-center my-6 hidden" id="cart-empty-view">
<div class="w-24 h-24 mx-auto rounded-full bg-sky-50 flex items-center justify-center text-[#0284C7] mb-4">
<span class="material-symbols-outlined text-5xl">remove_shopping_cart</span>
</div>
<h3 class="text-lg font-bold text-slate-800 mb-1">Giỏ hàng của bạn còn trống</h3>
<p class="text-sm text-slate-500 max-w-md mx-auto mb-6">Hãy khám phá thêm hàng ngàn sản phẩm ưu đãi cực tốt trên Vibe Mart và chọn cho mình món đồ ưng ý nhé!</p>
<a class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0284C7] hover:bg-sky-700 text-white font-semibold text-sm transition-all shadow-sm" href="#">
<span class="material-symbols-outlined text-base">shopping_bag</span> Mua sắm ngay
      </a>
</div>
<!-- Active Cart Content View -->
<div class="space-y-4" id="cart-content-view">
<!-- BREADCRUMB & TIÊU ĐỀ -->
<div class="bg-gradient-to-r from-sky-50 via-white to-blue-50/40 p-4 sm:p-5 rounded-xl border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
<div>
<div class="flex flex-wrap items-center gap-2.5">
<h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Giỏ hàng
              <span class="text-sm font-normal text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">(5 sản phẩm)</span>
</h1>
<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
<span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">verified</span>
              100% hàng chính hãng • Đổi trả miễn phí 15 ngày
            </span>
</div>
<p class="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5">
<span class="material-symbols-outlined text-[#0284C7] text-base">local_shipping</span>
<span class="">Miễn phí vận chuyển cho đơn hàng từ <strong class="text-[#0284C7]">300.000₫</strong></span>
</p>
</div>
<div class="w-full md:w-64 bg-white/90 p-2.5 rounded-lg border border-sky-100 text-xs">
<div class="flex items-center justify-between text-[11px] mb-1">
<span class="font-medium text-slate-600">Tiến độ nhận Freeship Extra:</span>
<span class="font-bold text-emerald-600">Đã đạt!</span>
</div>
<div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
<div class="bg-emerald-500 h-full rounded-full w-full"></div>
</div>
<div class="text-[10px] text-slate-400 mt-1">Đã áp dụng mã vận chuyển giảm tối đa 30.000₫</div>
</div>
</div>
<!-- BẢNG TIÊU ĐỀ CỘT -->
<div class="bg-white rounded-xl border border-slate-200/80 shadow-xs px-4 sm:px-6 py-3.5 hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600 items-center">
<div class="col-span-5 flex items-center gap-3">
<input checked="" class="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] border-slate-300 cursor-pointer" id="check-all-top" type="checkbox">
<label class="cursor-pointer select-none text-slate-800" for="check-all-top">Chọn tất cả (4/5 sản phẩm)</label>
</div>
<div class="col-span-2 text-center">Đơn giá</div>
<div class="col-span-2 text-center">Số lượng</div>
<div class="col-span-2 text-right">Thành tiền</div>
<div class="col-span-1 text-center">Thao tác</div>
</div>
<!-- DANH SÁCH SẢN PHẨM PHÂN THEO SHOP -->
<!-- SHOP 1: UTC FASHION -->
<div class="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
<!-- Header shop 1 -->
<div class="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
<div class="flex items-center gap-3">
<input checked="" class="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] border-slate-300 cursor-pointer" type="checkbox">
<span class="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Mall</span>
<a class="font-bold text-slate-900 text-sm hover:text-[#0284C7] transition-colors flex items-center gap-1" href="#">
              UTC Fashion
              <span class="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
</a>
</div>
<div class="flex items-center gap-2">
<button class="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:border-[#0284C7] hover:text-[#0284C7] text-slate-600 transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-sm text-[#0284C7]">chat</span> Chat ngay
            </button>
<a class="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:border-slate-400 text-slate-700 transition-colors" href="#">
              Xem shop
            </a>
</div>
</div>
<!-- Sản phẩm của Shop 1 -->
<div class="divide-y divide-slate-100">
<!-- Shop 1 - Sản phẩm 1 -->
<div class="p-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-50/40 transition-colors">
<div class="md:col-span-5 flex items-start gap-3">
<input checked="" class="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] border-slate-300 mt-2 cursor-pointer" type="checkbox">
<img alt="Áo thun unisex cotton" class="w-18 h-18 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-200 shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkLMAPU0_rdMNSKfdc87Kvs3jqRrL8EeKCc58Z4bC4gTcQ2ND1OFfcqQW8p5-sY2zwl3xtDFUS8BpH7YEUH0iYzKdd4zH_75-OsdBWaHfbahO_N10yCt2Wr1a_s7XiDtF2F6urmsT2YMVWQgogPwQN1e3wjfNw9NYDAMX0D3TaI4clJAJw1_wK8kuZ2TEZ1s0ICG0lTK55BjDL8j1-MZDiKh6ms7QfLGasQM6Cq3_o">
<div class="space-y-1.5 flex-1 min-w-0">
<h3 class="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2 hover:text-[#0284C7] cursor-pointer">
                  Áo thun unisex cotton 100% UTC Basic form rộng thoáng mát
                </h3>
<div class="flex flex-wrap items-center gap-2">
<button class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 px-2 py-0.5 rounded transition-colors">
<span class="">Phân loại: Đen, M</span>
<span class="material-symbols-outlined text-[14px]">arrow_drop_down</span>
</button>
<span class="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">Đổi trả 15 ngày</span>
</div>
</div>
</div>
<!-- Đơn giá -->
<div class="md:col-span-2 text-left md:text-center">
<span class="md:hidden text-xs text-slate-400 mr-2">Đơn giá:</span>
<span class="text-xs text-slate-400 line-through mr-1 sm:block md:inline">189.000₫</span>
<span class="text-xs sm:text-sm font-bold text-slate-800">149.000₫</span>
</div>
<!-- Số lượng -->
<div class="md:col-span-2 flex items-center md:justify-center">
<span class="md:hidden text-xs text-slate-400 mr-3">Số lượng:</span>
<div class="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">-</button>
<input class="w-10 h-7 text-center text-xs font-semibold text-slate-800 border-x border-slate-200 focus:outline-none" readonly="" type="text" value="2">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">+</button>
</div>
</div>
<!-- Thành tiền -->
<div class="md:col-span-2 text-left md:text-right">
<span class="md:hidden text-xs text-slate-400 mr-2">Thành tiền:</span>
<span class="text-sm sm:text-base font-bold text-[#0284C7]">298.000₫</span>
</div>
<!-- Thao tác -->
<div class="md:col-span-1 flex items-center md:justify-center">
<button class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xóa sản phẩm">
<span class="material-symbols-outlined text-[19px]">delete</span>
</button>
</div>
</div>
<!-- Shop 1 - Sản phẩm 2 -->
<div class="p-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-50/40 transition-colors">
<div class="md:col-span-5 flex items-start gap-3">
<input checked="" class="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] border-slate-300 mt-2 cursor-pointer" type="checkbox">
<img alt="Áo khoác dù gió" class="w-18 h-18 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-200 shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk3af7mTB6uDnRIl8OjH0ksmSFkJIdWi-qoPO69hlzNT8ECkpJoa13QTazKAsVUjEXJh_EC6dZz1-YOuyYN_KMlBwBu_JmOHp0LDMsfr2EeH9LuWakzw-ahVHvNGNAxb1a-u73k0hBfUDdfaYHqGgwWhr14gM5La6YnybEmg3NZl2TLCRWo6UZbbrCfaX2OQBzH8zs2YDnZ-ld_RmXwzvA0Px1mDa3W8wbMw2UbfDw">
<div class="space-y-1.5 flex-1 min-w-0">
<h3 class="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2 hover:text-[#0284C7] cursor-pointer">
                  Áo khoác dù gió thể thao 2 lớp cản gió chống thấm nước cao cấp
                </h3>
<div class="flex flex-wrap items-center gap-2">
<button class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 px-2 py-0.5 rounded transition-colors">
<span class="">Phân loại: Xanh navy, L</span>
<span class="material-symbols-outlined text-[14px]">arrow_drop_down</span>
</button>
<span class="text-[10px] text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                    ⚠️ Chỉ còn 3 sản phẩm
                  </span>
</div>
</div>
</div>
<!-- Đơn giá -->
<div class="md:col-span-2 text-left md:text-center">
<span class="md:hidden text-xs text-slate-400 mr-2">Đơn giá:</span>
<span class="text-xs text-slate-400 line-through mr-1 sm:block md:inline">330.000₫</span>
<span class="text-xs sm:text-sm font-bold text-slate-800">265.000₫</span>
</div>
<!-- Số lượng -->
<div class="md:col-span-2 flex items-center md:justify-center">
<span class="md:hidden text-xs text-slate-400 mr-3">Số lượng:</span>
<div class="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">-</button>
<input class="w-10 h-7 text-center text-xs font-semibold text-slate-800 border-x border-slate-200 focus:outline-none" readonly="" type="text" value="1">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">+</button>
</div>
</div>
<!-- Thành tiền -->
<div class="md:col-span-2 text-left md:text-right">
<span class="md:hidden text-xs text-slate-400 mr-2">Thành tiền:</span>
<span class="text-sm sm:text-base font-bold text-[#0284C7]">265.000₫</span>
</div>
<!-- Thao tác -->
<div class="md:col-span-1 flex items-center md:justify-center">
<button class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xóa sản phẩm">
<span class="material-symbols-outlined text-[19px]">delete</span>
</button>
</div>
</div>
<!-- Shop 1 - Sản phẩm 3 (Chưa chọn) -->
<div class="p-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50/20 hover:bg-slate-50/50 transition-colors opacity-85">
<div class="md:col-span-5 flex items-start gap-3">
<input class="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] border-slate-300 mt-2 cursor-pointer" type="checkbox">
<img alt="Quần short thể thao nam" class="w-18 h-18 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-200 shrink-0 filter" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUxd0HJLErXbNUkrj75v6pa2U6erz7W7zj4hJ-XYn6nXvDPLZsf2bNAJDzrl4cz1Ke8OmtvZH29e6rMis0GJIi423JNo2NVfOm-Nk5itaHwHwIUsqXeAz9PO7NrkmSGHug4V6oaQLK-W2gazorauLTbOhKcwqiuwvP-fl_QSdRXUANSoCcjbko1EPYOEPEVhbxjX0fmQpIo7pOUoK7Iw4_cHbP0UiEGCbYbgmXIvZl">
<div class="space-y-1.5 flex-1 min-w-0">
<h3 class="text-xs sm:text-sm font-semibold text-slate-700 leading-snug line-clamp-2 hover:text-[#0284C7] cursor-pointer">
                  Quần short thể thao nam co giãn 4 chiều kháng khuẩn
                </h3>
<div class="flex flex-wrap items-center gap-2">
<button class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 px-2 py-0.5 rounded transition-colors">
<span class="">Phân loại: Xám, XL</span>
<span class="material-symbols-outlined text-[14px]">arrow_drop_down</span>
</button>
</div>
</div>
</div>
<!-- Đơn giá -->
<div class="md:col-span-2 text-left md:text-center">
<span class="md:hidden text-xs text-slate-400 mr-2">Đơn giá:</span>
<span class="text-xs text-slate-400 line-through mr-1 sm:block md:inline">150.000₫</span>
<span class="text-xs sm:text-sm font-bold text-slate-700">120.000₫</span>
</div>
<!-- Số lượng -->
<div class="md:col-span-2 flex items-center md:justify-center">
<span class="md:hidden text-xs text-slate-400 mr-3">Số lượng:</span>
<div class="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">-</button>
<input class="w-10 h-7 text-center text-xs font-semibold text-slate-800 border-x border-slate-200 focus:outline-none" readonly="" type="text" value="1">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">+</button>
</div>
</div>
<!-- Thành tiền -->
<div class="md:col-span-2 text-left md:text-right">
<span class="md:hidden text-xs text-slate-400 mr-2">Thành tiền:</span>
<span class="text-sm sm:text-base font-bold text-slate-600">120.000₫</span>
</div>
<!-- Thao tác -->
<div class="md:col-span-1 flex items-center md:justify-center">
<button class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xóa sản phẩm">
<span class="material-symbols-outlined text-[19px]">delete</span>
</button>
</div>
</div>
</div>
<!-- Chân Shop 1: Voucher -->
<div class="p-3.5 sm:px-6 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
<div class="flex items-center gap-2 text-slate-700">
<span class="material-symbols-outlined text-rose-500 text-[18px]">loyalty</span>
<span class="">Voucher của Shop: <strong class="text-rose-600 font-semibold">Giảm 15k đơn 250k</strong></span>
</div>
<button class="text-[#0284C7] font-semibold hover:underline flex items-center gap-0.5">
            Chọn hoặc nhập mã <span class="material-symbols-outlined text-[15px]">chevron_right</span>
</button>
</div>
</div>
<!-- SHOP 2: TECHZONE OFFICIAL -->
<div class="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
<!-- Header shop 2 -->
<div class="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
<div class="flex items-center gap-3">
<input checked="" class="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] border-slate-300 cursor-pointer" type="checkbox">
<span class="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Mall</span>
<a class="font-bold text-slate-900 text-sm hover:text-[#0284C7] transition-colors flex items-center gap-1" href="#">
              TechZone Official
              <span class="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
</a>
</div>
<div class="flex items-center gap-2">
<button class="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:border-[#0284C7] hover:text-[#0284C7] text-slate-600 transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-sm text-[#0284C7]">chat</span> Chat ngay
            </button>
<a class="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:border-slate-400 text-slate-700 transition-colors" href="#">
              Xem shop
            </a>
</div>
</div>
<!-- Sản phẩm của Shop 2 -->
<div class="divide-y divide-slate-100">
<!-- Shop 2 - Sản phẩm 1 -->
<div class="p-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-50/40 transition-colors">
<div class="md:col-span-5 flex items-start gap-3">
<input checked="" class="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] border-slate-300 mt-2 cursor-pointer" type="checkbox">
<img alt="Tai nghe True Wireless" class="w-18 h-18 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-200 shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCd5sr8OUOjhpimHftUWCgbxrXEeWXMezqMX61WiQyrn5UpK6Sbe3K4YbdvA47CaGfbTZJNYLNZm6lWkmOGKNKP4sdqO4qiptv8g-yj-4iCOEJCXIPZEXbenXb57Ishqe7csNOIaSErkOOuoYxQusthe2yPJU9fsMnGL8S3gCnWSPrQ7YHvpJ1hxm7z5Qtb9GNek5dICYipIoi8qSomPvCjod_jBiMDpvCdKfpX4sl8">
<div class="space-y-1.5 flex-1 min-w-0">
<h3 class="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2 hover:text-[#0284C7] cursor-pointer">
                  Tai nghe True Wireless ANC thể thao chống ồn chủ động
                </h3>
<div class="flex flex-wrap items-center gap-2">
<button class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 px-2 py-0.5 rounded transition-colors">
<span class="">Phân loại: Trắng ngọc</span>
<span class="material-symbols-outlined text-[14px]">arrow_drop_down</span>
</button>
<span class="text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded font-medium">Bảo hành 12 tháng</span>
</div>
</div>
</div>
<!-- Đơn giá -->
<div class="md:col-span-2 text-left md:text-center">
<span class="md:hidden text-xs text-slate-400 mr-2">Đơn giá:</span>
<span class="text-xs text-slate-400 line-through mr-1 sm:block md:inline">550.000₫</span>
<span class="text-xs sm:text-sm font-bold text-slate-800">299.000₫</span>
</div>
<!-- Số lượng -->
<div class="md:col-span-2 flex items-center md:justify-center">
<span class="md:hidden text-xs text-slate-400 mr-3">Số lượng:</span>
<div class="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">-</button>
<input class="w-10 h-7 text-center text-xs font-semibold text-slate-800 border-x border-slate-200 focus:outline-none" readonly="" type="text" value="1">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">+</button>
</div>
</div>
<!-- Thành tiền -->
<div class="md:col-span-2 text-left md:text-right">
<span class="md:hidden text-xs text-slate-400 mr-2">Thành tiền:</span>
<span class="text-sm sm:text-base font-bold text-[#0284C7]">299.000₫</span>
</div>
<!-- Thao tác -->
<div class="md:col-span-1 flex items-center md:justify-center">
<button class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xóa sản phẩm">
<span class="material-symbols-outlined text-[19px]">delete</span>
</button>
</div>
</div>
<!-- Shop 2 - Sản phẩm 2 -->
<div class="p-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-50/40 transition-colors">
<div class="md:col-span-5 flex items-start gap-3">
<input checked="" class="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] border-slate-300 mt-2 cursor-pointer" type="checkbox">
<img alt="Tai nghe chụp tai Bluetooth" class="w-18 h-18 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-200 shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJOXw2JXXYq13tyb0yJLhwnrC20Qzul3PNy_OyRvH8Rmn1KgnSn4PmKddjDcs4lzKt6GnKOJh47cP756pMHyQZXg5OS_V_O-2NsPfrqTW3MX895TK9IsU5g6uFpYDNncdw0BMbTIYhO11dmxw9nxO5WWMNNizXvGQEJueGsxceXaVIfkhxDV9mi-35DKTw9N8z3vDRWs0S-1_71v7PPlpDy8oJ1kV9e1s1-4g-Ynrh">
<div class="space-y-1.5 flex-1 min-w-0">
<h3 class="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2 hover:text-[#0284C7] cursor-pointer">
                  Tai nghe chụp tai Bluetooth khử tiếng ồn Gaming RGB Vibe Pro
                </h3>
<div class="flex flex-wrap items-center gap-2">
<button class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 px-2 py-0.5 rounded transition-colors">
<span class="">Phân loại: Đen Titan</span>
<span class="material-symbols-outlined text-[14px]">arrow_drop_down</span>
</button>
<span class="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
<span class="material-symbols-outlined text-[12px] fill-current" style="font-variation-settings: 'FILL' 1;">bolt</span> Flash Deal
                  </span>
</div>
</div>
</div>
<!-- Đơn giá -->
<div class="md:col-span-2 text-left md:text-center">
<span class="md:hidden text-xs text-slate-400 mr-2">Đơn giá:</span>
<span class="text-xs text-slate-400 line-through mr-1 sm:block md:inline">520.000₫</span>
<span class="text-xs sm:text-sm font-bold text-slate-800">385.000₫</span>
</div>
<!-- Số lượng -->
<div class="md:col-span-2 flex items-center md:justify-center">
<span class="md:hidden text-xs text-slate-400 mr-3">Số lượng:</span>
<div class="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">-</button>
<input class="w-10 h-7 text-center text-xs font-semibold text-slate-800 border-x border-slate-200 focus:outline-none" readonly="" type="text" value="1">
<button class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm">+</button>
</div>
</div>
<!-- Thành tiền -->
<div class="md:col-span-2 text-left md:text-right">
<span class="md:hidden text-xs text-slate-400 mr-2">Thành tiền:</span>
<span class="text-sm sm:text-base font-bold text-[#0284C7]">385.000₫</span>
</div>
<!-- Thao tác -->
<div class="md:col-span-1 flex items-center md:justify-center">
<button class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xóa sản phẩm">
<span class="material-symbols-outlined text-[19px]">delete</span>
</button>
</div>
</div>
</div>
<!-- Chân Shop 2: Voucher -->
<div class="p-3.5 sm:px-6 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
<div class="flex items-center gap-2 text-slate-700">
<span class="material-symbols-outlined text-rose-500 text-[18px]">loyalty</span>
<span class="">Voucher của Shop: <strong class="text-rose-600 font-semibold">Giảm 30k đơn 500k</strong></span>
</div>
<button class="text-[#0284C7] font-semibold hover:underline flex items-center gap-0.5">
            Chọn hoặc nhập mã <span class="material-symbols-outlined text-[15px]">chevron_right</span>
</button>
</div>
</div>
</div>
<!-- SECTION GỢI Ý: CÓ THỂ BẠN CŨNG THÍCH -->
<div class="pt-6">
<div class="flex items-center justify-between mb-4">
<h2 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
<span class="w-1.5 h-5 bg-[#0284C7] rounded-full inline-block"></span>
          CÓ THỂ BẠN CŨNG THÍCH
        </h2>
<a class="text-xs font-semibold text-[#0284C7] hover:underline flex items-center gap-0.5" href="#">
          Xem tất cả <span class="material-symbols-outlined text-sm">chevron_right</span>
</a>
</div>
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
<!-- Card 1 -->
<div class="bg-white rounded-xl border border-slate-200/80 p-3 hover:shadow-md transition-all group flex flex-col justify-between">
<div class="relative overflow-hidden rounded-lg aspect-square mb-2.5 bg-slate-100">
<img alt="Bình giữ nhiệt inox 304" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3Km3wbrgXSC2sdmwpDV457LhuLJLskyNilVdubhBNotk8CB-U4ARzT6e3dqz-ZLRlfvhTmCp-zGgP1b80SO1hyWP5EfLKgA_aW-Eyy6qsX5uAfLTDbaZz5sSDMskU9gmDdtYMt8HgPajz9WNdrbzVgRVfPYG6RaAxYULT9KeH1hw3yooJl7c9mkxGNfx5L7sWFFvVOE3UoMGkr7_lmHt0ch2Hwm1_r1XYxLqlwV93">
<span class="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-32%</span>
</div>
<div>
<h3 class="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#0284C7] transition-colors mb-1.5">
              Bình giữ nhiệt inox 304 cao cấp 800ml giữ nóng lạnh 24h
            </h3>
<div class="flex items-center gap-1 text-[11px] text-amber-500 mb-1">
<span class="material-symbols-outlined text-[13px] fill-current" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-bold text-slate-700">4.9</span>
<span class="text-slate-400">(1.2k)</span>
</div>
<div class="flex items-baseline gap-1.5 mb-1">
<span class="text-sm font-bold text-[#0284C7]">168.000₫</span>
<span class="text-[11px] text-slate-400 line-through">249.000₫</span>
</div>
<div class="text-[10px] text-slate-400 flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">location_on</span> Hà Nội
            </div>
</div>
</div>
<!-- Card 2 -->
<div class="bg-white rounded-xl border border-slate-200/80 p-3 hover:shadow-md transition-all group flex flex-col justify-between">
<div class="relative overflow-hidden rounded-lg aspect-square mb-2.5 bg-slate-100">
<img alt="Chuột không dây Silent" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0b5sdDRty59NOikEXzKJQqf2RSpgqd6N7VO4DBwjKX7AYeiPO4nHB7i5v8ciAUd0uZ5y6b42yYvBhIFmFv5Nz_fvdcMaMIlACF3IcG6htN_wuexQ5f_D5uvuRAfICxTFETmnOu_t1jM8ghmVtVdCccOiLLc6jyWBjzi1ObK3BGVy4F3OowPsKqaWAstDdnm-GQHryZojzJhcYl_tew9TxYk0n5N_2izR9LQ7_8Pxe">
<span class="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-25%</span>
</div>
<div>
<h3 class="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#0284C7] transition-colors mb-1.5">
              Chuột không dây Silent chống ồn pin sạc công thái học Vibe Click
            </h3>
<div class="flex items-center gap-1 text-[11px] text-amber-500 mb-1">
<span class="material-symbols-outlined text-[13px] fill-current" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-bold text-slate-700">4.8</span>
<span class="text-slate-400">(856)</span>
</div>
<div class="flex items-baseline gap-1.5 mb-1">
<span class="text-sm font-bold text-[#0284C7]">185.000₫</span>
<span class="text-[11px] text-slate-400 line-through">250.000₫</span>
</div>
<div class="text-[10px] text-slate-400 flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">location_on</span> TP. Hồ Chí Minh
            </div>
</div>
</div>
<!-- Card 3 -->
<div class="bg-white rounded-xl border border-slate-200/80 p-3 hover:shadow-md transition-all group flex flex-col justify-between">
<div class="relative overflow-hidden rounded-lg aspect-square mb-2.5 bg-slate-100">
<img alt="Giá đỡ laptop nhôm gập" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuACdFgi21Qt-lTz7HJelkwCgNzTfqR_xY8tf6lTiASDxqyaeNMIGI_EgrYYdU8aZcUvc8f5TKvdkoz0r0a9lzGDDgqHnSn3HSrq1Q9UdE6glBvsmfkamRJgOmyXNAlTNcU0jz13T-YP5-mFMCcYDLvpdA_1-yIvkkwzdtdv5krdeXK5cTz1obvD6ktUBsekicsfVcm_UGqXj1pDxm-7gIhKW45njSC-BnGR-r2gXs2m">
<span class="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-40%</span>
</div>
<div>
<h3 class="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#0284C7] transition-colors mb-1.5">
              Giá đỡ laptop nhôm nguyên khối gập gọn tản nhiệt đa góc độ
            </h3>
<div class="flex items-center gap-1 text-[11px] text-amber-500 mb-1">
<span class="material-symbols-outlined text-[13px] fill-current" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-bold text-slate-700">5.0</span>
<span class="text-slate-400">(3.4k)</span>
</div>
<div class="flex items-baseline gap-1.5 mb-1">
<span class="text-sm font-bold text-[#0284C7]">129.000₫</span>
<span class="text-[11px] text-slate-400 line-through">215.000₫</span>
</div>
<div class="text-[10px] text-slate-400 flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">location_on</span> Đà Nẵng
            </div>
</div>
</div>
<!-- Card 4 -->
<div class="bg-white rounded-xl border border-slate-200/80 p-3 hover:shadow-md transition-all group flex flex-col justify-between">
<div class="relative overflow-hidden rounded-lg aspect-square mb-2.5 bg-slate-100">
<img alt="Balo laptop chống thấm" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5VyX6dpEj1WsdsHmJMSgnSwBgfpKRcLgnnuuriK88mOVQizfZCgLkceIpH3PYj7wqwz_W69oq-zMb-wH6RwO4qn5kywObSAypS6zDWMtxJmLZ2GRj-Dlp0pyMDFh1JCWKnCH2pC-Oda8AkiD6XPC3LoUbghkoEQQq6OtSpjTmWh648zK_TNzKAGZDaJ1tJx_sKUux15_IpkL0fssLglYhZB9XxelNU2h0_buDaVH4">
<span class="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-18%</span>
</div>
<div>
<h3 class="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#0284C7] transition-colors mb-1.5">
              Balo laptop 15.6 inch chống sốc chống thấm nước đa năng
            </h3>
<div class="flex items-center gap-1 text-[11px] text-amber-500 mb-1">
<span class="material-symbols-outlined text-[13px] fill-current" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-bold text-slate-700">4.7</span>
<span class="text-slate-400">(612)</span>
</div>
<div class="flex items-baseline gap-1.5 mb-1">
<span class="text-sm font-bold text-[#0284C7]">320.000₫</span>
<span class="text-[11px] text-slate-400 line-through">390.000₫</span>
</div>
<div class="text-[10px] text-slate-400 flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">location_on</span> TP. Hồ Chí Minh
            </div>
</div>
</div>
<!-- Card 5 -->
<div class="bg-white rounded-xl border border-slate-200/80 p-3 hover:shadow-md transition-all group flex flex-col justify-between">
<div class="relative overflow-hidden rounded-lg aspect-square mb-2.5 bg-slate-100">
<img alt="Đồng hồ thông minh 5ATM" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZiXeS_9uzVRCsEBtXZeona9aQad6h5ZHQxGX7TAtyfhn7OiEpV7r7sQIQjLsfXlXaUzyGkO9szXwOUybCDe-7ahiqL8fbyd6zvMb-X5_MGbWNpZKFErP9IBmKtEem6ZQPUauajMwHeumMlwN72hIB6tw9FWaewJA9wDgmNdRmRXUkrN0MmkmiWkSAeTxu7GHjggk2GX9GraniNoXaM3hkJO_fG40jQSvtsUFL7Tzw">
<span class="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-45%</span>
</div>
<div>
<h3 class="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#0284C7] transition-colors mb-1.5">
              Đồng hồ thông minh thể thao kháng nước 5ATM theo dõi sức khỏe
            </h3>
<div class="flex items-center gap-1 text-[11px] text-amber-500 mb-1">
<span class="material-symbols-outlined text-[13px] fill-current" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-bold text-slate-700">4.9</span>
<span class="text-slate-400">(2.1k)</span>
</div>
<div class="flex items-baseline gap-1.5 mb-1">
<span class="text-sm font-bold text-[#0284C7]">499.000₫</span>
<span class="text-[11px] text-slate-400 line-through">910.000₫</span>
</div>
<div class="text-[10px] text-slate-400 flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">location_on</span> Hà Nội
            </div>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- THANH THANH TOÁN DÍNH ĐÁY MÀN HÌNH (STICKY/FIXED TRÊN TRỤC Y) -->
<aside class="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-y border-slate-200/90 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] transition-all">
<div class="max-w-[1240px] mx-auto px-4 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
<!-- Khối Trái: Checkbox chọn tất cả & thao tác xóa -->
<div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
<div class="flex items-center gap-2">
<input checked="" class="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] border-slate-300 cursor-pointer" id="check-all-bottom" type="checkbox">
<label class="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer select-none" for="check-all-bottom">
          Chọn tất cả (4)
        </label>
</div>
<div class="flex items-center gap-3">
<button class="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium">Xóa</button>
<span class="text-slate-300">|</span>
<button class="text-xs text-slate-500 hover:text-[#0284C7] transition-colors font-medium">Bỏ chọn tất cả</button>
</div>
</div>
<!-- Khối Giữa: Voucher Vibe Mart -->
<div class="flex items-center gap-2 text-xs text-slate-700 w-full md:w-auto justify-between md:justify-center border-y md:border-y-0 border-slate-100 py-1.5 md:py-0">
<div class="flex items-center gap-2">
<div class="flex items-center gap-1 text-[#0284C7] font-semibold bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">sell</span>
<span class="">Giảm 25.000₫ Freeship Xtra</span>
</div>
</div>
<button class="text-[#0284C7] font-semibold hover:underline flex items-center gap-0.5 ml-1">
        Chọn mã <span class="material-symbols-outlined text-sm">chevron_right</span>
</button>
</div>
<!-- Khối Phải: Tổng tiền & Nút Mua Hàng -->
<div class="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto">
<div class="text-left md:text-right">
<div class="text-xs text-slate-600 flex items-baseline gap-1 md:justify-end flex-wrap">
<span class="">Tổng thanh toán (4 sản phẩm):</span>
<span class="text-lg sm:text-2xl font-bold text-[#0284C7] leading-none tracking-tight">1.247.000₫</span>
</div>
<div class="text-[11px] text-emerald-700 font-semibold mt-0.5">
          Tiết kiệm 85.000₫ <span class="text-slate-400 font-normal hidden sm:inline">(Đã kèm voucher &amp; Freeship)</span>
</div>
</div>
<button class="px-8 py-3 rounded-xl bg-[#0284C7] hover:bg-sky-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 shrink-0 flex items-center gap-2">
<span class="">Mua hàng</span>
<span class="material-symbols-outlined text-lg">arrow_forward</span>
</button>
</div>
</div>
</aside>
<!-- FOOTER CHUẨN STOREFRONT VIBE MART -->
<footer class="w-full bg-white border-t border-slate-200 text-slate-600 pt-12 pb-10">
<div class="max-w-[1240px] mx-auto px-4 lg:px-8">
<div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
<!-- Cột 1: Thông tin sàn -->
<div class="space-y-3">
<div class="flex items-center gap-2">
<img alt="Vibe Mart" class="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy79OcQcBJqBYuWsbyxBHYG_KNTVmWUtuHm6cTWSUHMBCklMREHkj1lZP61HP8UyknE3FygOx0-qIyt6jxOYDQsHbaurQZv4jMriUjeg8sqWiHGF8PtKwlT7eZUFIHvua7B0g0cH6uZtuUaE5GAYl6H6MOtdER8sYZ481KAE3Wc8k07ggWk2b8lR5VRRTqyRtEXbvHt-m0IIpNDkY_5V_O6G9qr1YeQr4Dx_mU3jzZXLWoXq_7bgv4im9x5rhOCKEOPgU">
<span class="text-lg font-bold text-[#0284C7] tracking-tight">Vibe Mart</span>
</div>
<p class="text-xs text-slate-500 leading-relaxed">
          Hệ sinh thái mua sắm trực tuyến thông minh, tiện lợi, cung cấp hàng triệu sản phẩm chất lượng cao với dịch vụ giao hàng nhanh toàn quốc.
        </p>
<div class="flex items-center gap-2 text-xs font-semibold text-slate-700">
<span class="material-symbols-outlined text-[#0284C7] text-base">verified</span>
<span class="">100% Hàng chính hãng • Đổi trả dễ dàng</span>
</div>
<div class="pt-1">
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-[11px] text-slate-600 border border-slate-200 font-medium">
<span class="material-symbols-outlined text-sm text-emerald-600">verified_user</span> Đã đăng ký Bộ Công Thương
          </span>
</div>
</div>
<!-- Cột 2: Chăm sóc khách hàng -->
<div class="space-y-3">
<h4 class="text-sm font-bold text-slate-900 tracking-tight">CHĂM SÓC KHÁCH HÀNG</h4>
<ul class="space-y-2 text-xs text-slate-500">
<li class=""><a class="hover:text-[#0284C7] transition-colors" href="#">Trung tâm trợ giúp Vibe Mart</a></li>
<li class=""><a class="hover:text-[#0284C7] transition-colors" href="#">Hướng dẫn đặt hàng &amp; thanh toán</a></li>
<li class=""><a class="hover:text-[#0284C7] transition-colors" href="#">Chính sách đổi trả &amp; bảo hành</a></li>
<li class=""><a class="hover:text-[#0284C7] transition-colors" href="#">Chính sách vận chuyển</a></li>
<li class="pt-1">
<div class="text-xs text-slate-700 font-semibold flex items-center gap-1">
<span class="material-symbols-outlined text-[16px] text-[#0284C7]">call</span>
<span class="">Hotline 24/7: <strong class="text-[#0284C7]">1900 8888</strong></span>
</div>
</li>
</ul>
</div>
<!-- Cột 3: Thanh toán & Vận chuyển -->
<div class="space-y-3">
<h4 class="text-sm font-bold text-slate-900 tracking-tight">THANH TOÁN &amp; VẬN CHUYỂN</h4>
<p class="text-xs text-slate-500">Đa dạng phương thức thanh toán an toàn và bảo mật tiêu chuẩn quốc tế.</p>
<div class="flex flex-wrap gap-2 pt-1">
<span class="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">Visa / Master</span>
<span class="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">Ví MoMo</span>
<span class="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">ZaloPay</span>
<span class="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">COD</span>
<span class="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">VNPay</span>
</div>
<div class="text-xs text-slate-500 pt-2">
<span class="font-medium text-slate-700">Đơn vị vận chuyển:</span> SPX, GHN, Viettel Post, J&amp;T
        </div>
</div>
<!-- Cột 4: Theo dõi & Tải app -->
<div class="space-y-3">
<h4 class="text-sm font-bold text-slate-900 tracking-tight">THEO DÕI &amp; TẢI ỨNG DỤNG</h4>
<p class="text-xs text-slate-500">Tải ứng dụng Vibe Mart để nhận ngay voucher giảm 50.000₫ cho đơn hàng đầu tiên.</p>
<div class="flex items-center gap-3 pt-1">
<a class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 font-medium transition-colors border border-slate-200" href="#">
<span class="material-symbols-outlined text-[16px]">phone_iphone</span> App Store
          </a>
<a class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 font-medium transition-colors border border-slate-200" href="#">
<span class="material-symbols-outlined text-[16px]">shop</span> Google Play
          </a>
</div>
<div class="flex items-center gap-3 pt-2">
<span class="text-xs text-slate-500">Kết nối:</span>
<a class="text-xs text-[#0284C7] font-semibold hover:underline" href="#">Facebook</a>
<span class="text-slate-300">•</span>
<a class="text-xs text-[#0284C7] font-semibold hover:underline" href="#">Zalo OA</a>
<span class="text-slate-300">•</span>
<a class="text-xs text-[#0284C7] font-semibold hover:underline" href="#">TikTok</a>
</div>
</div>
</div>
<!-- Bottom copyright -->
<div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
<p class="">© 2026 Vibe Mart. Tất cả quyền được bảo lưu.</p>
<div class="flex items-center gap-4">
<a class="hover:text-[#0284C7] transition-colors" href="#">Điều khoản dịch vụ</a>
<span class="text-slate-300">|</span>
<a class="hover:text-[#0284C7] transition-colors" href="#">Chính sách bảo mật</a>
<span class="text-slate-300">|</span>
<a class="hover:text-[#0284C7] transition-colors" href="#">Quy chế hoạt động</a>
</div>
</div>
</div>
</footer>
<!-- Interactive State Switcher Script -->
<script>
function toggleEmptyState() {
  const contentView = document.getElementById('cart-content-view');
  const emptyView = document.getElementById('cart-empty-view');
  const label = document.getElementById('state-toggle-label');
  
  if (contentView.classList.contains('hidden')) {
    contentView.classList.remove('hidden');
    emptyView.classList.add('hidden');
    label.innerText = 'Demo Giỏ hàng trống';
  } else {
    contentView.classList.add('hidden');
    emptyView.classList.remove('hidden');
    label.innerText = 'Xem lại Giỏ hàng có sản phẩm';
  }
}
</script>




</body></html>