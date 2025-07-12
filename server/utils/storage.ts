import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3'
import type { Buffer } from 'node:buffer'
import { v4 as uuidv4 } from 'uuid'

const HETZNER_S3_ENDPOINT = process.env.HETZNER_S3_ENDPOINT
const HETZNER_S3_ACCESS_KEY = process.env.HETZNER_S3_ACCESS_KEY
const HETZNER_S3_SECRET_KEY = process.env.HETZNER_S3_SECRET_KEY
const HETZNER_S3_BUCKET = process.env.HETZNER_S3_BUCKET
const HETZNER_S3_REGION = process.env.HETZNER_S3_REGION || 'eu-central-1' // Default or make it configurable

if (
  !HETZNER_S3_ENDPOINT ||
  !HETZNER_S3_ACCESS_KEY ||
  !HETZNER_S3_SECRET_KEY ||
  !HETZNER_S3_BUCKET
) {
  console.error('[StorageUtil] Missing one or more Hetzner S3 environment variables.')
  // Depending on your error handling strategy, you might throw an error here
  // or allow the app to start and let operations fail.
  // For critical operations, throwing an error is often better.
  // throw new Error('Missing Hetzner S3 configuration.');
}

const rawEndpoint = HETZNER_S3_ENDPOINT?.replace(/\/+$/, '')!
const normalizedEndpoint = /^https?:\/\//i.test(rawEndpoint)
  ? rawEndpoint
  : `https://${rawEndpoint}`

const s3Client = new S3Client({
  endpoint: normalizedEndpoint,
  region: HETZNER_S3_REGION,
  credentials: {
    accessKeyId: HETZNER_S3_ACCESS_KEY!,
    secretAccessKey: HETZNER_S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Important for some S3-compatible services like Hetzner
})

/**
 * Uploads an image buffer to Hetzner Object Storage.
 * @param buffer The image buffer.
 * @param originalFilename Optional: the original filename to derive extension. Falls back to 'image.png'.
 * @param folder Optional: a folder name within the bucket (e.g., 'user-images').
 * @returns The public URL of the uploaded image.
 * @throws Error if upload fails.
 */
export async function uploadImage(
  buffer: Buffer,
  originalFilename: string = 'image.png',
  folder: string = 'generated-images'
): Promise<string> {
  if (!HETZNER_S3_ENDPOINT || !HETZNER_S3_BUCKET) {
    throw new Error('S3 storage is not configured for upload.')
  }

  const extension = originalFilename.split('.').pop() || 'png'
  const uniqueKey = `${folder}/${uuidv4()}.${extension}`

  const params = {
    Bucket: HETZNER_S3_BUCKET!,
    Key: uniqueKey,
    Body: buffer,
    ACL: ObjectCannedACL.public_read, // Use the enum value for type safety
    // ContentType: 'image/png', // Or 'image/jpeg', etc. AWS SDK usually infers this, but can be set.
  }

  try {
    await s3Client.send(new PutObjectCommand(params))
    // Construct the public URL. This might vary based on your Hetzner setup (e.g., if using a custom domain or CDN).
    const endpointUrl = new URL(normalizedEndpoint)
    const publicUrl = `https://${HETZNER_S3_BUCKET}.${endpointUrl.host}/${uniqueKey}`

    console.log(`[StorageUtil] Image uploaded successfully to: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error('[StorageUtil] Error uploading image to S3:', error)
    throw new Error(`Failed to upload image: ${(error as Error).message}`)
  }
}
