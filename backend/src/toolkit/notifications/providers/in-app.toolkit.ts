import {
  INotificationProvider,
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from "../interfaces/INotificationProvider.js";

export interface InAppToolkitConfig {
  /**
   * Optional socket or pub/sub broadcaster function (e.g. Socket.IO instance or Redis pub/sub)
   */
  broadcaster?: (userId: string, event: string, data: any) => Promise<void> | void;
}

export class InAppNotificationToolkit implements INotificationProvider {
  public readonly channel: NotificationChannel = "INAPP";
  private readonly config: InAppToolkitConfig;

  constructor(config: InAppToolkitConfig = {}) {
    this.config = config;
  }

  /**
   * Dispatches an In-App notification targeted at a specific User ID.
   * Can emit over live WebSockets (Socket.IO room `user:<userId>`) and prepares payload for DB persistence.
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    const messageId = `inapp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      if (!payload.recipient || !payload.content) {
        throw new Error("Recipient User ID and content are required for In-App notification.");
      }

      const notificationData = {
        id: messageId,
        userId: payload.recipient,
        title: payload.title || "AquaFlow Alert",
        message: payload.content,
        metadata: payload.metadata || {},
        createdAt: timestamp,
        isRead: false,
      };

      // If a real-time socket broadcaster is attached, emit live to user's personal room
      if (this.config.broadcaster) {
        await this.config.broadcaster(payload.recipient, "new_notification", notificationData);
      } else {
        // Fallback for development/sandbox
        console.log(`\x1b[35m[InAppNotificationToolkit]\x1b[0m 🔔 User: ${payload.recipient}`);
        console.log(`\x1b[35m[InAppNotificationToolkit]\x1b[0m 📌 Title: ${notificationData.title}`);
        console.log(`\x1b[35m[InAppNotificationToolkit]\x1b[0m 💬 Message: ${notificationData.message}`);
      }

      return {
        success: true,
        messageId,
        channel: this.channel,
        timestamp,
      };
    } catch (error: any) {
      console.error(`[InAppNotificationToolkit Error]: Failed to dispatch notification to user ${payload.recipient}`, error);
      return {
        success: false,
        channel: this.channel,
        timestamp,
        error: error?.message || "Unknown In-App dispatch error",
      };
    }
  }

  /**
   * High-level shortcut for delivery status changes (e.g., Out for delivery, Delivered)
   */
  async notifyDeliveryUpdate(userId: string, orderNumber: string, status: string): Promise<NotificationResult> {
    return this.send({
      recipient: userId,
      title: `Order #${orderNumber} Update`,
      content: `Your water bottle delivery is now: ${status}`,
      metadata: { orderNumber, status, link: `/portal/orders/${orderNumber}` },
    });
  }
}

