/**
 * Comprime y redimensiona una imagen antes de subirla a sesiones clínicas.
 * D1 limita cada celda TEXT a 2 MB; en base64 ~1,3 MB de binario es el techo seguro.
 */

/** Lado máximo en píxeles. */
const MAX_SIDE_PX = 1400;
/** Objetivo de binario tras comprimir (base64 ≈ +33 %). */
const TARGET_BINARY_BYTES = 900_000;
const MIN_WEBP_QUALITY = 0.45;
const INITIAL_WEBP_QUALITY = 0.82;

function binaryLengthFromDataUrl(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl.length;
  const base64 = dataUrl.slice(comma + 1).replace(/\s/g, "");
  return Math.floor((base64.length * 3) / 4);
}

/**
 * Redimensiona y comprime un archivo de imagen a WebP para sesión clínica.
 * Devuelve un data URI listo para enviar al API (image/webp;base64,...).
 */
export function compressImageForSession(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        let width = w;
        let height = h;
        if (w > MAX_SIDE_PX || h > MAX_SIDE_PX) {
          if (w >= h) {
            width = MAX_SIDE_PX;
            height = Math.round((h * MAX_SIDE_PX) / w);
          } else {
            height = MAX_SIDE_PX;
            width = Math.round((w * MAX_SIDE_PX) / h);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo crear el contexto del canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let quality = INITIAL_WEBP_QUALITY;
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl || !dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        }

        while (
          dataUrl.startsWith("data:image/webp") &&
          binaryLengthFromDataUrl(dataUrl) > TARGET_BINARY_BYTES &&
          quality > MIN_WEBP_QUALITY
        ) {
          quality = Math.max(MIN_WEBP_QUALITY, quality - 0.08);
          dataUrl = canvas.toDataURL("image/webp", quality);
        }

        if (binaryLengthFromDataUrl(dataUrl) > TARGET_BINARY_BYTES * 1.15) {
          reject(
            new Error(
              "La imagen sigue siendo demasiado pesada tras comprimir. Pruebe con otra foto o recorte la imagen."
            )
          );
          return;
        }

        resolve(dataUrl);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Error al procesar la imagen"));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };

    img.src = url;
  });
}
