"use client";

import React from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useMyStore } from "@/hooks/useMyStore";

/**
 * SellerBannedBanner – Banner cảnh báo toàn cục khi gian hàng bị Khóa / Cấm (BANNED).
 * Hiển thị ở đầu trang Kênh Người Bán, giải thích rõ các quyền bị hạn chế và hướng dẫn hỗ trợ.
 */
export function SellerBannedBanner() {
  const { isBanned, storeName } = useMyStore();

  if (!isBanned) return null;

  return (
    <div
      role="alert"
      className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/50 border border-rose-200/90 shadow-sm flex flex-col md:flex-row md:items-start gap-4 animate-in fade-in-50 duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
        <MaterialSymbol name="lock" size="[22px]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4 className="font-bold text-rose-950 text-sm md:text-base">
            Gian hàng &quot;{storeName || "Của bạn"}&quot; đang bị TẠM KHÓA / CẤM HOẠT ĐỘNG
          </h4>
          <span className="px-2 py-0.5 rounded-full bg-rose-200/90 text-rose-800 text-[11px] font-extrabold uppercase tracking-wide">
            ĐÃ BỊ KHÓA
          </span>
        </div>

        <p className="text-xs text-rose-800 leading-relaxed">
          Gian hàng đã bị khóa bởi Quản trị viên sàn do vi phạm chính sách hoặc đang trong diện kiểm soát.
          Bạn vẫn có thể đăng nhập để theo dõi đơn hàng cũ, đối soát ví và kiểm tra danh mục sản phẩm, nhưng{" "}
          <strong className="font-bold text-rose-950">
            mọi quyền kinh doanh gồm: thêm sản phẩm mới, chỉnh sửa sản phẩm, đăng ký Flash Sale và tạo voucher đều bị vô hiệu hóa
          </strong>.
        </p>

        <div className="mt-2.5 pt-2 border-t border-rose-200/60 flex flex-wrap items-center gap-4 text-xs font-medium text-rose-900">
          <div className="flex items-center gap-1.5 text-rose-700">
            <MaterialSymbol name="support_agent" size="[16px]" className="text-rose-600" />
            <span>Liên hệ hỗ trợ sàn: <strong className="font-bold text-rose-900">support@vibemart.vn</strong> (Hotline: 1900 6868)</span>
          </div>
          <span className="text-rose-300 hidden md:inline">|</span>
          <span className="text-[11px] text-rose-600">Trạng thái áp dụng theo Điều khoản dịch vụ Người Bán Vibe Mart</span>
        </div>
      </div>
    </div>
  );
}
