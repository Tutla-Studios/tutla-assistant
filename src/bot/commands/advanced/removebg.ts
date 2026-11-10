/**
 * Lightweight background removal — no ML model, no API, single O(pixels) pass.
 *
 * 1. Estimate the background colour as the most common (quantised) colour along the image border.
 * 2. Flood-fill inward from every border pixel, absorbing pixels whose colour is within `tolerance`
 *    of the background colour. Only regions connected to the edge are removed, so similar colours
 *    inside the subject survive.
 * 3. Feather: foreground pixels touching the removed region get partial alpha based on how close
 *    they are to the background colour, which softens jagged edges.
 *
 * Works well for product shots, logos, screenshots and portraits on plain/solid backgrounds;
 * it will not separate a subject from a busy photographic background.
 */
import sharp from 'sharp'

const MAX_DIMENSION = 2048

export async function removeBackground(input: Buffer, tolerance = 40): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .rotate() // respect EXIF orientation
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const total = width * height
  const px = data // RGBA

  // 1. Background colour: mode of border pixels quantised to 4 bits per channel.
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()
  const sample = (i: number) => {
    const o = i * 4
    if (px[o + 3] < 16) return // already transparent
    const key = ((px[o] >> 4) << 8) | ((px[o + 1] >> 4) << 4) | (px[o + 2] >> 4)
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    bucket.n++
    bucket.r += px[o]
    bucket.g += px[o + 1]
    bucket.b += px[o + 2]
    buckets.set(key, bucket)
  }
  for (let x = 0; x < width; x++) {
    sample(x)
    sample((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y++) {
    sample(y * width)
    sample(y * width + width - 1)
  }

  let best = { n: 0, r: 255, g: 255, b: 255 }
  for (const b of buckets.values()) if (b.n > best.n) best = b
  const bgR = best.n ? best.r / best.n : 255
  const bgG = best.n ? best.g / best.n : 255
  const bgB = best.n ? best.b / best.n : 255

  const tolSq = tolerance * tolerance
  const distSq = (i: number) => {
    const o = i * 4
    const dr = px[o] - bgR
    const dg = px[o + 1] - bgG
    const db = px[o + 2] - bgB
    return dr * dr + dg * dg + db * db
  }
  const isBgCandidate = (i: number) => px[i * 4 + 3] < 16 || distSq(i) <= tolSq

  // 2. Flood fill from the border (iterative, typed-array stack).
  const removed = new Uint8Array(total)
  const stack = new Int32Array(total)
  let sp = 0
  const push = (i: number) => {
    if (!removed[i] && isBgCandidate(i)) {
      removed[i] = 1
      stack[sp++] = i
    }
  }
  for (let x = 0; x < width; x++) {
    push(x)
    push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    push(y * width)
    push(y * width + width - 1)
  }
  while (sp > 0) {
    const i = stack[--sp]
    const x = i % width
    if (x > 0) push(i - 1)
    if (x < width - 1) push(i + 1)
    if (i >= width) push(i - width)
    if (i < total - width) push(i + width)
  }

  // 3. Apply alpha + feather the boundary.
  const featherSq = (tolerance * 2.5) ** 2
  for (let i = 0; i < total; i++) {
    const o = i * 4
    if (removed[i]) {
      px[o + 3] = 0
      continue
    }
    const x = i % width
    const touchesBg =
      (x > 0 && removed[i - 1]) ||
      (x < width - 1 && removed[i + 1]) ||
      (i >= width && removed[i - width]) ||
      (i < total - width && removed[i + width])
    if (touchesBg) {
      const d = distSq(i)
      if (d < featherSq) {
        const t = (Math.sqrt(d) - tolerance) / (Math.sqrt(featherSq) - tolerance)
        px[o + 3] = Math.round(px[o + 3] * Math.min(1, Math.max(0.15, t)))
      }
    }
  }

  return sharp(px, { raw: { width, height, channels: 4 } }).png().toBuffer()
}
