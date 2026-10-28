import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { FlashSaleItemDetailPage } from "@/components/storefront/flash-sale/FlashSaleItemDetailPage";
import { getFlashSaleItemDetail } from "@/features/flash-sale/api";
import { getMockFlashSaleItemDetail } from "@/features/flash-sale/mocks";
import type { PublicFlashSaleItemDetailResponse } from "@/features/flash-sale/types";

interface FlashSaleItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function FlashSaleItemRoute({ params }: FlashSaleItemPageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (isNaN(numericId) || numericId <= 0) {
    notFound();
  }

  // Locale setup
  setRequestLocale("vi");

  let itemData: PublicFlashSaleItemDetailResponse | null = null;

  try {
    itemData = await getFlashSaleItemDetail(numericId);
  } catch (err) {
    // If backend is not reached or item not found in DB during demo, fallback to mock data
    try {
      itemData = getMockFlashSaleItemDetail(numericId);
    } catch {
      notFound();
    }
  }

  if (!itemData) {
    notFound();
  }

  return (
    <main>
      <FlashSaleItemDetailPage item={itemData} />
    </main>
  );
}
