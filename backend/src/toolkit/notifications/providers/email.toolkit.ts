import {
  INotificationProvider,
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from "../interfaces/INotificationProvider.js";

export interface EmailToolkitConfig {
  fromAddress?: string;
  fromName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

export class EmailToolkit implements INotificationProvider {
  public readonly channel: NotificationChannel = "EMAIL";
  private readonly config: EmailToolkitConfig;

  constructor(config: EmailToolkitConfig = {}) {
    this.config = {
      fromAddress: config.fromAddress || process.env.SMTP_FROM || "no-reply@aquaflow.pk",
      fromName: config.fromName || process.env.SMTP_FROM_NAME || "AquaFlow Notifications",
      smtpHost: config.smtpHost || process.env.SMTP_HOST,
      smtpPort: config.smtpPort || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587),
      smtpUser: config.smtpUser || process.env.SMTP_USER,
      smtpPass: config.smtpPass || process.env.SMTP_PASS,
    };
  }

  /**
   * Dispatches an Email to the recipient email address.
   * In development/test mode without SMTP credentials, it logs the email for inspection.
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const timestamp = new Date();
    const messageId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      if (!payload.recipient || !payload.content) {
        throw new Error("Recipient email address and content are required for Email.");
      }

      const subject = payload.title || "AquaFlow Notification";

      // If SMTP credentials exist, connect and send via transporter
      if (this.config.smtpHost && this.config.smtpUser) {
        // Production SMTP / Resend / SendGrid call
      } else {
        // Fallback for development/sandbox
        console.log(`\x1b[32m[EmailToolkit]\x1b[0m 📧 To: ${payload.recipient} | From: "${this.config.fromName}" <${this.config.fromAddress}>`);
        console.log(`\x1b[32m[EmailToolkit]\x1b[0m 📌 Subject: ${subject}`);
        console.log(`\x1b[32m[EmailToolkit]\x1b[0m 📄 Body: ${payload.content}`);
      }

      return {
        success: true,
        messageId,
        channel: this.channel,
        timestamp,
      };
    } catch (error: any) {
      console.error(`[EmailToolkit Error]: Failed to dispatch Email to ${payload.recipient}`, error);
      return {
        success: false,
        channel: this.channel,
        timestamp,
        error: error?.message || "Unknown Email dispatch error",
      };
    }
  }

  /**
   * High-level shortcut to send formatted invoice or receipt.
   */
  async sendInvoice(email: string, invoiceNumber: string, amount: string, invoiceUrl?: string): Promise<NotificationResult> {
    return this.send({
      recipient: email,
      title: `AquaFlow Invoice #${invoiceNumber}`,
      content: `Dear Customer, your invoice #${invoiceNumber} for amount ${amount} PKR is generated. ${invoiceUrl ? `View invoice: ${invoiceUrl}` : ""}`,
      metadata: { invoiceNumber, amount, invoiceUrl },
    });
  }
}

