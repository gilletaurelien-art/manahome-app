// Compression photo côté client — zéro dépendance (doctrine vitesse).
// Canvas + toDataURL(jpeg) : les photos ne quittent jamais le navigateur
// en démo ; en prod, ce même pipeline enverra vers S3 (OVH/RustFS).

const COTE_MAX = 1280;
const QUALITE = 0.82;
const MAX_PHOTOS = 8;

export async function compresserPhoto(fichier: File): Promise<string> {
  const bitmap = await chargerImage(fichier);
  const echelle = Math.min(1, COTE_MAX / Math.max(bitmap.width, bitmap.height));
  const l = Math.round(bitmap.width * echelle);
  const h = Math.round(bitmap.height * echelle);
  const canvas = document.createElement("canvas");
  canvas.width = l;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, l, h);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITE);
}

async function chargerImage(fichier: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(fichier);
    } catch {
      // repli : <img> classique
    }
  }
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(fichier);
  });
}

export const LIMITE_PHOTOS = MAX_PHOTOS;
