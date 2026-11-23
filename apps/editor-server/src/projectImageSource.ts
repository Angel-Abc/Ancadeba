import {
  inspectImageSource,
  validateImageSource,
  type ImageSourceInfo,
} from '@ancadeba/game-runtime'
import type { ImageAsset } from '@ancadeba/schemas'
import sharp from 'sharp'

async function validateRaster(format: ImageAsset['format'], bytes: Uint8Array): Promise<void> {
  if (format === 'svg') return
  const image = sharp(bytes)
  const metadata = await image.metadata()

  if (metadata.format !== format) throw new Error(`Invalid ${format} image`)
  await image.stats()
}

function imageText(format: ImageAsset['format'], bytes: Uint8Array): string {
  return format === 'svg' ? Buffer.from(bytes).toString('utf8') : ''
}

export async function inspectProjectImage(
  format: ImageAsset['format'],
  bytes: Uint8Array,
): Promise<ImageSourceInfo> {
  const info = inspectImageSource(format, bytes, imageText(format, bytes))
  await validateRaster(format, bytes)

  return info
}

export async function validateProjectImage(image: ImageAsset, bytes: Uint8Array): Promise<void> {
  validateImageSource(image, bytes, imageText(image.format, bytes))
  await validateRaster(image.format, bytes)
}
