import { supabase } from '@/src/lib/supabase';

export type MediaKind = 'image' | 'video' | 'audio';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'audio/m4a': 'm4a', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
};

/** Envoie un fichier du téléphone dans le dossier du groupe et renvoie son chemin */
export async function uploadChatMedia(groupId: string, uri: string, mime: string) {
  const ext = EXT[mime] ?? uri.split('.').pop()?.toLowerCase() ?? 'bin';
  const path = `${groupId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from('chat-media').upload(path, body, { contentType: mime, upsert: false });
  if (error) throw error;
  return path;
}

const cache = new Map<string, { url: string; until: number }>();

/** Lien temporaire (1 h) vers un média du chat, mis en cache */
export async function mediaUrl(path: string) {
  const hit = cache.get(path);
  if (hit && hit.until > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from('chat-media').createSignedUrl(path, 3600);
  if (error || !data) throw error ?? new Error('Lien indisponible');
  cache.set(path, { url: data.signedUrl, until: Date.now() + 55 * 60_000 });
  return data.signedUrl;
}
