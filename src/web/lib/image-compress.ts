/**
 * Comprime y redimensiona una imagen antes de subirla a sesiones clínicas.
 * Pensado para fotos 4K de iPhone/cámara: el usuario no cambia la cámara; la app
 * reduce tamaño y peso (max 1600px, WebP) para aligerar respaldo y BD.
 * WebP suele dar menor tamaño que JPEG con calidad similar; el backend acepta image/webp.
 */

/** Lado máximo en píxeles (ej. 1600 → foto 4K queda ~1600 en el lado largo). */
const MAX_SIDE_PX = 1600;
/** Calidad WebP (0–1). 0.85 suele dar buen equilibrio tamaño/calidad; WebP comprime mejor que JPEG. */
const WEBP_QUALITY = 0.85;

/**
 * Redimensiona y comprime un archivo de imagen a WebP para sesión clínica.
 * Devuelve un data URI listo para enviar al API (image/webp;base64,...).
 * Si falla (archivo no imagen, canvas sin WebP, etc.), lanza.
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

        let dataUrl = canvas.toDataURL("image/webp", WEBP_QUALITY);
        if (!dataUrl || !dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.82);
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
