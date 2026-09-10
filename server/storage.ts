import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

/**
 * Almacenamiento de ficheros en S3 o en cualquier servicio compatible, como Cloudflare R2.
 *
 * Sustituye a la pasarela de almacenamiento de la plataforma anterior. El SDK de AWS ya
 * estaba entre las dependencias del proyecto, así que el cambio es de configuración: basta
 * con apuntar S3_ENDPOINT a R2 o dejarlo vacío para usar S3 nativo.
 */

let client: S3Client | null = null;

function getClient() {
  if (!ENV.s3Bucket || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
    throw new Error("Falta configurar S3_BUCKET, S3_ACCESS_KEY_ID y S3_SECRET_ACCESS_KEY.");
  }
  if (!client) {
    client = new S3Client({
      region: ENV.s3Region || "auto",
      ...(ENV.s3Endpoint ? { endpoint: ENV.s3Endpoint, forcePathStyle: true } : {}),
      credentials: { accessKeyId: ENV.s3AccessKeyId, secretAccessKey: ENV.s3SecretAccessKey },
    });
  }
  return client;
}

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const body = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  await getClient().send(new PutObjectCommand({ Bucket: ENV.s3Bucket, Key: key, Body: body, ContentType: contentType }));
  return { key, url: `/files/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/files/${key}` };
}

/** URL firmada de lectura, con caducidad corta. Es la que se pasa al modelo. */
export async function storageGetSignedUrl(relKey: string, expiresInSeconds = 900): Promise<string> {
  const key = normalizeKey(relKey);
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }), { expiresIn: expiresInSeconds });
}
