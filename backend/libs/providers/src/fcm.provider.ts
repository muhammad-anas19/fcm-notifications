import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type PushProvider, PushSendResult } from 'app/domain';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * Concrete FCM implementation of the framework-free `PushProvider` interface — the DIP "swap
 * point" from docs/03-project-architecture.md and docs/07-fcm-complete-guide.md. Nothing in
 * push-worker's business logic imports firebase-admin directly; it depends on `PushProvider`
 * only, so this file is the only place that would need to change to swap providers.
 */
@Injectable()
export class FcmProvider implements PushProvider, OnModuleInit {
  private readonly logger = new Logger(FcmProvider.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (getApps().length > 0) return;
    const credentialsPath = this.config.get<string>('FIREBASE_CREDENTIALS_PATH');
    if (!credentialsPath) throw new Error('FIREBASE_CREDENTIALS_PATH is not set');
    initializeApp({ credential: cert(credentialsPath) });
    this.logger.log('Firebase Admin initialized');
  }

  async send(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<PushSendResult> {
    try {
      // Both payloads on purpose — see docs/07-fcm-complete-guide.md: `notification` is
      // rendered by the OS tray when the app is backgrounded/killed; `data` always reaches
      // app code so it can render its own UI or run silent logic in the foreground.
      const providerMessageId = await getMessaging().send({
        token,
        notification: { title, body },
        data: stringifyData(data),
      });
      return { success: true, providerMessageId };
    } catch (err) {
      const code = (err as { errorInfo?: { code?: string } }).errorInfo?.code;
      const invalidToken = code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token';
      return { success: false, invalidToken, errorMessage: (err as Error).message };
    }
  }
}

/** FCM's `data` payload requires string values only. */
function stringifyData(data?: Record<string, unknown>): Record<string, string> | undefined {
  if (!data) return undefined;
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
}
