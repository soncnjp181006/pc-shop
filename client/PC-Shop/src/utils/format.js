/**
 * Định dạng tiền VND: tách nhóm 3 chữ số, ký hiệu ₫ (tránh lỗi hiển thị với số lớn).
 */
const vndFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatVnd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return `${vndFormatter.format(Math.round(n))} ₫`;
}
