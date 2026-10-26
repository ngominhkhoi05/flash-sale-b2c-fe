"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdminFlashSaleSession, CreateFlashSaleSessionInput } from "@/types/flash-sale";

function getLocalDateStr(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getLocalISOString(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocalDateTime(dateTimeStr: string): number {
  if (!dateTimeStr) return NaN;
  const parts = dateTimeStr.split("T");
  if (parts.length !== 2) return NaN;
  const [datePart, timePart] = parts;
  const [year, month, day] = datePart.split("-").map(Number);
  const timeSubParts = timePart.split(":").map(Number);
  const hour = timeSubParts[0];
  const minute = timeSubParts[1];
  const second = timeSubParts[2] || 0;
  if (
    isNaN(year) || isNaN(month) || isNaN(day) ||
    isNaN(hour) || isNaN(minute)
  ) {
    return NaN;
  }
  return new Date(year, month - 1, day, hour, minute, second, 0).getTime();
}

const slotFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Tên phiên không được để trống (tối thiểu 3 ký tự)")
      .max(60, "Tên phiên tối đa 60 ký tự"),
    description: z.string().optional(),
    date: z.string().min(1, "Vui lòng chọn ngày tổ chức"),
    startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
    endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
    holdSeconds: z.coerce
      .number({ invalid_type_error: "Thời gian giữ hàng phải là số nguyên" })
      .int("Thời gian giữ hàng phải là số nguyên")
      .min(60, "Thời gian giữ hàng tối thiểu 60 giây (1 phút)")
      .max(1800, "Thời gian giữ hàng tối đa 1800 giây (30 phút)"),
    registrationDeadline: z.string().min(1, "Vui lòng chọn hạn cuối đăng ký sản phẩm"),
  })
  .superRefine((val, ctx) => {
    const now = new Date();
    const todayStr = getLocalDateStr(now);

    // 1. Ngày tổ chức không được là ngày trong quá khứ
    if (val.date && val.date < todayStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày tổ chức không được là ngày trong quá khứ",
        path: ["date"],
      });
    }

    // 2. Giờ bắt đầu hôm nay không được trong quá khứ
    if (val.date === todayStr && val.startTime) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = val.startTime.split(":").map(Number);
      if (sh * 60 + sm <= currentMinutes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Giờ bắt đầu hôm nay phải sau thời điểm hiện tại",
          path: ["startTime"],
        });
      }
    }

    // 3. Giờ kết thúc phải sau giờ bắt đầu
    if (val.startTime && val.endTime) {
      const [sh, sm] = val.startTime.split(":").map(Number);
      const [eh, em] = val.endTime.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (endMin <= startMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Giờ kết thúc phải sau giờ bắt đầu",
          path: ["endTime"],
        });
      } else if (endMin - startMin < 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Thời lượng phiên Flash Sale tối thiểu 30 phút",
          path: ["endTime"],
        });
      }
    }

    // 4. Hạn đăng ký cho người bán:
    // - Phải lớn hơn thời gian hiện tại
    // - Phải sớm hơn thời gian bắt đầu phiên mở bán
    if (val.registrationDeadline) {
      const deadlineTime = parseLocalDateTime(val.registrationDeadline);
      const nowTime = now.getTime();

      if (isNaN(deadlineTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng chọn hạn cuối đăng ký sản phẩm hợp lệ",
          path: ["registrationDeadline"],
        });
      } else if (deadlineTime <= nowTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hạn cuối đăng ký phải lớn hơn thời gian hiện tại",
          path: ["registrationDeadline"],
        });
      } else if (val.date && val.startTime) {
        const startDateTime = parseLocalDateTime(`${val.date}T${val.startTime}`);
        if (!isNaN(startDateTime) && deadlineTime >= startDateTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Hạn cuối đăng ký phải sớm hơn thời gian bắt đầu phiên mở bán",
            path: ["registrationDeadline"],
          });
        }
      }
    }
  });

type SlotFormValues = z.infer<typeof slotFormSchema>;

interface FlashSaleSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateFlashSaleSessionInput) => void;
  initialData?: AdminFlashSaleSession | null;
  existingSessions?: AdminFlashSaleSession[];
  defaultDate?: string;
  defaultTime?: string;
}

