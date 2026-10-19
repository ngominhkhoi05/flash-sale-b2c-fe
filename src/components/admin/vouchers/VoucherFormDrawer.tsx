"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AdminVoucher, VoucherDiscountType, VoucherScope } from "@/types/voucher";
import { VoucherCardPreview } from "./VoucherCardPreview";

export function toLocalDatetimeInputString(date?: Date | string | number | null): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const voucherFormSchema = z
  .object({
    code: z
      .string()
      .min(4, "Mã voucher tối thiểu 4 ký tự")
      .max(20, "Mã voucher tối đa 20 ký tự")
      .regex(/^[A-Z0-9_-]+$/, "Chỉ chứa ký tự in hoa, số, dấu gạch dưới hoặc gạch nối"),
    name: z.string().min(2, "Tên chương trình không được để trống").max(100),
    discountType: z.enum(["PERCENT", "FIXED"] as const),
    discountValue: z.number().min(1, "Mức giảm phải lớn hơn 0"),
    maxDiscountAmount: z.number().optional(),
    minOrderAmount: z.number().min(0, "Giá trị đơn hàng tối thiểu không hợp lệ"),
    totalCount: z.number().min(1, "Tổng số lượt phát hành tối thiểu là 1"),
    limitPerCustomer: z.number().min(1, "Giới hạn mỗi khách tối thiểu là 1"),
    startDate: z.string().min(1, "Thời gian bắt đầu không được để trống"),
    endDate: z.string().min(1, "Thời gian kết thúc không được để trống"),
    scope: z.enum(["ALL", "MALL", "NEW_USER"] as const),
    isPublic: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENT") {
        return data.discountValue >= 1 && data.discountValue <= 100;
      }
      return data.discountValue > 0;
    },
    {
      message: "Giảm theo % phải nằm trong khoảng từ 1% đến 100%",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) => {
      if (data.discountType === "PERCENT") {
        return data.maxDiscountAmount !== undefined && data.maxDiscountAmount > 0;
      }
      return true;
    },
    {
      message: "Vui lòng nhập mức giảm tối đa cho hình thức giảm theo %",
      path: ["maxDiscountAmount"],
    }
  )
  .refine(
    (data) => {
      return data.limitPerCustomer <= data.totalCount;
    },
    {
      message: "Giới hạn mỗi khách không được vượt quá tổng số lượt phát hành",
      path: ["limitPerCustomer"],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return !isNaN(start) && !isNaN(end) && end > start;
    },
    {
      message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      path: ["endDate"],
    }
  );

type VoucherFormValues = z.infer<typeof voucherFormSchema>;

interface VoucherFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VoucherFormValues) => void;
  initialData?: AdminVoucher | null;
  mode?: "create" | "edit";
}

