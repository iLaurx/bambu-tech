import sharp from "sharp"
import { MAX_IMAGE_BYTES } from "./contract"
import { ValidationError } from "./validation"

export async function validatedImage(bytes: Buffer, contentType: string | null): Promise<Buffer> {
  const formats: Record<string, string> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }
  if (!contentType || !(contentType in formats) || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new ValidationError("Usa una imagen JPEG, PNG o WebP de hasta 4 MiB.")
  try {
    const image = sharp(bytes, { limitInputPixels: 25000000, animated: false, failOn: "warning" })
    const metadata = await image.metadata()
    if (metadata.format !== formats[contentType] || (metadata.pages ?? 1) > 1) throw new Error("Invalid format")
    // Full decode and re-encode strips metadata and rejects corrupt input; no raw bytes are served.
    const output = await image.rotate().webp({ quality: 85 }).toBuffer()
    if (output.length > MAX_IMAGE_BYTES) throw new Error("Image too large")
    return output
  } catch { throw new ValidationError("La imagen está dañada, es animada o excede los límites de tamaño o resolución.") }
}
