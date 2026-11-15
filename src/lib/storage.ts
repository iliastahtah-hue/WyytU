import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

type Bucket = 'photos' | 'selfies';

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Envoie une image (base64) dans le dossier de l'utilisateur et renvoie son chemin. */
export async function uploadImage(bucket: Bucket, userId: string, base64: string, opts?: { name?: string; mime?: string }) {
  const mime = opts?.mime ?? 'image/jpeg';
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${opts?.name ?? randomId()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, decode(base64), {
    contentType: mime,
    upsert: !!opts?.name,
  });
  if (error) throw error;
  return path;
}

/** Liens temporaires (1 h) pour afficher des photos d'un bucket privé. */
export async function signedUrls(bucket: Bucket, paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return {};
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, 3600);
  if (error || !data) return {};
  return Object.fromEntries(
    data.filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl as string]),
  );
}
