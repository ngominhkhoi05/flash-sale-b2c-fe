"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DataTable,
  ConfirmModal,
  type DataTableColumn,
} from "@/components/admin";
import { FlashSaleCalendar, FlashSaleSlotModal } from "@/components/admin/flash-sale";
import type { AdminFlashSaleSession, CreateFlashSaleSessionInput } from "@/types/flash-sale";
import {
  getMockFlashSaleSessions,
  createMockFlashSaleSession,
  updateMockFlashSaleSession,
  cancelMockFlashSaleSession,
} from "@/lib/mocks/flash-sessions.mock";

export default function AdminFlashSaleSessionsPage() {
  const [sessions, setSessions] = useState<AdminFlashSaleSession[]>(() =>
    getMockFlashSaleSessions()
  );
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Search & Filter trong list view
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AdminFlashSaleSession | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>();
  const [modalDefaultTime, setModalDefaultTime] = useState<string | undefined>();

  // Confirm Cancel Modal
  const [sessionToCancel, setSessionToCancel] = useState<AdminFlashSaleSession | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Thống kê nhanh
  const activeCount = useMemo(
    () => sessions.filter((s) => s.status === "ACTIVE").length,
    [sessions]
  );
  const totalCount = sessions.length;

  // Xử lý tạo mới / sửa
  const handleOpenCreate = (date?: string, time?: string) => {
    setEditingSession(null);
    setModalDefaultDate(date);
    setModalDefaultTime(time);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (session: AdminFlashSaleSession) => {
    if (session.status === "ACTIVE" || session.status === "ENDED") {
      toast.error("Không thể chỉnh sửa phiên đã hoặc đang diễn ra!");
      return;
    }
    setEditingSession(session);
    setModalDefaultDate(session.date);
    setIsModalOpen(true);
  };

  const handleSaveSlot = (input: CreateFlashSaleSessionInput) => {
    if (editingSession) {
      const updated = updateMockFlashSaleSession(editingSession.id, input);
      if (updated) {
        setSessions(getMockFlashSaleSessions());
        toast.success("Cập nhật khung giờ thành công!", {
          description: `Phiên "${updated.name}" đã được cập nhật thông tin.`,
        });
      }
    } else {
      const created = createMockFlashSaleSession(input);
      setSessions(getMockFlashSaleSessions());
      toast.success("Tạo khung giờ Flash Sale mới thành công!", {
        description: `Phiên "${created.name}" đã được thêm vào lịch tuần.`,
      });
    }
    setIsModalOpen(false);
    setEditingSession(null);
  };

  // Xử lý hủy phiên
  const handleConfirmCancel = (data: { reason: string; note: string }) => {
    if (!sessionToCancel) return;
    setIsCancelling(true);
    setTimeout(() => {
      const ok = cancelMockFlashSaleSession(sessionToCancel.id);
      setIsCancelling(false);
      setSessionToCancel(null);
      if (ok) {
        setSessions(getMockFlashSaleSessions());
        toast.success("Hủy phiên Flash Sale thành công!", {
          description: `Phiên "${sessionToCancel.name}" đã bị hủy. Lý do: ${data.reason}`,
        });
      } else {
        toast.error("Không thể hủy phiên đang chạy hoặc đã kết thúc!");
      }
    }, 400);
  };

  // Dữ liệu lọc cho List view
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = s.code.toLowerCase().includes(q);
        const matchTime = s.timeRangeDisplay.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTime) return false;
      }
      return true;
    });
  }, [sessions, statusFilter, searchQuery]);

  // Pagination trong list view
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cột DataTable cho List view
  const columns: DataTableColumn<AdminFlashSaleSession>[] = [
    {
      key: "name",
      header: "Tên phiên Flash Sale",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "p-2 rounded-lg flex items-center justify-center shrink-0",
              row.status === "ACTIVE"
                ? "bg-tertiary text-on-tertiary"
                : row.status === "REGISTRATION_OPEN"
                  ? "bg-surface-container text-primary"
                  : row.status === "UPCOMING"
                    ? "bg-primary-fixed text-primary"
                    : "bg-surface-container text-secondary"
            )}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={row.status === "ACTIVE" ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {row.status === "ACTIVE"
                ? "bolt"
                : row.status === "REGISTRATION_OPEN"
                  ? "how_to_reg"
                  : row.status === "UPCOMING"
                    ? "schedule"
                    : "history"}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-md text-body-md text-on-surface font-semibold truncate hover:text-primary">
              {row.name} ({row.code})
            </span>
            <span className="font-label-sm text-label-sm text-secondary truncate">
              {row.description || "Phiên Flash Sale toàn sàn"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "startTime",
      header: "Bắt đầu",
      render: (row) => (
        <span
          className={cn(
            "font-data-tabular text-body-sm font-semibold",
            row.status === "ACTIVE" ? "text-tertiary font-bold" : "text-on-surface"
          )}
        >
          {row.timeRangeDisplay.split(" - ")[0]} {row.date}
        </span>
      ),
    },
    {
      key: "endTime",
      header: "Kết thúc",
      render: (row) => (
        <span className="font-data-tabular text-body-sm text-secondary">
          {row.timeRangeDisplay.split(" - ")[1]} {row.date}
        </span>
      ),
    },
    {
      key: "holdSeconds",
      header: "Giữ hàng",
      align: "center",
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full font-data-tabular text-label-sm bg-surface-container text-on-secondary-container font-semibold whitespace-nowrap">
          {row.holdSeconds} giây
        </span>
      ),
    },
    {
      key: "skus",
      header: "SKU đã duyệt / Chờ",
      render: (row) => (
        <div className="flex items-center gap-1.5 font-data-tabular text-body-sm">
          <span className="font-semibold text-primary">{row.approvedSkusCount}</span>
          <span className="text-outline">/</span>
          <span
            className={cn(
              row.pendingSkusCount > 0 ? "text-error font-medium" : "text-secondary"
            )}
          >
            {row.pendingSkusCount} chờ
          </span>
        </div>
      ),
    },
    {
      key: "sales",
      header: "Đã bán / Mở bán",
      render: (row) => {
        if (row.status === "UPCOMING" || (row.status === "REGISTRATION_OPEN" && row.soldQuantity === 0)) {
          return (
            <span className="font-label-sm text-label-sm text-secondary italic">
              Chưa mở bán (0 / {row.allocatedQuantity.toLocaleString("vi-VN")})
            </span>
          );
        }
        const pct = row.allocatedQuantity > 0
          ? Math.round((row.soldQuantity / row.allocatedQuantity) * 100)
          : 0;

        return (
          <div className="flex flex-col gap-1 w-32">
            <div className="flex justify-between font-label-sm text-label-sm">
              <span className="font-semibold text-on-surface">
                {row.soldQuantity.toLocaleString("vi-VN")}
              </span>
              <span className="text-tertiary font-bold">{pct}%</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-tertiary h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => {
        if (row.status === "ACTIVE") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-label-md bg-tertiary-fixed text-tertiary border border-tertiary/30 font-bold whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse" />
              Đang diễn ra
            </span>
          );
        }
        if (row.status === "REGISTRATION_OPEN") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-label-md bg-surface-container-low text-on-surface border border-outline-variant/60 font-semibold whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
              Đang mở đăng ký
            </span>
          );
        }
        if (row.status === "UPCOMING") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-label-md bg-surface-container-high text-primary border border-primary/20 font-semibold whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Sắp diễn ra
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-label-md bg-surface text-secondary border border-outline-variant/30 font-medium whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-outline" />
            Đã kết thúc
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => {
        const canEditOrCancel = row.status !== "ACTIVE" && row.status !== "ENDED";

        return (
          <div className="flex items-center justify-end gap-1">
            {canEditOrCancel ? (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(row)}
                  className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                  title="Chỉnh sửa khung giờ"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSessionToCancel(row)}
                  className="p-1.5 rounded-lg text-secondary hover:text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                  title="Hủy phiên Flash Sale"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              </>
            ) : (
              <span className="font-label-sm text-label-sm text-outline italic px-2">
                Không thể sửa
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="px-space-lg lg:px-margin py-space-lg flex flex-col gap-space-lg max-w-[1440px] mx-auto w-full">
        {/* TOP HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                Khung giờ Flash Sale
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-md text-label-md bg-secondary-container text-on-secondary-fixed-variant">
                {totalCount} khung giờ trong tuần
              </span>
              {activeCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-ping" />
                  {activeCount} phiên đang chạy
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-secondary">
              Quản lý lịch phân bổ tài nguyên, điều tiết lưu lượng mở bán và chuẩn hóa chu kỳ Flash Sale toàn sàn Vibe Mart.
            </p>
          </div>

          {/* ACTIONS & SEGMENTED SWITCH */}
          <div className="flex items-center gap-space-sm self-start md:self-auto">
            {/* Segmented Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-surface-container shadow-xs border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 cursor-pointer",
                  viewMode === "calendar"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
                    : "text-secondary hover:text-on-surface"
                )}
              >
                <span className="material-symbols-outlined text-[17px]">calendar_view_week</span>
                <span>Lịch tuần</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 cursor-pointer",
                  viewMode === "list"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
                    : "text-secondary hover:text-on-surface"
                )}
              >
                <span className="material-symbols-outlined text-[17px]">view_list</span>
                <span>Danh sách</span>
              </button>
            </div>

            {/* Create Button */}
            <button
              type="button"
              onClick={() => handleOpenCreate()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-headline-md text-body-md hover:bg-primary-hover shadow-sm transition-all active:scale-[0.99] cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Tạo khung giờ</span>
            </button>
          </div>
        </div>

        {/* LEGEND CHIPS & SYSTEM STATUS */}
        <div className="flex flex-wrap items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider pr-1 font-semibold">
              Trạng thái:
            </span>
            {/* Legend: Sắp diễn ra */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high text-primary border border-primary/20 font-label-md text-label-md">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Sắp diễn ra</span>
            </div>
            {/* Legend: Đang diễn ra */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-tertiary-fixed text-tertiary border border-tertiary/25 font-label-md text-label-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
              </span>
              <span className="font-semibold">Đang diễn ra</span>
            </div>
            {/* Legend: Đang mở đăng ký */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/60 font-label-md text-label-md">
              <span className="h-2 w-2 rounded-full bg-primary-container" />
              <span>Đang mở đăng ký</span>
            </div>
            {/* Legend: Đã kết thúc */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-secondary border border-outline-variant/30 font-label-md text-label-md">
              <span className="h-2 w-2 rounded-full bg-outline" />
              <span>Đã kết thúc</span>
            </div>
          </div>

          {/* Quick Metrics Pill */}
          <div className="hidden xl:flex items-center gap-space-md font-label-sm text-label-sm text-secondary divide-x divide-outline-variant/40">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[17px]">memory</span>
              <span>
                Redis sync: <strong className="text-on-surface font-semibold">Tự động (5m)</strong>
              </span>
            </div>
            <div className="pl-space-md flex items-center gap-1.5">
              <span className="material-symbols-outlined text-tertiary text-[17px]">timer</span>
              <span>
                Lock giữ hàng mặc định: <strong className="text-on-surface font-semibold">300s</strong>
              </span>
            </div>
          </div>
        </div>

        {/* VIEW 1: WEEKLY CALENDAR */}
        {viewMode === "calendar" && (
          <FlashSaleCalendar
            sessions={sessions}
            onSelectSession={handleOpenEdit}
            onCreateSlot={handleOpenCreate}
          />
        )}

        {/* VIEW 2: DATA TABLE LIST */}
        {viewMode === "list" && (
          <div className="flex flex-col gap-space-md bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xs p-space-md">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm">
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm phiên theo tên, mốc giờ..."
                  className="w-full h-9 pl-8 pr-3 text-body-sm bg-surface-container-lowest border border-outline-variant/60 rounded-lg placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-surface-container-low rounded-lg">
                {[
                  { key: "ALL", label: "Tất cả" },
                  { key: "ACTIVE", label: "Đang diễn ra" },
                  { key: "UPCOMING", label: "Sắp tới" },
                  { key: "REGISTRATION_OPEN", label: "Mở đăng ký" },
                  { key: "ENDED", label: "Đã xong" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={cn(
                      "px-3 py-1 rounded-md font-label-md text-xs transition-colors cursor-pointer",
                      statusFilter === tab.key
                        ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                        : "text-secondary hover:text-on-surface"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main DataTable */}
            <DataTable
              columns={columns}
              data={filteredSessions.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
              rowKey={(s) => s.id}
              pagination={{
                currentPage,
                totalPages: Math.ceil(filteredSessions.length / pageSize) || 1,
                totalItems: filteredSessions.length,
                pageSize,
                onPageChange: setCurrentPage,
                onPageSizeChange: (newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                },
              }}
              emptyMessage="Không tìm thấy khung giờ Flash Sale nào phù hợp với bộ lọc."
            />
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <FlashSaleSlotModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSession(null);
        }}
        onSave={handleSaveSlot}
        initialData={editingSession}
        existingSessions={sessions}
        defaultDate={modalDefaultDate}
        defaultTime={modalDefaultTime}
      />

      {/* CANCEL SESSION CONFIRM MODAL */}
      <ConfirmModal
        isOpen={Boolean(sessionToCancel)}
        onClose={() => setSessionToCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Hủy phiên Flash Sale"
        subtitle={sessionToCancel ? `${sessionToCancel.name} (${sessionToCancel.timeRangeDisplay})` : ""}
        icon="cancel"
        variant="danger"
        warningMessage="Hành động này sẽ hủy bỏ khung giờ đã lên lịch. Mọi sản phẩm đã đăng ký/chờ duyệt cho phiên này sẽ được mở khóa lại kho cho người bán."
        targetSummary={
          sessionToCancel ? (
            <div className="flex flex-col gap-0.5">
              <span>Mã phiên: <strong>{sessionToCancel.code}</strong></span>
              <span>Thời gian: {sessionToCancel.timeRangeDisplay} - Ngày {sessionToCancel.date}</span>
            </div>
          ) : undefined
        }
        reasonLabel="Lý do hủy phiên"
        reasonOptions={[
          { value: "PLAN_CHANGE", label: "Thay đổi kế hoạch vận hành sàn" },
          { value: "EVENT_CONFLICT", label: "Trùng lặp sự kiện khuyến mãi khác" },
          { value: "TECHNICAL_ISSUE", label: "Sự cố kỹ thuật / Bảo trì hệ thống" },
          { value: "OTHER", label: "Lý do khác" },
        ]}
        reasonPlaceholder="-- Chọn lý do hủy --"
        noteLabel="Giải trình chi tiết"
        notePlaceholder="Nhập lý do chi tiết để lưu vết audit hệ thống..."
        noteRequired={false}
        confirmButtonText="Xác nhận hủy phiên"
        isLoading={isCancelling}
      />
    </div>
  );
}
