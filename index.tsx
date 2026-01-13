import "@expo/metro-runtime"
import { registerRootComponent } from "expo"
import messaging from '@react-native-firebase/messaging'; // Import thêm cái này
import { App } from "@/app"

// 1. Đăng ký xử lý thông báo chạy ngầm (Background/Quit)
// Lưu ý: Phải đặt TRƯỚC registerRootComponent
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('--- NHẬN DATA KHI APP ĐANG ĐÓNG ---');
  console.log('Payload:', remoteMessage.data);

  // Bạn có thể xử lý logic như lưu vào Storage ngầm ở đây
  // Tránh các hàm liên quan đến UI (Alert, Toast...)
});

// 2. Đăng ký Root Component của App
registerRootComponent(App)