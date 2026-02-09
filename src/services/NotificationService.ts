import { Client } from '@line/bot-sdk';
import { NotificationLog, IRepairRequest } from '../models';

const MAX_RETRIES = 3;

export class NotificationService {
  private client: Client | null = null;
  private circuitBreakerOpen = false;
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private LINE_CHANNEL_ACCESS_TOKEN: string;
  private LINE_GROUP_ID: string;

  constructor() {
    // Read environment variables in constructor to ensure dotenv has loaded
    this.LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
    this.LINE_GROUP_ID = process.env.LINE_GROUP_ID || '';
    
    console.log('🔍 LINE Configuration Debug:');
    console.log('  - LINE_CHANNEL_ACCESS_TOKEN:', this.LINE_CHANNEL_ACCESS_TOKEN ? `${this.LINE_CHANNEL_ACCESS_TOKEN.substring(0, 20)}...` : 'NOT SET');
    console.log('  - LINE_GROUP_ID:', this.LINE_GROUP_ID || 'NOT SET');
    
    if (this.LINE_CHANNEL_ACCESS_TOKEN) {
      this.client = new Client({
        channelAccessToken: this.LINE_CHANNEL_ACCESS_TOKEN
      });
      console.log('✅ LINE Official Account configured');
    } else {
      console.log('⚠️ LINE_CHANNEL_ACCESS_TOKEN not found in environment variables');
    }
  }

  async sendNewRequestNotification(request: IRepairRequest): Promise<void> {
    if (!this.client || !this.LINE_GROUP_ID) {
      console.log('LINE notification not configured, skipping...');
      return;
    }

    if (this.circuitBreakerOpen) {
      if (this.shouldAttemptReset()) {
        this.circuitBreakerOpen = false;
        this.failureCount = 0;
      } else {
        console.log('Circuit breaker is open, queuing notification for retry');
        await this.queueForRetry(request._id.toString());
        return;
      }
    }

    await this.sendWithRetry(request);
  }

  private async sendWithRetry(request: IRepairRequest, attempt: number = 1): Promise<void> {
    try {
      const message = this.formatNotificationMessage(request);
      
      await this.client!.pushMessage(this.LINE_GROUP_ID, {
        type: 'text',
        text: message
      });

      await NotificationLog.create({
        requestId: request._id,
        status: 'success',
        retryCount: attempt - 1,
        sentAt: new Date()
      });

      this.onSuccess();
      console.log(`✅ LINE notification sent successfully for request ${request._id}`);
    } catch (error: any) {
      console.error(`❌ Failed to send LINE notification (attempt ${attempt}):`, error.message);

      await NotificationLog.create({
        requestId: request._id,
        status: 'failed',
        errorMessage: error.message,
        retryCount: attempt - 1
      });

      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await this.sleep(delay);
        return this.sendWithRetry(request, attempt + 1);
      } else {
        this.onFailure();
        await this.queueForRetry(request._id.toString());
        throw new Error(`Failed to send notification after ${MAX_RETRIES} attempts`);
      }
    }
  }

  private formatNotificationMessage(request: IRepairRequest): string {
    // Convert to Thailand timezone (UTC+7)
    const thaiDate = new Date(request.createdAt).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return `
🔧 แจ้งซ่อมอุปกรณ์ IT ใหม่

📋 หัวข้อ: ${request.title}
🖥️ ประเภทอุปกรณ์: ${request.equipmentType}
🏢 แผนก: ${request.department}
👤 ผู้แจ้ง: ${request.reporterName}
${request.location ? `📍 สถานที่: ${request.location}` : ''}

📝 รายละเอียด:
${request.problemDescription}

🆔 รหัสคำขอ: ${request.requestNumber}
📅 วันที่แจ้ง: ${thaiDate}
    `.trim();
  }

  async sendCancelNotification(request: IRepairRequest): Promise<void> {
    if (!this.client || !this.LINE_GROUP_ID) {
      console.log('LINE notification not configured, skipping...');
      return;
    }

    try {
      // Convert to Thailand timezone (UTC+7)
      const thaiDate = new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const message = `
❌ ยกเลิกการแจ้งซ่อม

📋 หัวข้อ: ${request.title}
🖥️ ประเภทอุปกรณ์: ${request.equipmentType}
🏢 แผนก: ${request.department}
👤 ผู้แจ้ง: ${request.reporterName}

🆔 รหัสคำขอ: ${request.requestNumber}
📅 วันที่ยกเลิก: ${thaiDate}

ℹ️ เหตุผล: ยกเลิกโดยผู้แจ้ง
      `.trim();

      await this.client.pushMessage(this.LINE_GROUP_ID, {
        type: 'text',
        text: message
      });

      console.log(`✅ LINE cancellation notification sent for request ${request._id}`);
    } catch (error: any) {
      console.error(`❌ Failed to send LINE cancellation notification:`, error.message);
    }
  }

  private async queueForRetry(requestId: string): Promise<void> {
    await NotificationLog.create({
      requestId,
      status: 'pending',
      retryCount: 0
    });
  }

  async retryFailedNotifications(): Promise<void> {
    const failedLogs = await NotificationLog.find({
      status: 'pending',
      retryCount: { $lt: MAX_RETRIES }
    }).populate('requestId');

    for (const log of failedLogs) {
      try {
        if (log.requestId && typeof log.requestId !== 'string') {
          await this.sendNewRequestNotification(log.requestId as any);
        }
      } catch (error) {
        console.error(`Failed to retry notification for request ${log.requestId}:`, error);
      }
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.circuitBreakerOpen = false;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= 5) {
      this.circuitBreakerOpen = true;
      console.warn('⚠️ Circuit breaker opened due to repeated failures');
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure > 60000; // 1 minute
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const notificationService = new NotificationService();
