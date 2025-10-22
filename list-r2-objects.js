#!/usr/bin/env node

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = '96307fd80b0757463e609d83051b82a1';
const ACCESS_KEY_ID = '5758c62d18ce7c70cc750a2723f252e6';
const SECRET_ACCESS_KEY = 'b173dd8410a954c3938fb55bc5ed8385bb4bad0066a5f0d0d3916df1e78c7531';
const BUCKET_NAME = 'ai-models';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

async function listObjects() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    });

    const response = await s3Client.send(command);

    console.log(`📦 Bucket: ${BUCKET_NAME}`);
    console.log(`📊 Total objects: ${response.KeyCount || 0}\n`);

    if (response.Contents && response.Contents.length > 0) {
      response.Contents.forEach((object) => {
        const sizeInMB = (object.Size / (1024 * 1024)).toFixed(2);
        console.log(`✅ ${object.Key}`);
        console.log(`   Size: ${sizeInMB} MB`);
        console.log(`   Last Modified: ${object.LastModified}`);
        console.log();
      });
    } else {
      console.log('⚠️  No objects found in bucket');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listObjects();
