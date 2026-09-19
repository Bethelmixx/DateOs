const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
const MAX_DATA_URL_CHARS = 380_000;
const MAX_DECODED_BYTES = 280 * 1024;

export function assertImageDataUrl(value: string, label = "La foto"): void {
  if (value.length > MAX_DATA_URL_CHARS) {
    throw new Error(`${label} es demasiado pesada.`);
  }
  if (!IMAGE_DATA_URL.test(value)) {
    throw new Error(`${label} no es una imagen válida (usa JPEG, PNG o WebP).`);
  }
  const payload = value.slice(value.indexOf(",") + 1);
  const decoded = Buffer.from(payload, "base64");
  if (decoded.length > MAX_DECODED_BYTES) {
    throw new Error(`${label} es demasiado pesada.`);
  }
}
