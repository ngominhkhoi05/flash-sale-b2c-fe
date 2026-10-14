import type {
  AdminFlashSaleSession,
  CreateFlashSaleSessionInput,
  FlashSaleSlotStatus,
} from "@/types/flash-sale";

/**
 * Helper tính toán ngày Thứ Hai của tuần chứa mốc date
 */
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 là ngày bắt đầu tuần
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayMonth(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

/**
 * Khởi tạo dữ liệu mock cho các khung giờ Flash Sale
 * Động hoàn toàn theo Date.now(), bảo đảm luôn có 1 phiên ACTIVE lúc 12:00 hôm nay
 */
function generateInitialSessions(): AdminFlashSaleSession[] {
  const now = new Date();
  const monday = getMonday(now);

  const getDayAt = (dayOffset: number): Date => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + dayOffset);
    return d;
  };

  const createIso = (dayOffset: number, timeStr: string): string => {
    const [h, m] = timeStr.split(":").map(Number);
    const d = getDayAt(dayOffset);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  // Ngày hiện tại trong tuần (0: T2, 1: T3, ..., 6: CN)
  const currentDayIndex = (now.getDay() + 6) % 7;

  const sessions: AdminFlashSaleSession[] = [];
  let nextId = 1;

  // 1. Hôm nay: 00:00 - 02:00: Mở Màn Đêm Muộn (ENDED)
  sessions.push({
    id: nextId++,
    code: `FS-${formatDate(now).replace(/-/g, "")}-00`,
    name: "Mở Màn Đêm Muộn",
    description: "Phiên xả hàng công nghệ & phụ kiện nửa đêm",
    date: formatDate(now),
    startTime: createIso(currentDayIndex, "00:00"),
    endTime: createIso(currentDayIndex, "02:00"),
    timeRangeDisplay: "00:00 - 02:00",
    holdSeconds: 300,
    registrationDeadline: createIso(currentDayIndex - 1, "18:00"),
    approvedSkusCount: 28,
    pendingSkusCount: 0,
    totalSkusCount: 28,
    soldQuantity: 1200,
    allocatedQuantity: 1200,
    status: "ENDED",
  });

  // 2. Hôm nay: 09:00 - 11:00: Flash Khởi Động Sáng (ENDED)
  sessions.push({
    id: nextId++,
    code: `FS-${formatDate(now).replace(/-/g, "")}-09`,
    name: "Flash Khởi Động Sáng",
    description: "Phiên mở màn ngày mới ưu đãi tiêu dùng & thời trang",
    date: formatDate(now),
    startTime: createIso(currentDayIndex, "09:00"),
    endTime: createIso(currentDayIndex, "11:00"),
    timeRangeDisplay: "09:00 - 11:00",
    holdSeconds: 300,
    registrationDeadline: createIso(currentDayIndex - 1, "20:00"),
    approvedSkusCount: 40,
    pendingSkusCount: 0,
    totalSkusCount: 40,
    soldQuantity: 2580,
    allocatedQuantity: 3000,
    status: "ENDED",
  });

  // 3. Hôm nay: 12:00 - 14:00: Giờ Vàng Trưa (ACTIVE - Đang diễn ra)
  sessions.push({
    id: nextId++,
    code: `FS-${formatDate(now).replace(/-/g, "")}-12`,
    name: "Giờ Vàng Trưa",
    description: "Đợt kích cầu mua sắm trưa toàn sàn Vibe Mart",
    date: formatDate(now),
    startTime: createIso(currentDayIndex, "12:00"),
    endTime: createIso(currentDayIndex, "14:00"),
    timeRangeDisplay: "12:00 - 14:00",
    holdSeconds: 300,
    registrationDeadline: createIso(currentDayIndex, "10:30"),
    approvedSkusCount: 32,
    pendingSkusCount: 0,
    totalSkusCount: 32,
    soldQuantity: 3820,
    allocatedQuantity: 4900,
    status: "ACTIVE",
  });

  // 4. Hôm nay: 20:00 - 22:00: Đại Tiệc Tối 20:00 (UPCOMING)
  sessions.push({
    id: nextId++,
    code: `FS-${formatDate(now).replace(/-/g, "")}-20`,
    name: "Đại Tiệc Tối 20:00",
    description: "Prime Time tối toàn ngành hàng thiết bị điện tử & gia dụng",
    date: formatDate(now),
    startTime: createIso(currentDayIndex, "20:00"),
    endTime: createIso(currentDayIndex, "22:00"),
    timeRangeDisplay: "20:00 - 22:00",
    holdSeconds: 300,
    registrationDeadline: createIso(currentDayIndex, "16:00"),
    approvedSkusCount: 45,
    pendingSkusCount: 3,
    totalSkusCount: 48,
    soldQuantity: 0,
    allocatedQuantity: 5200,
    status: "UPCOMING",
  });

  // 5. Ngày mai (currentDayIndex + 1): 09:00 - 11:00: Săn Sale Sáng Sớm (REGISTRATION_OPEN)
  const tomorrowDayIndex = (currentDayIndex + 1) % 7;
  const tomorrowDate = getDayAt(tomorrowDayIndex);
  sessions.push({
    id: nextId++,
    code: `FS-${formatDate(tomorrowDate).replace(/-/g, "")}-09`,
    name: "Săn Sale Sáng Sớm",
    description: "Phiên kích hoạt sáng ngày mai cho người bán",
    date: formatDate(tomorrowDate),
    startTime: createIso(tomorrowDayIndex, "09:00"),
    endTime: createIso(tomorrowDayIndex, "11:00"),
    timeRangeDisplay: "09:00 - 11:00",
    holdSeconds: 300,
    registrationDeadline: createIso(currentDayIndex, "18:00"),
    approvedSkusCount: 14,
    pendingSkusCount: 18,
    totalSkusCount: 32,
    soldQuantity: 0,
    allocatedQuantity: 3500,
    status: "REGISTRATION_OPEN",
  });

  // 6. Ngày mai: 12:00 - 14:00: Giờ Vàng Trưa (UPCOMING)
  sessions.push({
    id: nextId++,
    code: `FS-${formatDate(tomorrowDate).replace(/-/g, "")}-12`,
    name: "Giờ Vàng Trưa Ngày Mai",
    description: "Phiên trưa định kỳ",
    date: formatDate(tomorrowDate),
    startTime: createIso(tomorrowDayIndex, "12:00"),
    endTime: createIso(tomorrowDayIndex, "14:00"),
    timeRangeDisplay: "12:00 - 14:00",
    holdSeconds: 300,
    registrationDeadline: createIso(tomorrowDayIndex, "10:00"),
    approvedSkusCount: 20,
    pendingSkusCount: 10,
    totalSkusCount: 30,
    soldQuantity: 0,
    allocatedQuantity: 4000,
    status: "UPCOMING",
  });

  // Các phiên trải dài các ngày khác trong tuần để đạt 18 khung giờ trong tuần
  const additionalSlots = [
    { dayOffset: 0, start: "15:00", end: "17:00", name: "Trà Chiều Săn Deal", status: "ENDED" as FlashSaleSlotStatus, skus: 20 },
    { dayOffset: 1, start: "15:00", end: "17:00", name: "Flash Deal Chiều T3", status: "UPCOMING" as FlashSaleSlotStatus, skus: 15 },
    { dayOffset: 1, start: "20:00", end: "22:00", name: "Đêm Tiệc Phụ Kiện", status: "UPCOMING" as FlashSaleSlotStatus, skus: 25 },
    { dayOffset: 2, start: "09:00", end: "11:00", name: "Giữa Tuần Bùng Nổ", status: "REGISTRATION_OPEN" as FlashSaleSlotStatus, skus: 30 },
    { dayOffset: 2, start: "12:00", end: "14:00", name: "Flash Sale Công Sở", status: "UPCOMING" as FlashSaleSlotStatus, skus: 35 },
    { dayOffset: 3, start: "12:00", end: "14:00", name: "Siêu Giờ Vàng T5", status: "UPCOMING" as FlashSaleSlotStatus, skus: 40 },
    { dayOffset: 3, start: "20:00", end: "22:00", name: "Mega Beauty Night", status: "REGISTRATION_OPEN" as FlashSaleSlotStatus, skus: 30 },
    { dayOffset: 4, start: "09:00", end: "11:00", name: "Mega Tech Day", status: "REGISTRATION_OPEN" as FlashSaleSlotStatus, skus: 22 },
    { dayOffset: 4, start: "12:00", end: "14:00", name: "Flash Cuối Tuần T6", status: "UPCOMING" as FlashSaleSlotStatus, skus: 50 },
    { dayOffset: 4, start: "20:00", end: "22:00", name: "Friday Black Hour", status: "UPCOMING" as FlashSaleSlotStatus, skus: 60 },
    { dayOffset: 5, start: "00:00", end: "02:00", name: "Weekend Midnight", status: "REGISTRATION_OPEN" as FlashSaleSlotStatus, skus: 15 },
    { dayOffset: 6, start: "12:00", end: "14:00", name: "Chủ Nhật Xả Hàng", status: "UPCOMING" as FlashSaleSlotStatus, skus: 45 },
  ];

  for (const slot of additionalSlots) {
    const slotDate = getDayAt(slot.dayOffset);
    sessions.push({
      id: nextId++,
      code: `FS-${formatDate(slotDate).replace(/-/g, "")}-${slot.start.replace(":", "")}`,
      name: slot.name,
      description: `Phiên mở bán định kỳ ${slot.name}`,
      date: formatDate(slotDate),
      startTime: createIso(slot.dayOffset, slot.start),
      endTime: createIso(slot.dayOffset, slot.end),
      timeRangeDisplay: `${slot.start} - ${slot.end}`,
      holdSeconds: 300,
      registrationDeadline: createIso(slot.dayOffset, "08:00"),
      approvedSkusCount: slot.skus,
      pendingSkusCount: slot.status === "REGISTRATION_OPEN" ? 5 : 0,
      totalSkusCount: slot.skus + (slot.status === "REGISTRATION_OPEN" ? 5 : 0),
      soldQuantity: slot.status === "ENDED" ? Math.floor(slot.skus * 80) : 0,
      allocatedQuantity: slot.skus * 100,
      status: slot.status,
    });
  }

  return sessions;
}

