"use client";

import React, { useState, useTransition, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SystemRole,
  InternalRoleGroup,
  AclPermission,
  FeatureFlag,
  ReportedReview,
} from "@/types/permissions";
import { permissionsMockService } from "@/lib/mocks/permissions.mock";
import {
  getAdminSystemRoles,
  getAdminRoleGroups,
  getAdminAclPermissions,
  getAdminFeatureFlags,
  toggleAdminFeatureFlag,
  getAdminReportedReviews,
  moderateAdminReview,
} from "@/lib/api/admin";
import { isMockMode } from "@/lib/api/client";
import {
  SystemRolesTab,
  RoleMatrixTab,
  FeatureFlagsTab,
  ReviewModerationTab,
} from "@/components/admin/permissions";

function PermissionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "roles";

  const [, startTransition] = useTransition();

  // Tab state
  const validTabs = ["roles", "groups", "features", "reviews"];
  const [activeTab, setActiveTab] = useState<string>(
    validTabs.includes(initialTab) ? initialTab : "roles"
  );

  // Refresh trigger for mock state
  const [refreshKey, setRefreshKey] = useState(0);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Sync tab with URL query
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabKey);
    router.replace(`/admin/permissions?${params.toString()}`);
  };

  // State for data
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>(() =>
    permissionsMockService.getSystemRoles()
  );
  const [roleGroups, setRoleGroups] = useState<InternalRoleGroup[]>(() =>
    permissionsMockService.getRoleGroups()
  );
  const [aclPermissions, setAclPermissions] = useState<AclPermission[]>(() =>
    permissionsMockService.getAclPermissions()
  );
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>(() =>
    permissionsMockService.getFeatureFlags()
  );
  const [reportedReviews, setReportedReviews] = useState<ReportedReview[]>(() =>
    permissionsMockService.getReportedReviews()
  );

  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch permissions & features data from BE with fallback
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAdminSystemRoles(),
      getAdminRoleGroups(),
      getAdminAclPermissions(),
      getAdminFeatureFlags(),
      getAdminReportedReviews(),
    ])
      .then(([rolesRes, groupsRes, permsRes, flagsRes, reviewsRes]) => {
        if (!cancelled) {
          setSystemRoles(rolesRes);
          setRoleGroups(groupsRes);
          setAclPermissions(permsRes);
          setFeatureFlags(flagsRes);
          setReportedReviews(reviewsRes);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          if (isMockMode()) {
            setSystemRoles(permissionsMockService.getSystemRoles());
            setRoleGroups(permissionsMockService.getRoleGroups());
            setAclPermissions(permissionsMockService.getAclPermissions());
            setFeatureFlags(permissionsMockService.getFeatureFlags());
            setReportedReviews(permissionsMockService.getReportedReviews());
            setLoadError(null);
          } else {
            setLoadError(
              err instanceof Error
                ? err.message
                : "Chức năng phân quyền & cờ tính năng chưa sẵn sàng trên máy chủ."
            );
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Modals state for Feature Toggle confirmation
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [pendingFlagToDisable, setPendingFlagToDisable] =
    useState<FeatureFlag | null>(null);
  const [maintenanceReason, setMaintenanceReason] = useState(
    "Nâng cấp cơ sở dữ liệu định kỳ"
  );

  // Handle Feature Flag Toggle
  const handleToggleFlag = async (flag: FeatureFlag, nextState: boolean) => {
    if (!nextState) {
      // Opening disable confirm modal
      setPendingFlagToDisable(flag);
      setIsDisableModalOpen(true);
    } else {
      // Direct enable
      try {
        await toggleAdminFeatureFlag(flag.code, true);
        startTransition(() => {
          setRefreshKey((k) => k + 1);
        });
        showToast(`Đã kích hoạt lại tính năng "${flag.name}" trên toàn sàn`);
      } catch (err: unknown) {
        const error = err as Error;
        showToast(error.message || "Có lỗi xảy ra");
      }
    }
  };

  const handleConfirmDisable = async () => {
    if (!pendingFlagToDisable) return;
    try {
      await toggleAdminFeatureFlag(
        pendingFlagToDisable.code,
        false,
        maintenanceReason
      );
      startTransition(() => {
        setRefreshKey((k) => k + 1);
      });
      setIsDisableModalOpen(false);
      showToast(
        `Đã tắt tính năng "${pendingFlagToDisable.name}". Người dùng sẽ nhận thông báo bảo trì.`
      );
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Có lỗi xảy ra");
    }
  };

  // Handle Save ACL
  const handleSaveGroupPermissions = (
    groupId: string,
    newPermissions: string[]
  ) => {
    try {
      permissionsMockService.saveRoleGroupPermissions(groupId, newPermissions);
      startTransition(() => {
        setRefreshKey((k) => k + 1);
      });
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Có lỗi khi lưu quyền");
    }
  };

  // Handle Review Moderation
  const handleModerateReview = async (
    review: ReportedReview,
    action: "keep" | "hide" | "restore"
  ) => {
    try {
      const updated = await moderateAdminReview(review.id, action);
      startTransition(() => {
        setRefreshKey((k) => k + 1);
      });
      showToast(
        action === "keep"
          ? `Đã giữ lại đánh giá của ${updated.reviewerName} (hợp lệ)`
          : action === "hide"
          ? `Đã ẩn hiển thị đánh giá của ${updated.reviewerName}`
          : `Đã khôi phục trạng thái đánh giá của ${updated.reviewerName}`
      );
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || "Có lỗi khi xử lý đánh giá");
    }
  };

  const disabledFeaturesCount = featureFlags.filter((f) => !f.isEnabled).length;
  const pendingReviewsCount = reportedReviews.filter(
    (r) => r.status === "PENDING"
  ).length;

  return (
    <div className="flex flex-col gap-space-lg min-h-full pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-space-sm bg-surface-container-highest text-on-surface border border-outline-variant/30 px-4 py-3 rounded-xl shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            check_circle
          </span>
          <span className="font-body-md text-sm font-medium">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Error Banner when BE is down and Mock is disabled */}
      {loadError && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-error flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl">error</span>
            <div>
              <p className="font-semibold text-sm">Chức năng chưa sẵn sàng</p>
              <p className="text-xs opacity-80">{loadError}</p>
            </div>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="px-3 py-1.5 rounded-lg bg-error text-on-error text-xs font-medium hover:opacity-90 transition-opacity"
            type="button"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface tracking-tight">
              Phân quyền & tính năng
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-primary border border-primary/20">
              <span className="material-symbols-outlined text-[14px]">
                shield
              </span>
              Security & Feature Flags v2.4
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface-container-high text-secondary font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              RBAC v4 Active
            </span>
          </div>
          <p className="font-body-md text-sm text-secondary mt-1 max-w-4xl">
            Quản lý vai trò người dùng, cấu hình ma trận phân quyền chi tiết,
            kiểm soát bật/tắt tính năng toàn sàn và kiểm duyệt nội dung đánh giá
            theo tiêu chuẩn vận hành an toàn.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-space-sm self-start lg:self-center">
          <button
            type="button"
            onClick={() =>
              showToast("Đã tải 50 bản ghi nhật ký truy vết mới nhất của hệ thống")
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-secondary hover:text-on-surface hover:bg-surface-container shadow-sm transition-all font-label-md text-xs font-semibold border border-outline-variant/60"
          >
            <span className="material-symbols-outlined text-[18px]">
              history
            </span>
            <span>Nhật ký truy vết (Audit Log)</span>
          </button>
          <button
            type="button"
            onClick={() =>
              showToast("Đã đồng bộ chính sách bảo mật RBAC với PostgreSQL và Redis")
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 shadow transition-all font-label-md text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">
              verified_user
            </span>
            <span>Đồng bộ chính sách sàn</span>
          </button>
        </div>
      </div>

      {/* Maintenance Alert Banner if any feature is disabled */}
      {disabledFeaturesCount > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <span className="material-symbols-outlined text-amber-600 text-[22px] mt-0.5">
            warning
          </span>
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-bold">Cảnh báo vận hành:</strong> Hiện đang
            có <strong>{disabledFeaturesCount} tính năng</strong> ở trạng thái tạm
            tắt bảo trì. Người dùng truy cập các tính năng này sẽ nhận được màn
            hình thông báo bảo trì nâng cấp.
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl w-fit overflow-x-auto max-w-full">
        {/* Tab 1: System Roles */}
        <button
          type="button"
          onClick={() => handleTabChange("roles")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-xs transition-all ${
            activeTab === "roles"
              ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-lowest/60 font-semibold"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">groups</span>
          <span>Vai trò người dùng</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] ${
              activeTab === "roles"
                ? "bg-primary-fixed text-primary font-bold"
                : "bg-surface-container-high text-secondary"
            }`}
          >
            3 Roles
          </span>
        </button>

        {/* Tab 2: Role Groups & Matrix */}
        <button
          type="button"
          onClick={() => handleTabChange("groups")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-xs transition-all ${
            activeTab === "groups"
              ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-lowest/60 font-semibold"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            grid_view
          </span>
          <span>Nhóm quyền (Roles & Matrix)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] ${
              activeTab === "groups"
                ? "bg-primary-fixed text-primary font-bold"
                : "bg-surface-container-high text-secondary"
            }`}
          >
            18 ACL
          </span>
        </button>

        {/* Tab 3: Feature Flags */}
        <button
          type="button"
          onClick={() => handleTabChange("features")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-xs transition-all ${
            activeTab === "features"
              ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-lowest/60 font-semibold"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            toggle_on
          </span>
          <span>Quyền & Bật tắt tính năng</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] ${
              disabledFeaturesCount > 0
                ? "bg-amber-500/20 text-amber-700 font-bold"
                : "bg-surface-container-high text-secondary"
            }`}
          >
            {disabledFeaturesCount > 0
              ? `${disabledFeaturesCount} Tắt`
              : "Đầy đủ"}
          </span>
        </button>

        {/* Tab 4: Review Moderation */}
        <button
          type="button"
          onClick={() => handleTabChange("reviews")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-xs transition-all ${
            activeTab === "reviews"
              ? "bg-surface-container-lowest text-primary font-bold shadow-sm"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-lowest/60 font-semibold"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          <span>Kiểm duyệt đánh giá</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
              pendingReviewsCount > 0
                ? "bg-rose-100 text-rose-700"
                : "bg-surface-container-high text-secondary"
            }`}
          >
            {pendingReviewsCount} Báo cáo
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === "roles" && (
        <SystemRolesTab
          roles={systemRoles}
          onSelectRole={(role) => {
            showToast(
              `Chuyển sang cấu hình ma trận phân quyền cho vai trò ${role.code}`
            );
            handleTabChange("groups");
          }}
        />
      )}

      {activeTab === "groups" && (
        <RoleMatrixTab
          groups={roleGroups}
          permissions={aclPermissions}
          onSaveGroupPermissions={handleSaveGroupPermissions}
          showToast={showToast}
        />
      )}

      {activeTab === "features" && (
        <FeatureFlagsTab
          flags={featureFlags}
          onToggleFlag={handleToggleFlag}
        />
      )}

      {activeTab === "reviews" && (
        <ReviewModerationTab
          reviews={reportedReviews}
          onModerate={handleModerateReview}
        />
      )}

      {/* Confirm Disable Feature Modal */}
      {isDisableModalOpen && pendingFlagToDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl max-w-md w-full p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">
                  warning
                </span>
              </div>
              <div>
                <h4 className="font-headline-md text-base font-bold text-on-surface">
                  Xác nhận tắt tính năng sàn?
                </h4>
                <span className="font-mono text-xs text-secondary">
                  {pendingFlagToDisable.code}
                </span>
              </div>
            </div>

            <p className="font-body-sm text-xs text-secondary leading-relaxed">
              Bạn sắp tắt tính năng{" "}
              <strong className="text-on-surface">
                {pendingFlagToDisable.name}
              </strong>
              . Hệ thống sẽ ngay lập tức chặn các yêu cầu liên quan của toàn bộ
              người dùng và chuyển hướng họ về trang thông báo bảo trì.
            </p>

            <div className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-1.5 border border-outline-variant/20">
              <span className="font-label-sm text-xs font-semibold text-on-surface">
                Lý do bảo trì hiển thị:
              </span>
              <select
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                className="w-full h-9 px-2 rounded-lg bg-surface-container-lowest font-body-sm text-xs text-on-surface border border-outline-variant/60 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Nâng cấp cơ sở dữ liệu định kỳ">
                  Nâng cấp cơ sở dữ liệu định kỳ
                </option>
                <option value="Phát hiện lỗ hổng khai thác mã giảm">
                  Phát hiện lỗ hổng khai thác mã giảm
                </option>
                <option value="Giảm tải cụm máy chủ thanh toán">
                  Giảm tải cụm máy chủ thanh toán
                </option>
                <option value="Khác (Ghi chú nội bộ)">
                  Khác (Ghi chú nội bộ)
                </option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDisableModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant/60 font-label-md text-xs font-semibold hover:bg-surface-container-low transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDisable}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-label-md text-xs font-semibold shadow transition-colors"
              >
                Xác nhận tắt tính năng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPermissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-secondary text-sm">
          Đang tải dữ liệu phân quyền & tính năng...
        </div>
      }
    >
      <PermissionsPageContent />
    </Suspense>
  );
}
