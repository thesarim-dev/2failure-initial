// Supabase Edge Function: "protect your flame" evening reminders.
// Runs hourly (see README). For each subscribed device whose local time is
// REMINDER_HOUR, sends one push if the player hasn't trained yet that day.
//
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@domain),
// CRON_SECRET. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const REMINDER_HOUR = 19;

const COPY: Record<string, { title: string; body: string }> = {
  en: { title: 'Your flame is waiting 🔥', body: "Two sets keep your streak alive today. Or take a rest day. Either way, don't let it go out." },
  he: { title: 'הלהבה שלך מחכה 🔥', body: 'שני סטים שומרים על הרצף היום. או קחו יום מנוחה. רק אל תתנו לה לכבות.' },
  ar: { title: 'شعلتك بانتظارك 🔥', body: 'مجموعتان تحافظان على سلسلتك اليوم. أو خذ يوم راحة. المهم ألا تنطفئ.' }
};

function localParts(timezone: string, now: Date): { day: string; hour: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) % 24 };
  } catch {
    return localParts('UTC', now);
  }
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('forbidden', { status: 403 });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@example.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, user_id, p256dh, auth, timezone, language, last_sent_on');
  if (error) return new Response(error.message, { status: 500 });

  const now = new Date();
  let sent = 0;
  for (const sub of subs ?? []) {
    const { day, hour } = localParts(sub.timezone, now);
    if (hour !== REMINDER_HOUR || sub.last_sent_on === day) continue;

    const { data: stats } = await supabase.from('user_stats').select('last_workout_date').eq('user_id', sub.user_id).maybeSingle();
    if (stats?.last_workout_date === day) continue; // Already trained today: no nudge.

    const copy = COPY[sub.language] ?? COPY.en;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...copy, url: '/', tag: 'flame-reminder' })
      );
      sent++;
      await supabase.from('push_subscriptions').update({ last_sent_on: day }).eq('endpoint', sub.endpoint);
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      // The device unsubscribed or the subscription expired: forget it.
      if (status === 404 || status === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});
