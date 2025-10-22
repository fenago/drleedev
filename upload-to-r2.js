#!/usr/bin/env node

/**
 * Upload large files to Cloudflare R2 using S3-compatible API
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

// R2 Configuration
const R2_ACCOUNT_ID = '96307fd80b0757463e609d83051b82a1';
const ACCESS_KEY_ID = '5758c62d18ce7c70cc750a2723f252e6';
const SECRET_ACCESS_KEY = 'b173dd8410a954c3938fb55bc5ed8385bb4bad0066a5f0d0d3916df1e78c7531';
const BUCKET_NAME = 'ai-models';

// Configure S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

async function uploadFile(filePath) {
  const fileName = path.basename(filePath);

  console.log(`📤 Uploading: ${fileName}`);

  // Get file size
  const stats = await stat(filePath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📦 File size: ${fileSizeInMB} MB`);

  // Create read stream
  const fileStream = createReadStream(filePath);

  // Upload to R2
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileStream,
  });

  try {
    console.log(`⏳ Uploading to R2...`);
    const response = await s3Client.send(command);
    console.log(`✅ Upload complete: ${fileName}`);
    console.log(`   ETag: ${response.ETag}`);
  } catch (error) {
    console.error(`❌ Upload failed:`, error.message);
    throw error;
  }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node upload-to-r2.js <file-path>');
  process.exit(1);
}

uploadFile(filePath)
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
