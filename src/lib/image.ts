const MAX_DATA_URL = 380_000;

export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen");
  }
  const bitmap = await createImageBitmap(file);
  let quality = 0.72;
  let maxPx = 960;
  let dataUrl = await render(bitmap, maxPx, quality);
  while (dataUrl.length > MAX_DATA_URL && (quality > 0.4 || maxPx > 480)) {
    if (dataUrl.length > MAX_DATA_URL * 1.4) maxPx = Math.round(maxPx * 0.75);
    else quality = Math.max(0.4, quality - 0.12);
    dataUrl = await render(bitmap, maxPx, quality);
  }
  bitmap.close();
  if (dataUrl.length > MAX_DATA_URL) {
    throw new Error("La foto es demasiado pesada. Prueba con otra.");
  }
  return dataUrl;
}

async function render(bitmap: ImageBitmap, maxPx: number, quality: number) {
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
