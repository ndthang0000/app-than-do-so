import messaging from '@react-native-firebase/messaging';
import { api } from '@/services/api';
import { updateNotificationSettings } from '@/store/slices/authSlice';

export const syncNotificationSettings = async (
  dispatch: any,
  currentSettings: any,
  newUpdates: any
) => {
  try {
    // Sử dụng instance của messaging
    const messagingInstance = messaging();

    // 1. Yêu cầu quyền
    const authStatus = await messagingInstance.requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      return { success: false, error: 'Quyền thông báo bị từ chối' };
    }

    // 2. Lấy Token thiết bị
    const fcmToken = await messagingInstance.getToken();

    // 3. Chuẩn bị payload (Gộp settings cũ và mới)
    const payload = {
      fcmToken,
      ...currentSettings,
      ...newUpdates
    };

    // 4. Gọi API POST /notifications/subscribe-topic
    const response = await api.subscribeToNotificationTopic(payload);

    if (response.kind === "ok") {
      // 5. Cập nhật Redux để UI thay đổi ngay lập tức
      dispatch(updateNotificationSettings(newUpdates));
      return { success: true };
    }
    return { success: false, message: response.kind };
  } catch (error) {
    console.error("Lỗi đồng bộ thông báo:", error);
    return { success: false, error };
  }
};