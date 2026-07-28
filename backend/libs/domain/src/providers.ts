/** Framework-free provider contracts — the DIP "swap points" from docs/03-project-architecture.md.
 * A worker depends on this interface, never on the concrete FCM/SendGrid SDK directly, so the
 * concrete implementation (libs/providers) can be swapped without touching worker code. */

export interface PushSendResult {
  success: boolean;
  providerMessageId?: string;
  /** Set when the token itself is bad (unregistered/invalid) — the caller should deactivate it,
   * not retry. See docs/07-fcm-complete-guide.md. */
  invalidToken?: boolean;
  errorMessage?: string;
}

export interface PushProvider {
  send(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<PushSendResult>;
}

export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');
