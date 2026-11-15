// Webhook RevenueCat → met à jour profiles.is_premium.
// Dans RevenueCat › Integrations › Webhooks : URL de cette fonction et
// en-tête Authorization = "Bearer <REVENUECAT_WEBHOOK_SECRET>".
// Le secret se règle dans Supabase › Edge Functions › Secrets.
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

const ACTIVATE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE']);
const DEACTIVATE = new Set(['EXPIRATION']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  // Sans secret configuré, on refuse tout (aucun risque d'activation gratuite)
  if (!SECRET || req.headers.get('Authorization') !== `Bearer ${SECRET}`) {
    return new Response('unauthorized', { status: 401 });
  }
  try {
    const { event } = await req.json();
    const userId: string | undefined = event?.app_user_id;
    if (!userId || !UUID.test(userId)) return new Response('ignored', { status: 200 });

    if (ACTIVATE.has(event.type)) {
      await admin.from('profiles').update({ is_premium: true }).eq('id', userId);
    } else if (DEACTIVATE.has(event.type)) {
      await admin.from('profiles').update({ is_premium: false }).eq('id', userId);
    }
    return new Response('ok', { status: 200 });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
