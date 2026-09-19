const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
const MAX_DATA_URL_CHARS = 380_000;
const MAX_DECODED_BYTES = 280 * 1024;

function sniffImage(buf: Buffer): "jpeg" | "png" | "webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "png";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export function assertImageDataUrl(value: string, label = "La foto"): void {
  if (value.length > MAX_DATA_URL_CHARS) {
    throw new Error(`${label} es demasiado pesada.`);
  }
  const match = IMAGE_DATA_URL.exec(value);
  if (!match) {
    throw new Error(`${label} no es una imagen válida (usa JPEG, PNG o WebP).`);
  }
  const declared = match[1] as "jpeg" | "png" | "webp";
  const payload = value.slice(value.indexOf(",") + 1);
  const decoded = Buffer.from(payload, "base64");
  if (decoded.length > MAX_DECODED_BYTES) {
    throw new Error(`${label} es demasiado pesada.`);
  }
  const kind = sniffImage(decoded);
  if (!kind || kind !== declared) {
    throw new Error(`${label} no es una imagen válida (usa JPEG, PNG o WebP).`);
  }
}