// In-memory state
let inMemorySessions: AdminFlashSaleSession[] = generateInitialSessions();

export function getMockFlashSaleSessions(): AdminFlashSaleSession[] {
  return [...inMemorySessions];
}

export function getMockFlashSaleSessionById(id: number): AdminFlashSaleSession | undefined {
  return inMemorySessions.find((s) => s.id === id);
}

export function createMockFlashSaleSession(
  input: CreateFlashSaleSessionInput
): AdminFlashSaleSession {
  const startD = new Date(`${input.date}T${input.startTime}:00`);
  const endD = new Date(`${input.date}T${input.endTime}:00`);

  const newSession: AdminFlashSaleSession = {
    id: Date.now(),
    code: `FS-${input.date.replace(/-/g, "")}-${input.startTime.replace(":", "")}`,
    name: input.name,
    description: input.description || "",
    date: input.date,
    startTime: startD.toISOString(),
    endTime: endD.toISOString(),
    timeRangeDisplay: `${input.startTime} - ${input.endTime}`,
    holdSeconds: Number(input.holdSeconds) || 300,
    registrationDeadline: input.registrationDeadline,
    approvedSkusCount: 0,
    pendingSkusCount: 0,
    totalSkusCount: 0,
    soldQuantity: 0,
    allocatedQuantity: 0,
    status: "UPCOMING",
    createdAt: new Date().toISOString(),
  };

  inMemorySessions.unshift(newSession);
  return newSession;
}

