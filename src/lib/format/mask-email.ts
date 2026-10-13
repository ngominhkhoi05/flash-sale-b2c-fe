/**
 * maskEmail – che email hiển thị cho user (2 ký tự đầu + *** + domain).
 *
 * @example
 * maskEmail("an.nguyen@gmail.com") // "an***@gmail.com"
 * maskEmail("a@example.com")       // "a***@example.com"
 * maskEmail("")                   // ""
 * maskEmail("not-an-email")       // "not-an-email"
 *
 * @param raw - email gốc
 * @returns email đã mask, hoặc raw nếu không có @ hoặc rỗng
 */
export function maskEmail(raw: string): string {
  if (!raw) return "";
  const atIdx = raw.indexOf("@");
  if (atIdx <= 0) return raw;
  const local = raw.slice(0, Math.min(2, atIdx));
  const domain = raw.slice(atIdx);
  return `${local}***${domain}`;
}
