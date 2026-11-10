// Versión 4:5 (1080 × 1350) para Instagram: la foto se ajusta completa dentro del lienzo y el resto se
// completa con el gris del fondo de estudio del catálogo (#E8E8E8). Nunca recorta el disfraz.
// Códecs WASM (@jsquash) porque las Edge Functions no tienen Canvas.

import decodeJpeg from 'npm:@jsquash/jpeg@1/decode.js';
import encodeJpeg from 'npm:@jsquash/jpeg@1/encode.js';
import decodePng from 'npm:@jsquash/png@3/decode.js';
import decodeWebp from 'npm:@jsquash/webp@1/decode.js';
import resize from 'npm:@jsquash/resize@2';

export const VARIANT_WIDTH = 1080;
export const VARIANT_HEIGHT = 1350;
const BACKGROUND = [0xe8, 0xe8, 0xe8];

function sniff(bytes: Uint8Array): 'jpeg' | 'png' | 'webp' | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'webp';
  return null;
}

export async function renderInstagramVariant(input: ArrayBuffer): Promise<Uint8Array> {
  const format = sniff(new Uint8Array(input));
  if (!format) {
    throw new Error('Formato de imagen no soportado (usa JPG, PNG o WEBP).');
  }
  const decoded =
    format === 'jpeg' ? await decodeJpeg(input) : format === 'png' ? await decodePng(input) : await decodeWebp(input);

  const scale = Math.min(VARIANT_WIDTH / decoded.width, VARIANT_HEIGHT / decoded.height);
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));
  const fitted = width === decoded.width && height === decoded.height ? decoded : await resize(decoded, { width, height });

  const out = new Uint8ClampedArray(VARIANT_WIDTH * VARIANT_HEIGHT * 4);
  for (let i = 0; i < VARIANT_WIDTH * VARIANT_HEIGHT; i += 1) {
    out[i * 4] = BACKGROUND[0];
    out[i * 4 + 1] = BACKGROUND[1];
    out[i * 4 + 2] = BACKGROUND[2];
    out[i * 4 + 3] = 255;
  }
  const offsetX = Math.floor((VARIANT_WIDTH - width) / 2);
  const offsetY = Math.floor((VARIANT_HEIGHT - height) / 2);
  const src = fitted.data;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const s = (y * width + x) * 4;
      const d = ((y + offsetY) * VARIANT_WIDTH + (x + offsetX)) * 4;
      const alpha = src[s + 3] / 255;
      out[d] = Math.round(src[s] * alpha + BACKGROUND[0] * (1 - alpha));
      out[d + 1] = Math.round(src[s + 1] * alpha + BACKGROUND[1] * (1 - alpha));
      out[d + 2] = Math.round(src[s + 2] * alpha + BACKGROUND[2] * (1 - alpha));
      out[d + 3] = 255;
    }
  }

  const jpeg = await encodeJpeg(
    { data: out, width: VARIANT_WIDTH, height: VARIANT_HEIGHT, colorSpace: 'srgb' } as ImageData,
    { quality: 90 }
  );
  return new Uint8Array(jpeg);
}
