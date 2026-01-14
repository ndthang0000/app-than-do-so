import messaging from '@react-native-firebase/messaging';
import { api } from '@/services/api';
import { updateNotificationSettings } from '@/store/slices/authSlice';
import { PermissionsAndroid, Platform } from 'react-native';
import { navigate, navigationRef } from '@/navigators/navigationUtilities';
import Toast from 'react-native-toast-message';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

export const createNotificationChannel = async () => {
  // Tạo channel (chỉ cần chạy một lần, Android sẽ tự ghi nhớ)
  await notifee.createChannel({
    id: 'default_channel_id', // ID này phải khớp 100% với channelId từ Backend gửi về
    name: 'Thông báo kết quả',
    importance: AndroidImportance.HIGH, // Cấp độ HIGH/MAX mới hiện Pop-up
    sound: 'default',
    vibration: true,
  });
};

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
  // 1. Lắng nghe tin nhắn khi App đang mở (Foreground) - FIREBASE
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    handleForegroundMessage(remoteMessage);
  });

  // 2. Lắng nghe sự kiện nhấn của NOTIFEE (Bắt cả Foreground và Background)
  const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      // Detail của Notifee chứa data trực tiếp trong notification
      handleNotificationAction(detail.notification);
    }
  });

  // 3. Lắng nghe khi User nhấn vào thông báo từ trạng thái Background - FIREBASE
  messaging().onNotificationOpenedApp((remoteMessage) => {
    handleNotificationAction(remoteMessage);
  });

  // 4. Kiểm tra App mở từ trạng thái Quit - FIREBASE
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        const checkNavReady = setInterval(() => {
          if (navigationRef.isReady()) {
            handleNotificationAction(remoteMessage);
            clearInterval(checkNavReady);
          }
        }, 200);
        setTimeout(() => clearInterval(checkNavReady), 5000);
      }
    });

  // Trả về hàm cleanup để useEffect gọi
  return () => {
    unsubscribeForeground();
    unsubscribeNotifee();
  };
};

/**
 * Xử lý hiển thị notification khi app đang ở foreground
 */
const handleForegroundMessage = (remoteMessage: any) => {
  const { notification, data } = remoteMessage;

  // Hiển thị Toast với UI giống notification native
  Toast.show({
    type: 'notification', // Custom type với UI đẹp giống notification thật
    text1: notification?.title || 'Thông báo mới',
    text2: notification?.body || '',
    visibilityTime: 5000,
    autoHide: true,
    topOffset: Platform.OS === 'ios' ? 50 : 10,
    position: 'top',
    onPress: () => {
      // Khi user tap vào Toast, xử lý navigation
      Toast.hide();
      handleNotificationAction(remoteMessage);
    },
  });
};


const handleNotificationAction = (remoteMessage: any) => {
  const data = remoteMessage.data;
  if (data?.screen === "Result") {
    // Navigate trực tiếp bằng helper của Ignite
    navigate("Result", {
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