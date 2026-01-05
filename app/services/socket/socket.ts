import Config from '@/config';
import { io } from 'socket.io-client';

// 10.0.2.2 là IP đặc biệt để Android Emulator truy cập vào localhost của máy tính
const SOCKET_URL = `${Config.API_URL}/lottery`;

export const socket = io(SOCKET_URL, {
  transports: ['websocket'], // Ưu tiên dùng websocket để ổn định
  autoConnect: false,         // Để chúng ta tự kiểm soát lúc nào connect
});