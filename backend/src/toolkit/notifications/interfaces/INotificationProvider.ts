export type NotificationChannel = 'SMS' | 'EMAIL' | 'INAPP';

export interface NotificationPayload {
  /**
   * Recipient identifier:
   * - SMS: Mobile number (e.g. +923001234567)
   * - EMAIL: Email address (e.g. customer@example.com)
   * - IN_APP: User UUID (e.g. 123e4567-e89b-12d3-a456-426614174000)
   */
  recipient: string;
  title?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  channel: NotificationChannel;
  timestamp: Date;
  error?: string;
}

export interface INotificationProvider {
  readonly channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

