import assert from "node:assert/strict"
import { test } from "node:test"
import sharp from "sharp"
import { validatedImage } from "../../lib/backend/images"
import { MAX_IMAGE_BYTES } from "../../lib/backend/contract"

test("decodifica JPEG/PNG/WebP reales y entrega WebP sin metadatos", async () => {
  for (const format of ["jpeg", "png", "webp"] as const) {
    const bytes = await sharp({ create: { width: 4, height: 4, channels: 3, background: "red" } }).toFormat(format).toBuffer()
    const result = await validatedImage(bytes, `image/${format}`)
    assert.ok(result.length <= MAX_IMAGE_BYTES, "la salida WebP respeta el mismo límite que la entrada")
    const metadata = await sharp(result).metadata()
    assert.equal(metadata.format, "webp")
    assert.equal(metadata.exif, undefined)
    assert.equal(metadata.width, 4)
  }
})
test("rechaza SVG, contenido falso, MIME discordante, corrupción y tamaño excesivo", async () => {
  assert.equal(MAX_IMAGE_BYTES, 4194304, "el contrato aprobado limita cada imagen a 4 MiB")
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer()
  for (const [bytes, type] of [[Buffer.from("<svg/>"), "image/svg+xml"], [Buffer.from("fake"), "image/png"], [png, "image/jpeg"], [png.subarray(0, 30), "image/png"], [Buffer.alloc(MAX_IMAGE_BYTES + 1), "image/png"]] as [Buffer, string][]) await assert.rejects(validatedImage(bytes, type))
})
test("rechaza imágenes de resolución excesiva antes de servir sus bytes", async () => {
  const bytes = await sharp({ create: { width: 5001, height: 5001, channels: 3, background: "red" } }).png().toBuffer()
  await assert.rejects(validatedImage(bytes, "image/png"))
})
