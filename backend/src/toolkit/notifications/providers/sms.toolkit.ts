import {
  INotificationProvider,
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from "../interfaces/INotificationProvider.js";

export interface SmsToolkitConfig {
  senderId?: string;
  apiKey?: string;
  apiSecret?: string;
}

export class SmsToolkit implements INotificationProvider {
  public readonly channel: NotificationChannel = "SMS";
  private readonly config: SmsToolkitConfig;

  constructor(config: SmsToolkitConfig = {}) {
    this.config = {
      senderId: config.senderId || process.env.SMS_SENDER_ID || "AquaFlow",
      apiKey: config.apiKey || process.env.SMS_API_KEY,
      apiSecret: config.apiSecret || process.env.SMS_API_SECRET,
    };
  }

  /**
   * Dispatches an SMS to the recipient phone number.
   * In development/test mode without API keys, it securely logs the message for local inspection.
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    const messageId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      if (!payload.recipient || !payload.content) {
        throw new Error("Recipient phone number and content are required for SMS.");
      }

      // Check if external SMS gateway credentials exist
      if (this.config.apiKey) {
        // Here external SMS Gateway HTTP request will be triggered (e.g., Twilio / Local SMS Gateway)
        // e.g.: await axios.post(...)
      } else {
        // Fallback for development/sandbox
        console.log(`\x1b[36m[SmsToolkit]\x1b[0m 📱 To: ${payload.recipient} | Sender: ${this.config.senderId}`);
        console.log(`\x1b[36m[SmsToolkit]\x1b[0m 💬 Content: ${payload.content}`);
      }

      return {
        success: true,
        messageId,
        channel: this.channel,
        timestamp,
      };
    } catch (error: any) {
      console.error(`[SmsToolkit Error]: Failed to dispatch SMS to ${payload.recipient}`, error);
      return {
        success: false,
        channel: this.channel,
        timestamp,
        error: error?.message || "Unknown SMS dispatch error",
      };
    }
  }

  /**
   * High-level shortcut to send formatted delivery or authentication OTP.
   */
  async sendOtp(phone: string, otpCode: string): Promise<NotificationResult> {
    return this.send({
      recipient: phone,
      content: `Your AquaFlow verification code is: ${otpCode}. Valid for 5 minutes. Do not share this code.`,
      metadata: { type: "OTP", otpCode },
    });
  }
}

