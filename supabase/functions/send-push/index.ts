// Envoie une notification WyytU sur les téléphones de son destinataire (Expo Push).
// Appelée par le trigger `notifications_push` avec { id }.
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type Notif = { id: string; user_id: string; type: string; payload: Record<string, string> };

function text(n: Notif, group: string, name: string): { title: string; body: string } {
  switch (n.type) {
    case 'join_request':
      return { title: 'Nouvelle demande 🙋', body: `${name} veut rejoindre « ${group} »` };
    case 'join_accepted':
      return { title: 'C’est validé 🎉', body: `Tu fais partie de « ${group} »` };
    case 'join_declined':
      return { title: 'Demande non retenue', body: `Pour « ${group} ». D’autres sorties t’attendent !` };
    case 'now_co_organizer':
      return { title: 'Tu reprends le groupe 👑', body: `L’organisateur est parti : tu es co-organisateur de « ${group} »` };
    case 'no_show':
      return { title: 'Absence enregistrée', body: `Pour « ${group} ». Tu peux contester sous 72 h.` };
    case 'confirm_reminder':
      return { title: 'Tu viens toujours ? ⏰', body: `Confirme ta venue pour « ${group} »` };
    default:
      return { title: 'WyytU', body: 'Nouvelle activité sur ton compte' };
  }
}

Deno.serve(async (req) => {
  try {
    const { id } = await req.json();
    if (typeof id !== 'string') return new Response('bad request', { status: 400 });

    // Réservation atomique : une notification n'est poussée qu'une fois.
    const { data: notif } = await admin
      .from('notifications')
      .update({ pushed_at: new Date().toISOString() })
      .eq('id', id)
      .is('pushed_at', null)
      .select('id, user_id, type, payload')
      .maybeSingle<Notif>();
    if (!notif) return new Response('already sent', { status: 200 });

    const { data: tokens } = await admin.from('push_tokens').select('token').eq('user_id', notif.user_id);
    if (!tokens?.length) return new Response('no device', { status: 200 });

    const [{ data: g }, { data: p }] = await Promise.all([
      notif.payload.group_id
        ? admin.from('groups').select('title').eq('id', notif.payload.group_id).maybeSingle()
        : Promise.resolve({ data: null }),
      notif.payload.user_id
        ? admin.from('profiles').select('first_name').eq('id', notif.payload.user_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const { title, body } = text(notif, g?.title ?? 'ta sortie', p?.first_name ?? 'Quelqu’un');

    const messages = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      sound: 'default',
      data: { type: notif.type, group_id: notif.payload.group_id ?? null },
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    const json = await res.json().catch(() => null);

    // Nettoie les jetons d'appareils désinstallés
    const dead: string[] = [];
    (json?.data ?? []).forEach((r: { status: string; details?: { error?: string } }, i: number) => {
      if (r.status === 'error' && r.details?.error === 'DeviceNotRegistered') dead.push(messages[i].to);
    });
    if (dead.length) await admin.from('push_tokens').delete().in('token', dead);

    return new Response('ok', { status: 200 });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
