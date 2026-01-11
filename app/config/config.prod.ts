/**
 * These are configuration settings for the production environment.
 *
 * Do not include API secrets in this file or anywhere in your JS.
 *
 * https://reactnative.dev/docs/security#storing-sensitive-info
 */

// Nếu dùng Android Emulator
// API_URL=http://10.0.2.2:3425

// Nếu dùng thiết bị thật (thay bằng IP máy bạn)
// API_URL=http://192.168.1.16:3425
export default {
  API_URL: "https://api-dev.thandoso.com",
}