export function updateMockFlashSaleSession(
  id: number,
  input: Partial<CreateFlashSaleSessionInput>
): AdminFlashSaleSession | null {
  const index = inMemorySessions.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const current = inMemorySessions[index];
  const updatedDate = input.date || current.date;
  const updatedStart = input.startTime ? input.startTime : current.timeRangeDisplay.split(" - ")[0];
  const updatedEnd = input.endTime ? input.endTime : current.timeRangeDisplay.split(" - ")[1];

  const startD = new Date(`${updatedDate}T${updatedStart}:00`);
  const endD = new Date(`${updatedDate}T${updatedEnd}:00`);

  const updated: AdminFlashSaleSession = {
    ...current,
    name: input.name ?? current.name,
    description: input.description ?? current.description,
    date: updatedDate,
    startTime: startD.toISOString(),
    endTime: endD.toISOString(),
    timeRangeDisplay: `${updatedStart} - ${updatedEnd}`,
    holdSeconds: input.holdSeconds ? Number(input.holdSeconds) : current.holdSeconds,
    registrationDeadline: input.registrationDeadline ?? current.registrationDeadline,
  };

  inMemorySessions[index] = updated;
  return updated;
}

export function cancelMockFlashSaleSession(id: number): boolean {
  const session = inMemorySessions.find((s) => s.id === id);
  if (!session) return false;
  // Chỉ hủy khi chưa diễn ra
  if (session.status === "ACTIVE" || session.status === "ENDED") {
    return false;
  }
  inMemorySessions = inMemorySessions.filter((s) => s.id !== id);
  return true;
}

export { getMonday, formatDate, formatDayMonth };
