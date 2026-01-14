import messaging from '@react-native-firebase/messaging';
import { api } from '@/services/api';
import { updateNotificationSettings } from '@/store/slices/authSlice';
import { PermissionsAndroid, Platform } from 'react-native';
import { navigate, navigationRef } from '@/navigators/navigationUtilities';
import Toast from 'react-native-toast-message';

export const requestUserPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
};

export const syncNotificationSettings = async (
  dispatch: any,
  currentSettings: any,
  newUpdates: any
) => {
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) {
      return { success: false, error: 'Quyền thông báo bị từ chối' };
    }

    const fcmToken = await messaging().getToken();

    // Map lại settings cho đúng chuẩn API (Ví dụ: ticketResult: true)
    const payload = {
      fcmToken,
      ...currentSettings,
      ...newUpdates
    };

    const response = await api.subscribeToNotificationTopic(payload);

    if (response.kind === "ok") {
      dispatch(updateNotificationSettings(newUpdates));
      return { success: true };
    }
    return { success: false, message: response.kind };
  } catch (error) {
    console.error("Lỗi đồng bộ thông báo:", error);
    return { success: false, error };
  }
};

export const setupCloudMessaging = async () => {
  // 1. Lắng nghe tin nhắn khi App đang mở (Foreground)
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    handleForegroundMessage(remoteMessage);
  });

  // 2. Lắng nghe khi User nhấn vào thông báo từ trạng thái Background
  messaging().onNotificationOpenedApp((remoteMessage) => {
    handleNotificationAction(remoteMessage);
  });

  // 3. Kiểm tra xem App có được mở từ trạng thái Quit hay không
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        // Sử dụng Interval để đợi Navigation sẵn sàng (chuẩn Ignite)
        const checkNavReady = setInterval(() => {
          if (navigationRef.isReady()) {
            handleNotificationAction(remoteMessage);
            clearInterval(checkNavReady);
          }
        }, 200);
        setTimeout(() => clearInterval(checkNavReady), 5000); // Stop sau 5s
      }
    });

  // Trả về hàm unsubscribe để useEffect sử dụng
  return unsubscribeForeground;
};

/**
 * Xử lý hiển thị notification khi app đang ở foreground
 */
const handleForegroundMessage = (remoteMessage: any) => {
  const { notification, data } = remoteMessage;

  console.log("Foreground message received:", remoteMessage);

  // Hiển thị Toast với title và body từ notification
  Toast.show({
    type: 'success', // Có thể đổi thành 'info', 'error' tùy loại notification
    text1: notification?.title || 'Thông báo mới',
    text2: notification?.body || '',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 60,
    onPress: () => {
      // Khi user tap vào Toast, xử lý navigation
      Toast.hide();
      handleNotificationAction(remoteMessage);
    },
  });
};


const handleNotificationAction = (remoteMessage: any) => {
  const data = remoteMessage.data;
  if (data?.screen === "ResultDetail") {
    // Navigate trực tiếp bằng helper của Ignite
    navigate("ResultDetail", {
      region: data.region
    })
  }
  else if (data?.screen === "TicketDetail") {
    navigate("TicketDetail", {
      ticketId: data.ticketId,
      source: "notification"
    })
  }
};