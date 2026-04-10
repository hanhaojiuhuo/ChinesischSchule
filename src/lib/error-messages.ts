/**
 * Centralized trilingual error messages used across API routes.
 *
 * Each message is a single string combining German / English / Chinese
 * variants separated by " / " to match the existing convention.
 */

export const ErrorMessages = {
  INTERNAL_SERVER_ERROR:
    "Internal server error / Interner Serverfehler / 服务器内部错误",
  RATE_LIMITED:
    "Too many requests. Please try again later. / Zu viele Anfragen. Bitte versuchen Sie es später erneut. / 请求过于频繁，请稍后重试。",
  RATE_LIMITED_VERIFY:
    "Too many verification attempts. Please try again later. / Zu viele Versuche. / 验证尝试过于频繁，请稍后重试。",
  INVALID_OR_EXPIRED_CODE:
    "Invalid or expired code / Ungültiger oder abgelaufener Code / 验证码无效或已过期",
  OTP_NOT_CONFIGURED:
    "OTP service not configured",
  EMAIL_NOT_CONFIGURED:
    "Email service not configured (RESEND_API_KEY missing)",
  INVALID_ACTION:
    "Invalid action",
} as const;
