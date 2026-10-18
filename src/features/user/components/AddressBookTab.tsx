"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/features/user/hooks";
import type { AddressResponse, AddressRequest } from "@/features/user/addresses";
import { AddressDialog } from "./AddressDialog";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function AddressBookTab() {
  const { data: addresses, isLoading } = useAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null);

  const handleOpenCreate = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (addr: AddressResponse) => {
    setEditingAddress(addr);
    setDialogOpen(true);
  };

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (!err) return fallback;
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.startsWith("[") && raw.includes('"message"')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          return parsed[0].message;
        }
      } catch {}
    }
    return raw || fallback;
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success("Đã xóa địa chỉ"),
        onError: (err: unknown) => toast.error(extractErrorMessage(err, "Không thể xóa địa chỉ")),
      });
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id, {
      onSuccess: () => toast.success("Đã đặt làm địa chỉ mặc định"),
      onError: (err: unknown) => toast.error(extractErrorMessage(err, "Không thể đặt địa chỉ mặc định")),
    });
  };

  const handleSubmit = async (payload: AddressRequest) => {
    if (editingAddress) {
      await updateMutation.mutateAsync(
        { addressId: editingAddress.id, payload },
        {
          onSuccess: () => {
            toast.success("Cập nhật địa chỉ thành công!");
            setDialogOpen(false);
          },
          onError: (err: unknown) => {
            toast.error(extractErrorMessage(err, "Cập nhật địa chỉ thất bại"));
          },
        }
      );
    } else {
      await createMutation.mutateAsync(payload, {
        onSuccess: () => {
          toast.success("Thêm địa chỉ mới thành công!");
          setDialogOpen(false);
        },
        onError: (err: unknown) => {
          toast.error(extractErrorMessage(err, "Thêm địa chỉ thất bại"));
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 space-y-4">
        <div className="h-7 w-44 animate-pulse rounded bg-surface-container" />
        <div className="h-4 w-64 animate-pulse rounded bg-surface-container" />
        <div className="space-y-3 pt-4">
          <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
        </div>
      </div>
    );
  }

  const addressList = addresses || [];

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-outline-variant/30">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-outline-variant/30 mb-6">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Địa chỉ của tôi</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Quản lý địa chỉ nhận hàng để đặt hàng nhanh chóng
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
        >
          <MaterialSymbol name="add" size="[18px]" />
          Thêm địa chỉ mới
        </button>
      </header>

      {/* Danh sách địa chỉ từ Database */}
      {addressList.length > 0 ? (
        <div className="divide-y divide-outline-variant/20">
          {addressList.map((addr) => (
            <div key={addr.id} className="py-5 flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-on-surface">{addr.contactName}</span>
                  <span className="text-outline-variant/60">|</span>
                  <span className="font-mono text-xs text-on-surface-variant font-medium">
                    {addr.phone}
                  </span>
                  {addr.isDefault && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {addr.detailAddress}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {addr.ward}, {addr.district}, {addr.province}
                </p>
              </div>

              <div className="flex sm:flex-col items-end gap-2.5 shrink-0 self-end sm:self-start">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(addr)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Sửa
                  </button>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      className="text-xs font-semibold text-error hover:underline"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={setDefaultMutation.isPending}
                    className="px-3 py-1 rounded-lg border border-outline-variant/60 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    Thiết lập mặc định
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State khi Database chưa có địa chỉ */
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center mb-3">
            <MaterialSymbol name="location_on" size="[32px]" />
          </div>
          <h3 className="text-base font-bold text-on-surface">Bạn chưa có địa chỉ nhận hàng nào</h3>
          <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
            Thêm địa chỉ nhận hàng để việc đặt hàng và giao nhận diễn ra nhanh chóng, chính xác.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
          >
            <MaterialSymbol name="add" size="[18px]" />
            Thêm địa chỉ ngay
          </button>
        </div>
      )}

      {dialogOpen && (
        <AddressDialog
          open={dialogOpen}
          initialData={editingAddress}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
