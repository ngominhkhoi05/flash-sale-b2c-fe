export interface SystemRole {
  id: string;
  code: "ROLE_ADMIN" | "ROLE_SELLER" | "ROLE_BUYER";
  name: string;
  description: string;
  userCount: number;
  level: string;
  icon: string;
}

export interface InternalRoleGroup {
  id: string;
  name: string;
  code: string;
  description: string;
  memberCount: number;
  hasMfa: boolean;
  icon: string;
  permissions: string[];
}

export interface AclPermission {
  code: string;
  name: string;
  module: "PRODUCT" | "FLASH_SALE" | "ORDER_VOUCHER" | "SYSTEM";
  isSensitive?: boolean;
  isReadOnly?: boolean;
}

export interface FeatureFlag {
  code: string;
  name: string;
  description: string;
  module: string;
  groupCount: number;
  isEnabled: boolean;
  maintenanceMessage?: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
}

export type ReviewModerationStatus = "PENDING" | "HIDDEN" | "RESOLVED";

export interface ReportedReview {
  id: string;
  reviewerName: string;
  reviewerId: string;
  reviewerInitials: string;
  rating: number; // 1 - 5
  createdAt: string;
  reportCount: number;
  reportReason: string;
  commentText: string;
  productName: string;
  storeName: string;
  isMall: boolean;
  productImageUrl?: string;
  status: ReviewModerationStatus;
  moderatedBy?: string;
}
