import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";


const s3Client = new S3Client({
  endpoint: "https://s3.tebi.io",     
  region: process.env.TEBI_REGION || "us-east-1", 
  forcePathStyle: true,             
  credentials: {
    accessKeyId: process.env.TEBI_ACCESS_KEY_ID,         
    secretAccessKey: process.env.TEBI_SECRET_ACCESS_KEY, 
  },
});

const BUCKET_NAME = process.env.TEBI_S3_BUCKET_NAME;


export const upload = multer({ storage: multer.memoryStorage() });


export async function uploadToTebi(fileBuffer, originalFilename, contentType) {
  if (!isValidImageType(contentType)) {
    throw new Error("Invalid image type");
  }

  const ext = originalFilename.split(".").pop();
  const key = `projects/${uuidv4()}.${ext}`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

 
    return `https://${BUCKET_NAME}.s3.tebi.io/${key}`;
  } catch (error) {
    console.error("TEBI upload error:", error);
    throw new Error("Failed to upload image");
  }
}


export async function deleteFromTebi(imageUrl) {
  try {
    const url = new URL(imageUrl);
    const key = url.pathname.slice(1);

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error("TEBI delete error:", error);
    throw new Error("Failed to delete image");
  }
}


export async function getSignedUrlFromTebi(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("TEBI signed URL error:", error);
    throw new Error("Failed to generate signed URL");
  }
}


export function isValidImageType(contentType) {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    .includes(contentType.toLowerCase());
}