function FlashSaleSlotModalDialog({
  onClose,
  onSave,
  initialData,
  existingSessions = [],
  defaultDate,
  defaultTime,
}: Omit<FlashSaleSlotModalProps, "isOpen">) {
  const isEditing = Boolean(initialData);

  // Default values
  const defaultValues: SlotFormValues = useMemo(() => {
    if (initialData) {
      const [sh, eh] = initialData.timeRangeDisplay.split(" - ");
      return {
        name: initialData.name,
        description: initialData.description || "",
        date: initialData.date,
        startTime: sh || "12:00",
        endTime: eh || "14:00",
        holdSeconds: initialData.holdSeconds || 300,
        registrationDeadline: initialData.registrationDeadline
          ? initialData.registrationDeadline.substring(0, 16)
          : `${initialData.date}T10:00`,
      };
    }

    const now = new Date();
    const today = defaultDate || getLocalDateStr(now);

    let startTime = defaultTime || "12:00";
    if (!defaultTime && today === getLocalDateStr(now)) {
      const nextHour = now.getHours() + 3;
      if (nextHour >= 22) {
        const tomorrow = new Date(now.getTime() + 86400000);
        const tomorrowStr = getLocalDateStr(tomorrow);
        return {
          name: "",
          description: "",
          date: tomorrowStr,
          startTime: "10:00",
          endTime: "12:00",
          holdSeconds: 300,
          registrationDeadline: `${tomorrowStr}T08:00`,
        };
      } else {
        startTime = `${String(nextHour).padStart(2, "0")}:00`;
      }
    }

    const [h, m] = startTime.split(":").map(Number);
    const endHour = String(Math.min(h + 2, 23)).padStart(2, "0");
    const endTime = `${endHour}:${String(m).padStart(2, "0")}`;

    // Deadline mặc định 2 tiếng trước giờ mở bán
    const deadlineHour = String(Math.max(h - 2, 0)).padStart(2, "0");

    return {
      name: "",
      description: "",
      date: today,
      startTime,
      endTime,
      holdSeconds: 300,
      registrationDeadline: `${today}T${deadlineHour}:00`,
    };
  }, [initialData, defaultDate, defaultTime]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    trigger,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SlotFormValues>({
    resolver: zodResolver(slotFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // React Hook Form's watch() không tương thích với React Compiler
  // memoization, nhưng đây là pattern hợp lệ của RHF (xem rule
  // react-hooks/incompatible-library). Giữ nguyên, suppress warning.
  // eslint-disable-next-line react-hooks/incompatible-library
  const holdSec = watch("holdSeconds");
  const dateVal = watch("date");
  const startTimeVal = watch("startTime");
  const endTimeVal = watch("endTime");
  const regDeadlineVal = watch("registrationDeadline");

  // Re-trigger cross-field validations khi có field liên quan thay đổi
  useEffect(() => {
    if (isDirty) {
      if (regDeadlineVal) trigger("registrationDeadline");
      if (endTimeVal) trigger("endTime");
      if (startTimeVal) trigger("startTime");
    }
  }, [dateVal, startTimeVal, endTimeVal, regDeadlineVal, isDirty, trigger]);

  // Tính thời lượng
  const durationText = useMemo(() => {
    if (!startTimeVal || !endTimeVal) return "";
    const [sh, sm] = startTimeVal.split(":").map(Number);
    const [eh, em] = endTimeVal.split(":").map(Number);
    const diffMin = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMin <= 0) return "";
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    if (h > 0 && m > 0) return `(Thời lượng ${h} giờ ${m} phút)`;
    if (h > 0) return `(Thời lượng ${h} giờ)`;
    return `(Thời lượng ${m} phút)`;
  }, [startTimeVal, endTimeVal]);

  // Lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function onSubmit(values: SlotFormValues) {
    // 3. Kiểm tra trùng khung giờ với phiên khác trên cùng một ngày
    const overlappingSession = existingSessions.find((s) => {
      if (initialData && s.id === initialData.id) return false;
      if (s.date !== values.date) return false;

      const [sStart, sEnd] = s.timeRangeDisplay.split(" - ");
      const [vStartH, vStartM] = values.startTime.split(":").map(Number);
      const [vEndH, vEndM] = values.endTime.split(":").map(Number);
      const [eStartH, eStartM] = sStart.split(":").map(Number);
      const [eEndH, eEndM] = sEnd.split(":").map(Number);

      const vS = vStartH * 60 + vStartM;
      const vE = vEndH * 60 + vEndM;
      const eS = eStartH * 60 + eStartM;
      const eE = eEndH * 60 + eEndM;

      // Giao thoa khoảng thời gian: [vS, vE] và [eS, eE]
      return Math.max(vS, eS) < Math.min(vE, eE);
    });

    if (overlappingSession) {
      setError("startTime", {
        type: "manual",
        message: `Trùng lặp với phiên "${overlappingSession.name}" (${overlappingSession.timeRangeDisplay})`,
      });
      setError("endTime", {
        type: "manual",
        message: `Khung giờ này đã bị trùng lặp với phiên khác`,
      });
      toast.error("Trùng khung giờ mở bán!", {
        description: `Ngày ${values.date} đã có phiên "${overlappingSession.name}" trong khoảng ${overlappingSession.timeRangeDisplay}.`,
      });
      return;
    }

    onSave({
      name: values.name,
      description: values.description,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      holdSeconds: values.holdSeconds,
      registrationDeadline: values.registrationDeadline,
    });
  }

  // Chuyển giây sang phút hiển thị
  const holdMinutes = useMemo(() => {
    if (!holdSec || isNaN(holdSec)) return 5;
    return (Number(holdSec) / 60).toFixed(1).replace(".0", "");
  }, [holdSec]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-[2px] select-none">
      <div
        className="bg-surface-container-lowest w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-space-lg py-space-md bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="h-9 w-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                {isEditing ? "Chỉnh sửa khung giờ Flash Sale" : "Tạo khung giờ Flash Sale mới"}
              </h3>
              <span className="font-label-sm text-label-sm text-secondary">
                Cấu hình thời gian, ngưỡng khóa tồn kho và thời hạn nộp sản phẩm
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body (Form Fields) */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="p-space-lg flex flex-col gap-space-md max-h-[72vh] overflow-y-auto">
            {/* Field 1: Tên phiên */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                <span>
                  Tên phiên Flash Sale <span className="text-red-500">*</span>
                </span>
                <span className="font-label-sm text-label-sm text-secondary">Tối đa 60 ký tự</span>
              </label>
              <input
                {...register("name")}
                placeholder="VD: Siêu Sale Giờ Vàng 12:00"
                className={cn(
                  "h-10 px-3 rounded-lg border font-body-md text-body-md transition-all focus:outline-none",
                  errors.name
                    ? "border-red-500 ring-1 ring-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-red-500"
                    : "border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                )}
              />
              {errors.name && (
                <div className="flex items-center gap-1 text-red-600 text-xs font-semibold mt-1">
                  <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
                  <span>{errors.name.message}</span>
                </div>
              )}
            </div>

            {/* Field 2: Ngày tổ chức */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Ngày tổ chức mở bán <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  calendar_today
                </span>
                <input
                  type="date"
                  min={getLocalDateStr()}
                  {...register("date")}
                  className={cn(
                    "w-full h-10 pl-10 pr-3 rounded-lg border font-body-md text-body-md transition-all focus:outline-none",
                    errors.date
                      ? "border-red-500 ring-1 ring-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-red-500"
                      : "border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                  )}
                />
              </div>
              {errors.date && (
                <div className="flex items-center gap-1 text-red-600 text-xs font-semibold mt-1">
                  <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
                  <span>{errors.date.message}</span>
                </div>
              )}
            </div>

            {/* Field 3: Giờ bắt đầu & Kết thúc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Giờ bắt đầu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    schedule
                  </span>
                  <input
                    type="time"
                    {...register("startTime")}
                    className={cn(
                      "w-full h-10 pl-10 pr-3 rounded-lg border font-body-md text-body-md transition-all focus:outline-none",
                      errors.startTime
                        ? "border-red-500 ring-1 ring-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-red-500"
                        : "border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                    )}
                  />
                </div>
                {errors.startTime && (
                  <div className="flex items-center gap-1 text-red-600 text-xs font-semibold mt-1">
                    <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
                    <span>{errors.startTime.message}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                  <span>
                    Giờ kết thúc <span className="text-red-500">*</span>
                  </span>
                  {durationText && (
                    <span className="text-primary font-label-sm text-label-sm font-semibold">
                      {durationText}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    update
                  </span>
                  <input
                    type="time"
                    {...register("endTime")}
                    className={cn(
                      "w-full h-10 pl-10 pr-3 rounded-lg border font-body-md text-body-md transition-all focus:outline-none",
                      errors.endTime
                        ? "border-red-500 ring-1 ring-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-red-500"
                        : "border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                    )}
                  />
                </div>
                {errors.endTime && (
                  <div className="flex items-center gap-1 text-red-600 text-xs font-semibold mt-1">
                    <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
                    <span>{errors.endTime.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Field 4: Thời gian giữ chỗ (Lock time) */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                <span>
                  Thời gian giữ chỗ hàng (Lock time) <span className="text-red-500">*</span>
                </span>
                <span className="font-label-sm text-label-sm text-primary font-semibold">
                  Khuyến nghị: 300s
                </span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="1"
                    min="60"
                    max="1800"
                    {...register("holdSeconds")}
                    className={cn(
                      "w-full h-10 px-3 pr-12 rounded-lg border font-data-tabular text-body-md transition-all focus:outline-none",
                      errors.holdSeconds
                        ? "border-red-500 ring-1 ring-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-red-500"
                        : "border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label-md text-label-md text-secondary pointer-events-none">
                    giây
                  </span>
                </div>
                <div className="px-3 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md shrink-0">
                  (= {holdMinutes} phút)
                </div>
              </div>
              <span className="font-body-sm text-[12px] text-secondary">
                Khoảng thời gian SKU được tạm khóa trong giỏ hàng trước khi hủy checkout để nhường cho khách tiếp theo.
              </span>
              {errors.holdSeconds && (
                <div className="flex items-center gap-1 text-red-600 text-xs font-semibold mt-1">
                  <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
                  <span>{errors.holdSeconds.message}</span>
                </div>
              )}
            </div>

            {/* Field 5: Hạn cuối đăng ký sản phẩm */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                <span>
                  Hạn cuối đăng ký sản phẩm cho người bán <span className="text-red-500">*</span>
                </span>
                <span className="font-label-sm text-label-sm text-secondary">
                  (Khuyến nghị trước 2 giờ mở bán)
                </span>
              </label>
              <input
                type="datetime-local"
                min={getLocalISOString()}
                {...register("registrationDeadline")}
                className={cn(
                  "h-10 px-3 rounded-lg border font-body-md text-body-md transition-all focus:outline-none",
                  errors.registrationDeadline
                    ? "border-red-500 ring-1 ring-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-red-500"
                    : "border-outline-variant/60 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                )}
              />
              {errors.registrationDeadline && (
                <div className="flex items-center gap-1 text-red-600 text-xs font-semibold mt-1">
                  <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
                  <span>{errors.registrationDeadline.message}</span>
                </div>
              )}
            </div>


            {/* Alert Box: Cơ chế Redis Cache */}
            <div className="p-3.5 rounded-xl bg-surface-container-high/60 border border-primary/30 flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">
                info
              </span>
              <div className="font-body-sm text-[12.5px] leading-relaxed text-on-surface">
                <strong className="text-primary font-semibold">Cơ chế đồng bộ kỹ thuật:</strong> Tồn
                kho sẽ được nạp lên bộ nhớ đệm (Redis Cache) <strong>5 phút</strong> trước giờ mở
                bán. Hàng chưa bán sẽ tự động hoàn về kho khả dụng của shop khi phiên kết thúc.
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-space-lg py-space-md border-t border-outline-variant/30 bg-surface-bright flex items-center justify-end gap-space-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container font-headline-md text-body-md text-secondary transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-headline-md text-body-md shadow-sm transition-all active:scale-[0.99] cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{isEditing ? "Lưu thay đổi" : "Tạo khung giờ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FlashSaleSlotModal(props: FlashSaleSlotModalProps) {
  if (!props.isOpen) return null;
  return <FlashSaleSlotModalDialog {...props} />;
}
