# AI Model CDN Integration

## Overview

DrLee IDE now integrates AI models served from Cloudflare R2 CDN for faster, more reliable model loading.

## CDN Model URLs

The following AI models are hosted on our R2 CDN:

### 1. Gemma 3n E2B (1.5B) - Multimodal
- **CDN URL**: `https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma-3n-E2B-it-int4-Web.litertlm`
- **Size**: 2.8 GB
- **Format**: LiteRT LM (.litertlm)
- **Capabilities**: Text + Images + Audio
- **Use case**: Best quality multimodal model for text and image understanding

### 2. Gemma 3 270M Q8 - Fast Lightweight
- **CDN URL**: `https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma3-270m-it-q8-web.task`
- **Size**: 263 MB
- **Format**: Task file (.task)
- **Capabilities**: Text-only
- **Use case**: Fast, lightweight model for quick responses

## How It Works

### Model Loading Architecture

1. **MediaPipe Runtime** (`src/runtimes/ai/MediaPipeRuntime.js`)
   - Manages Gemma 3 model loading
   - Configured with CDN URLs in `availableModels` array
   - Supports both CDN and HuggingFace fallback URLs

2. **AI Runtime Manager** (`src/runtimes/ai/AIRuntimeManager.js`)
   - Coordinates between WebLLM and MediaPipe runtimes
   - Automatically selects appropriate runtime based on model
   - Handles multimodal input (text + images)

3. **UI Integration** (`src/ui/components/AIChatPanel.js`)
   - Automatically populates model selector from available models
   - Shows model size and capabilities
   - Groups models by performance tier

## Model Configuration

Models are configured in `MediaPipeRuntime.js`:

```javascript
// Available Gemma 3 models (hosted on Cloudflare R2 CDN)
this.availableModels = [
  {
    name: 'Gemma 3n E2B (1.5B)',
    id: 'gemma-3n-E2B',
    url: 'https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma-3n-E2B-it-int4-Web.litertlm',
    size: '2.8GB',
    multimodal: true,
    category: 'large',
    description: 'Best quality multimodal model for complex tasks',
  },
  {
    name: 'Gemma 3 270M Q8',
    id: 'gemma-3-270m-q8',
    url: 'https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/gemma3-270m-it-q8-web.task',
    size: '263MB',
    multimodal: true,
    category: 'small',
    description: 'Fast, lightweight model for quick responses',
  },
];
```

## Benefits of CDN Integration

1. **Faster Loading**: Models load from geographically distributed edge locations
2. **Reliability**: R2 provides 99.9% uptime SLA
3. **No External Dependencies**: All models self-hosted on Cloudflare R2
4. **Cost Effective**: Cloudflare R2 has generous free tier (10GB/month free)
5. **Full Control**: Complete control over model availability and versions

## User Experience

### For End Users:

1. Click the **🤖 AI Assistant** button in the IDE
2. Select a model from the dropdown (CDN models appear first)
3. Click **Load Model** - model downloads from CDN
4. Start chatting or using AI features!

### Model Selection:

- **Gemma 3n E2B (1.5B)**: Best for complex queries, image analysis, code review (2.8GB)
- **Gemma 3 270M Q8**: Best for quick questions, simple code generation (263MB)

## Technical Details

### R2 Bucket Configuration

- **Bucket Name**: `ai-models`
- **Region**: ENAM (Eastern North America)
- **Storage Class**: Standard
- **Public Access**: Enabled via `pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev` subdomain

### Files Uploaded:

```bash
# Large model (2.8 GB)
gemma-3n-E2B-it-int4-Web.litertlm

# Small model (263 MB)
gemma3-270m-it-q8-web.task
```

### Upload Method:

Used AWS S3-compatible API with Node.js SDK (`@aws-sdk/client-s3`) for large file uploads (>300MB).

## Adding New Models

To add new models to the CDN:

1. **Upload to R2**:
   ```bash
   node upload-to-r2.js /path/to/model.litertlm
   ```

2. **Update MediaPipeRuntime.js**:
   ```javascript
   {
     name: 'New Model Name',
     id: 'new-model-id',
     url: 'https://pub-8f8063a5b7fd42c1bf158b9ba33997d5.r2.dev/model.litertlm',
     size: 'XXX MB',
     multimodal: true,
     category: 'small', // or 'medium', 'large'
     description: 'Model description',
   }
   ```

3. **Test**: Reload IDE and verify model appears in selector

## Monitoring & Maintenance

### Check Model Availability:

```bash
node list-r2-objects.js
```

Output:
```
📦 Bucket: ai-models
📊 Total objects: 2

✅ gemma-3n-E2B-it-int4-Web.litertlm
   Size: 2897.38 MB
   Last Modified: Wed Oct 22 2025 12:31:17 GMT-0400

✅ gemma3-270m-it-q8-web.task
   Size: 263.38 MB
   Last Modified: Wed Oct 22 2025 12:17:18 GMT-0400
```

### R2 Storage Costs:

- **Storage**: $0.015/GB/month (after 10GB free tier)
- **Class A Operations** (write): $4.50/million (after 1M free)
- **Class B Operations** (read): $0.36/million (after 10M free)

Current usage: ~3.16 GB (within free tier)

## Troubleshooting

### Model Won't Load from CDN

1. Check browser console for CORS errors
2. Verify R2 public access is enabled
3. Check R2 bucket health in Cloudflare dashboard
4. Check network connectivity
5. Verify model files are still in R2 bucket

### Slow Loading

1. Large models (2.8GB) may take time on first load
2. Check browser cache settings (models should cache after first load)
3. Monitor R2 metrics in Cloudflare dashboard
4. Check network bandwidth and latency

### Model Not Appearing in Selector

1. Check `MediaPipeRuntime.js` configuration
2. Verify model URL is correct
3. Check browser console for errors
4. Try refreshing the page

## Future Enhancements

- [ ] Add more Gemma models to CDN
- [ ] Implement progressive loading for large models
- [ ] Add model caching to IndexedDB
- [ ] Support model versioning
- [ ] Add CDN health monitoring
- [ ] Implement multi-region CDN replication

## References

- [MediaPipe LLM Documentation](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare R2 Public Buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
