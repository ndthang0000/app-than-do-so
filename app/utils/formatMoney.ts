export const formatVietnameseMoney = (value: number | string): string => {
  const amount = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(amount) || amount === 0) return "0 VNĐ";

  // Nếu số tiền từ 1,000 (tức là 1 triệu) trở lên
  if (amount >= 1000) {
    const millionPart = amount / 1000;
    // Kiểm tra xem có phần dư lẻ không (ví dụ 1.5 triệu)
    const formattedMillion = Number.isInteger(millionPart)
      ? millionPart.toString()
      : millionPart.toFixed(1).replace('.', ',');

    return `${formattedMillion} triệu VNĐ`;
  }

  // Nếu số tiền dưới 1,000 (tức là dưới 1 triệu)
  // Nhân với 1000 để ra số tiền thực tế
  return (amount * 1000).toLocaleString('vi-VN') + " VNĐ";
};