export function VoucherFormDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}: VoucherFormDrawerProps) {
  const defaultStartDate = useMemo(() => toLocalDatetimeInputString(new Date()), []);
  const defaultEndDate = useMemo(
    () => toLocalDatetimeInputString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    []
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VoucherFormValues>({
    mode: "onChange",
    resolver: zodResolver(voucherFormSchema),
    defaultValues: {
      code: "VIBE-AUTUMN",
      name: "Ưu đãi Mùa Thu Sắm Sửa",
      discountType: "PERCENT",
      discountValue: 20,
      maxDiscountAmount: 60000,
      minOrderAmount: 300000,
      totalCount: 1000,
      limitPerCustomer: 1,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      scope: "ALL",
      isPublic: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code,
        name: initialData.name,
        discountType:
          initialData.discountType === "SHIPPING" || initialData.discountType === "COIN"
            ? "FIXED"
            : initialData.discountType,
        discountValue: initialData.discountValue,
        maxDiscountAmount: initialData.maxDiscountAmount || 0,
        minOrderAmount: initialData.minOrderAmount,
        totalCount: initialData.totalCount,
        limitPerCustomer: initialData.limitPerCustomer,
        startDate: toLocalDatetimeInputString(initialData.startDate) || defaultStartDate,
        endDate: toLocalDatetimeInputString(initialData.endDate) || defaultEndDate,
        scope: initialData.scope,
        isPublic: initialData.isPublic,
      });
    } else {
      reset({
        code: "",
        name: "",
        discountType: "PERCENT",
        discountValue: 20,
        maxDiscountAmount: 50000,
        minOrderAmount: 200000,
        totalCount: 1000,
        limitPerCustomer: 1,
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        scope: "ALL",
        isPublic: true,
      });
    }
  }, [initialData, reset, defaultStartDate, defaultEndDate]);

  // Watch for live preview
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() pattern hợp lệ
  const watchedCode = watch("code");
  const watchedType = watch("discountType");
  const watchedValue = watch("discountValue");
  const watchedMaxDiscount = watch("maxDiscountAmount");
  const watchedMinOrder = watch("minOrderAmount");
  const watchedScope = watch("scope");
  const watchedStartDate = watch("startDate");
  const watchedEndDate = watch("endDate");

  const isDateInvalid = Boolean(
    watchedStartDate &&
    watchedEndDate &&
    new Date(watchedEndDate).getTime() <= new Date(watchedStartDate).getTime()
  );

  const diffDays = isDateInvalid
    ? -1
    : Math.max(
        0,
        Math.round(
          (new Date(watchedEndDate).getTime() - new Date(watchedStartDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop scrim */}
      <div
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-surface-container-lowest h-screen flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        {/* Header */}
        <div className="p-space-lg flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant/30 sticky top-0 z-20">
          <div className="flex items-center gap-space-xs">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">
                {mode === "create" ? "add_circle" : "edit"}
              </span>
            </div>
            <div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface leading-tight">
                {mode === "create" ? "Tạo voucher sàn mới" : "Chỉnh sửa voucher sàn"}
              </h3>
              <p className="font-body-sm text-xs text-secondary">
                Thiết lập ngân sách trợ giá trực tiếp bởi Vibe Mart
              </p>
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-space-lg flex flex-col gap-space-lg flex-1">
          {/* Live Voucher Card Preview */}
          <div className="flex flex-col gap-2">
            <span className="font-label-sm text-xs font-semibold tracking-wider uppercase text-secondary">
              Xem trước thẻ voucher người dùng
            </span>
            <VoucherCardPreview
              code={watchedCode}
              daysRemaining={diffDays}
              discountType={watchedType as VoucherDiscountType}
              discountValue={watchedValue}
              maxDiscountAmount={watchedMaxDiscount}
              minOrderAmount={watchedMinOrder}
              scope={watchedScope as VoucherScope}
            />
          </div>

          {/* Form */}
          <form
            className="flex flex-col gap-space-md"
            id="voucher-drawer-form"
            onSubmit={handleSubmit((data) => {
              const start = new Date(data.startDate).getTime();
              const end = new Date(data.endDate).getTime();
              if (isNaN(start) || isNaN(end) || end <= start) {
                setError("endDate", {
                  type: "manual",
                  message: "Thời gian kết thúc phải sau thời gian bắt đầu",
                });
                return;
              }
              onSubmit(data);
              onClose();
            })}
          >
            {/* Mã voucher & Tên chương trình */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Mã voucher <span className="text-tertiary">*</span>
                </label>
                <input
                  {...register("code")}
                  className={`h-10 px-3 rounded-lg bg-surface-container-low font-data-tabular font-bold text-sm text-on-surface uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.code ? "border border-error" : ""
                  }`}
                  disabled={mode === "edit"}
                  onChange={(e) => {
                    setValue("code", e.target.value.toUpperCase());
                  }}
                  placeholder="VD: VIBEMART50"
                  type="text"
                />
                {errors.code ? (
                  <span className="text-xs text-error font-medium">
                    {errors.code.message}
                  </span>
                ) : (
                  <span className="text-label-sm text-[11px] text-secondary">
                    Viết hoa, 4-20 ký tự (A-Z, 0-9)
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Tên chương trình ưu đãi <span className="text-tertiary">*</span>
                </label>
                <input
                  {...register("name")}
                  className={`h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.name ? "border border-error" : ""
                  }`}
                  placeholder="VD: Khuyến mãi Flash Sale 10.10"
                  type="text"
                />
                {errors.name ? (
                  <span className="text-xs text-error font-medium">
                    {errors.name.message}
                  </span>
                ) : (
                  <span className="text-label-sm text-[11px] text-secondary">
                    Hiển thị trong ví voucher của khách
                  </span>
                )}
              </div>
            </div>

            {/* Loại giảm giá (Radio buttons) */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-xs font-semibold text-on-surface">
                Loại giảm giá <span className="text-tertiary">*</span>
              </label>
              <div className="grid grid-cols-2 gap-space-sm">
                <label
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    watchedType === "PERCENT"
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 bg-surface-container-low hover:bg-surface-container"
                  }`}
                >
                  <input
                    {...register("discountType")}
                    className="text-primary focus:ring-primary h-4 w-4"
                    type="radio"
                    value="PERCENT"
                  />
                  <div className="flex flex-col">
                    <span className="font-body-sm text-sm font-semibold text-on-surface">
                      Theo phần trăm (%)
                    </span>
                    <span className="text-label-sm text-[11px] text-secondary">
                      VD: Giảm 20% tối đa 60K
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    watchedType === "FIXED"
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 bg-surface-container-low hover:bg-surface-container"
                  }`}
                >
                  <input
                    {...register("discountType")}
                    className="text-primary focus:ring-primary h-4 w-4"
                    type="radio"
                    value="FIXED"
                  />
                  <div className="flex flex-col">
                    <span className="font-body-sm text-sm font-semibold text-on-surface">
                      Số tiền cố định (₫)
                    </span>
                    <span className="text-label-sm text-[11px] text-secondary">
                      VD: Giảm thẳng 50.000₫
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Mức giảm & Giảm tối đa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  {watchedType === "PERCENT" ? "Mức giảm (%)" : "Số tiền giảm (₫)"}{" "}
                  <span className="text-tertiary">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register("discountValue", { valueAsNumber: true })}
                    className={`w-full h-10 px-3 pr-8 rounded-lg bg-surface-container-low font-data-tabular font-semibold text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.discountValue ? "border border-error" : ""
                    }`}
                    type="number"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary font-medium font-data-tabular text-sm">
                    {watchedType === "PERCENT" ? "%" : "₫"}
                  </span>
                </div>
                {errors.discountValue && (
                  <span className="text-xs text-error font-medium">
                    {errors.discountValue.message}
                  </span>
                )}
              </div>

              {watchedType === "PERCENT" && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-xs font-semibold text-on-surface">
                    Mức giảm tối đa (₫) <span className="text-tertiary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register("maxDiscountAmount", { valueAsNumber: true })}
                      className={`w-full h-10 px-3 pr-8 rounded-lg bg-surface-container-low font-data-tabular font-semibold text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.maxDiscountAmount ? "border border-error" : ""
                      }`}
                      type="number"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary font-medium font-data-tabular text-sm">
                      ₫
                    </span>
                  </div>
                  {errors.maxDiscountAmount && (
                    <span className="text-xs text-error font-medium">
                      {errors.maxDiscountAmount.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Giá trị đơn hàng tối thiểu & Phạm vi áp dụng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Đơn hàng tối thiểu (₫) <span className="text-tertiary">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register("minOrderAmount", { valueAsNumber: true })}
                    className={`w-full h-10 px-3 pr-8 rounded-lg bg-surface-container-low font-data-tabular font-semibold text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.minOrderAmount ? "border border-error" : ""
                    }`}
                    type="number"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary font-medium font-data-tabular text-sm">
                    ₫
                  </span>
                </div>
                {errors.minOrderAmount && (
                  <span className="text-xs text-error font-medium">
                    {errors.minOrderAmount.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Phạm vi áp dụng
                </label>
                <select
                  {...register("scope")}
                  className="h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="ALL">Toàn sàn (Tất cả ngành hàng)</option>
                  <option value="MALL">Chỉ gian hàng Vibe Mall</option>
                  <option value="NEW_USER">Chỉ khách hàng mới</option>
                </select>
              </div>
            </div>

            {/* Số lượng phát hành & Giới hạn mỗi khách */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Tổng số lượt phát hành <span className="text-tertiary">*</span>
                </label>
                <input
                  {...register("totalCount", { valueAsNumber: true })}
                  className={`h-10 px-3 rounded-lg bg-surface-container-low font-data-tabular font-semibold text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.totalCount ? "border border-error" : ""
                  }`}
                  type="number"
                />
                {errors.totalCount && (
                  <span className="text-xs text-error font-medium">
                    {errors.totalCount.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs font-semibold text-on-surface">
                  Giới hạn mỗi khách (lượt) <span className="text-tertiary">*</span>
                </label>
                <select
                  {...register("limitPerCustomer", { valueAsNumber: true })}
                  className="h-10 px-3 rounded-lg bg-surface-container-low font-data-tabular font-semibold text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value={1}>1 lượt / tài khoản</option>
                  <option value={2}>2 lượt / tài khoản</option>
                  <option value={3}>3 lượt / tài khoản</option>
                  <option value={5}>5 lượt / tài khoản</option>
                </select>
              </div>
            </div>

            {/* Thời gian áp dụng: Từ ngày - Đến ngày */}
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-xs font-semibold text-on-surface">
                    Thời gian bắt đầu <span className="text-tertiary">*</span>
                  </label>
                  <input
                    {...register("startDate")}
                    min={mode === "create" ? defaultStartDate : undefined}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setValue("startDate", newStart, { shouldValidate: true });
                      if (newStart) {
                        const startTime = new Date(newStart).getTime();
                        const endTime = watchedEndDate ? new Date(watchedEndDate).getTime() : 0;
                        if (!endTime || startTime >= endTime) {
                          // Tự động đẩy endDate ra sau startDate 30 ngày
                          const nextEnd = new Date(startTime + 30 * 24 * 60 * 60 * 1000);
                          setValue("endDate", toLocalDatetimeInputString(nextEnd), { shouldValidate: true });
                          clearErrors("endDate");
                        } else {
                          clearErrors("endDate");
                        }
                      }
                    }}
                    className={`w-full h-10 px-3 rounded-lg bg-surface-container-low font-data-tabular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.startDate ? "border border-error" : ""
                    }`}
                    type="datetime-local"
                  />
                  {errors.startDate && (
                    <span className="text-xs text-error font-medium">
                      {errors.startDate.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-xs font-semibold text-on-surface">
                    Thời gian kết thúc <span className="text-tertiary">*</span>
                  </label>
                  <input
                    {...register("endDate")}
                    min={watchedStartDate || defaultStartDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setValue("endDate", newEnd, { shouldValidate: true });
                      if (newEnd && watchedStartDate) {
                        const startTime = new Date(watchedStartDate).getTime();
                        const endTime = new Date(newEnd).getTime();
                        if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
                          setError("endDate", {
                            type: "manual",
                            message: "Thời gian kết thúc phải sau thời gian bắt đầu",
                          });
                        } else {
                          clearErrors("endDate");
                        }
                      }
                    }}
                    className={`w-full h-10 px-3 rounded-lg bg-surface-container-low font-data-tabular text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.endDate || isDateInvalid ? "border border-error ring-1 ring-error" : ""
                    }`}
                    type="datetime-local"
                  />
                  {(errors.endDate || isDateInvalid) && (
                    <span className="text-xs text-error font-medium">
                      {errors.endDate?.message || "Thời gian kết thúc phải sau thời gian bắt đầu"}
                    </span>
                  )}
                </div>
              </div>

              {isDateInvalid && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-error/10 text-error text-xs font-medium">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>Thời gian kết thúc phải sau thời gian bắt đầu</span>
                </div>
              )}
            </div>

            {/* Checkbox Public Visibility */}
            <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-space-sm cursor-pointer border border-outline-variant/30">
              <input
                {...register("isPublic")}
                className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                id="isPublicBanner"
                type="checkbox"
              />
              <label
                className="flex flex-col cursor-pointer select-none"
                htmlFor="isPublicBanner"
              >
                <span className="font-body-sm text-xs font-semibold text-on-surface">
                  Hiển thị công khai trên banner trang chủ và giỏ hàng
                </span>
                <span className="text-label-sm text-[11px] text-secondary">
                  Người mua có thể tự do lưu mã trực tiếp vào ví voucher mà không cần nhập code
                </span>
              </label>
            </div>
          </form>
        </div>

        {/* Drawer Footer */}
        <div className="p-space-lg flex items-center justify-end gap-space-sm bg-surface-container-lowest border-t border-outline-variant/30 sticky bottom-0 z-20">
          <button
            className="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-sm font-medium hover:bg-surface-container-high transition-colors"
            onClick={onClose}
            type="button"
          >
            Hủy bỏ
          </button>
          <button
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-on-primary font-label-md text-sm font-semibold hover:bg-primary-container transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || isDateInvalid || Boolean(errors.endDate)}
            form="voucher-drawer-form"
            type="submit"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{mode === "create" ? "Tạo voucher" : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
