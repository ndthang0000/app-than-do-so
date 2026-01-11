
import IconManualInput from "@assets/svg/input-manual.svg";
import IconMyTicket from "@assets/svg/my-ticket.svg";
import IconCalendar from "@assets/svg/calendar.svg";
import { startOfDay, addMinutes, isAfter } from 'date-fns';
import { Region } from "./lotteryTicket";

export const REGION_DATA = [
  {
    id: 'north',
    name: 'Bắc',
    image: require('assets/images/region/bac.png'),
    color: "#f4a04cff",
    regionCode: 'MB',
  },
  {
    id: 'central',
    name: 'Trung',
    image: require('assets/images/region/trung.png'),
    color: "#4cb5eaff",
    regionCode: 'MT',
  },
  {
    id: 'south',
    name: 'Nam',
    image: require('assets/images/region/nam.png'),
    color: "#31c266ff",
    regionCode: 'MN',
  },
];

export const dataSubMenu = [
  {
    icon: IconManualInput,
    label: 'Nhập vé',
    navigate: 'ManualInput',
  },
  {
    icon: IconMyTicket,
    label: 'Vé của tôi',
    navigate: 'MyTicket',
  },
  {
    icon: IconCalendar,
    label: 'Lịch xổ số',
    navigate: 'Schedule',
  },
]

export const getStatusTag = (region: Region) => {
  const now = new Date();
  const todayStart = startOfDay(now);

  // Định nghĩa số phút tính từ 00:00 sáng
  const schedules = {
    south: 16 * 60 + 15, // 16:15
    central: 17 * 60 + 15, // 17:15
    north: 18 * 60 + 15, // 18:15
  };

  const startMinutes = schedules[region as keyof typeof schedules];
  const startTime = addMinutes(todayStart, startMinutes);
  const liveStartTime = addMinutes(startTime, -5); // Trước 5p
  const liveEndTime = addMinutes(startTime, 25);   // Quay trong khoảng 25p

  // 1. Kiểm tra trạng thái LIVE (Từ -5p đến +25p so với giờ bắt đầu)
  if (isAfter(now, liveStartTime) && !isAfter(now, liveEndTime)) {
    return {
      label: '🔴 LIVE',
      color: '#ef4444',
      bgColor: '#fee2e2',
      status: 'live',
      borderColor: '#fecaca',
    };
  }

  // 2. Kiểm tra trạng thái HÔM NAY (Sau khi quay xong và trước 00:00)
  if (isAfter(now, liveEndTime)) {
    return {
      label: 'Hôm nay',
      color: '#15803d',
      bgColor: '#dcfce7',
      status: 'today',
      borderColor: '#bbf7d0',
    };
  }

  // 3. Mặc định là HÔM QUA (Trước giờ LIVE 5 phút)
  return {
    label: 'Hôm qua',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    status: 'yesterday',
    borderColor: '#d1d5db',
  };
};