import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { Buffer } from 'node:buffer';
import { v4 as uuidv4 } from 'uuid';

const HETZNER_S3_ENDPOINT = process.env.HETZNER_S3_ENDPOINT;
const HETZNER_S3_ACCESS_KEY = process.env.HETZNER_S3_ACCESS_KEY;
const HETZNER_S3_SECRET_KEY = process.env.HETZNER_S3_SECRET_KEY;
const HETZNER_S3_BUCKET = process.env.HETZNER_S3_BUCKET;
const HETZNER_S3_REGION = process.env.HETZNER_S3_REGION || 'eu-central-1'; // Default or make it configurable

if (!HETZNER_S3_ENDPOINT || !HETZNER_S3_ACCESS_KEY || !HETZNER_S3_SECRET_KEY || !HETZNER_S3_BUCKET) {
  console.error('[StorageUtil] Missing one or more Hetzner S3 environment variables.');
  // Depending on your error handling strategy, you might throw an error here
  // or allow the app to start and let operations fail.
  // For critical operations, throwing an error is often better.
  // throw new Error('Missing Hetzner S3 configuration.');
}

const s3Client = new S3Client({
  endpoint: HETZNER_S3_ENDPOINT,
  region: HETZNER_S3_REGION, 
  credentials: {
    accessKeyId: HETZNER_S3_ACCESS_KEY!,
    secretAccessKey: HETZNER_S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Important for some S3-compatible services like Hetzner
});

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
    throw new Error('S3 storage is not configured for upload.');
  }

  const extension = originalFilename.split('.').pop() || 'png';
  const uniqueKey = `${folder}/${uuidv4()}.${extension}`;

  const params = {
    Bucket: HETZNER_S3_BUCKET!,
    Key: uniqueKey,
    Body: buffer,
    ACL: ObjectCannedACL.public_read, // Use the enum value for type safety
    // ContentType: 'image/png', // Or 'image/jpeg', etc. AWS SDK usually infers this, but can be set.
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    // Construct the public URL. This might vary based on your Hetzner setup (e.g., if using a custom domain or CDN).
    // The typical format is: https://<bucket>.<endpoint>/<key>
    // Note: Hetzner endpoints often include the bucket name, so check their specific URL format.
    // Example: https://your-bucket.your-region.objectstorage.hetzner.cloud/your-key
    // For Hetzner, the endpoint might already be specific to the region, e.g., objectstorage.eu-central-1.hetzner.cloud
    // So, the URL could be: https://<bucket>.<endpoint-domain-part>/<key>
    // Or simply: https://<endpoint>/<bucket>/<key> if the endpoint is more generic.
    // We need to be careful here. Let's assume endpoint is like 'fsn1.hetznerobjects.com' and region is 'eu-central-1' (which is part of endpoint or implicit).
    // A common pattern is `https://<bucket>.<endpoint_host>/<key>`
    // If HETZNER_S3_ENDPOINT = https://fsn1.hetznerobjects.com
    // URL becomes https://YOUR_BUCKET.fsn1.hetznerobjects.com/uniquekey
    
    // A safer way, if your endpoint is specific like `your-bucket.your-region.host.com`
    // then the URL is `https://${HETZNER_S3_ENDPOINT}/${uniqueKey}` (if endpoint includes bucket)
    // OR if endpoint is just `your-region.host.com`, then `https://${HETZNER_S3_BUCKET}.${HETZNER_S3_ENDPOINT}/${uniqueKey}`

    // Given Hetzner's structure, if HETZNER_S3_ENDPOINT is something like `s3.your-region.cloud.herzner.com`
    // the URL pattern is typically `https://<bucket_name>.<HETZNER_S3_ENDPOINT>/<object_key>`
    // Ensure HETZNER_S3_ENDPOINT does not include `https://` for this construction.
    const endpointUrl = new URL(HETZNER_S3_ENDPOINT);
    const publicUrl = `https://${HETZNER_S3_BUCKET}.${endpointUrl.host}/${uniqueKey}`;
    
    console.log(`[StorageUtil] Image uploaded successfully to: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('[StorageUtil] Error uploading image to S3:', error);
    throw new Error(`Failed to upload image: ${(error as Error).message}`);
  }
} 