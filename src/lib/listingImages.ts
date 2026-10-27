import { supabase } from "@/integrations/supabase/client";

const BUCKET = "car-images";
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadListingImages(userId: string, files: File[]): Promise<string[]> {
  const uploaded: string[] = [];

  try {
    for (const file of files) {
      const extension = MIME_EXTENSIONS[file.type];
      if (!extension) throw new Error("Use JPG, PNG, or WebP photos.");
      if (file.size > 10 * 1024 * 1024) throw new Error("Each photo must be 10 MB or smaller.");

      // The first path segment is the authenticated user's ID, as required by Storage RLS.
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;

      uploaded.push(path);
    }
  } catch (error) {
    if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
    throw error;
  }

  return uploaded.map((path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
}

function ownStoragePath(userId: string, imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    return path.startsWith(`${userId}/`) ? path : null;
  } catch {
    return null;
  }
}

export async function removeListingImages(userId: string, imageUrls: string[]): Promise<void> {
  const paths = imageUrls
    .map((url) => ownStoragePath(userId, url))
    .filter((path): path is string => Boolean(path));
  if (!paths.length) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}
