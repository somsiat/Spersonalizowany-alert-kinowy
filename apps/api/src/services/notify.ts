
import webpush from 'web-push';
import { Resend } from 'resend';
import { env } from '../env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:support@example.com', env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) return;
  await resend.emails.send({ from: 'Kino Alert <alerts@your-domain>', to, subject, html });
}

export async function sendWebPush(subscription: any, payload: any) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
