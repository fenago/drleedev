# Deployment Guide
## DrLee IDE - Production Deployment Documentation

**Version:** 1.0
**Date:** October 19, 2025
**Status:** Operations Guide

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Netlify Deployment](#3-netlify-deployment)
4. [Vercel Deployment](#4-vercel-deployment)
5. [Cloudflare Workers (Monetization)](#5-cloudflare-workers-monetization)
6. [Environment Configuration](#6-environment-configuration)
7. [Performance Optimization](#7-performance-optimization)
8. [Monitoring & Analytics](#8-monitoring--analytics)
9. [CI/CD Pipeline](#9-cicd-pipeline)

---

## 1. Overview

DrLee IDE is a **fully static, client-side application** that requires:
- Static file hosting (Netlify, Vercel, Cloudflare Pages)
- CDN for fast global delivery
- **Optional**: Edge server for premium features (Cloudflare Workers)

**Deployment Architecture:**
```
User Browser → CDN (Netlify/Vercel) → Static Files (HTML, JS, CSS)
                                     → WASM Runtimes (lazy-loaded)

Premium Users → Cloudflare Workers → Auth Verification
                                   → WASM Delivery
                                   → Stripe API
```

---

## 2. Prerequisites

### 2.1 Required Accounts
- [ ] **GitHub account** (for version control and CI/CD)
- [ ] **Netlify or Vercel account** (for hosting)
- [ ] **Cloudflare account** (for premium features - optional)
- [ ] **Stripe account** (for payments - optional)
- [ ] **Plausible/GA account** (for analytics - optional)

### 2.2 Local Development Setup
```bash
# Install Node.js 18+
node --version  # Should be v18+

# Clone repository
git clone https://github.com/your-org/drlee-ide.git
cd drlee-ide

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 3. Netlify Deployment

### 3.1 Manual Deployment

**Step 1: Build Application**
```bash
npm run build
# Output: dist/ folder
```

**Step 2: Deploy to Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### 3.2 Automatic Deployment (GitHub Integration)

**Step 1: Create `netlify.toml`**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

# Cache static assets
[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Index.html (no cache)
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

# IMPORTANT: Headers for WebAssembly
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Embedder-Policy = "require-corp"
    Cross-Origin-Opener-Policy = "same-origin"

# SPA redirect
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Step 2: Connect to GitHub**
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Connect GitHub repository
4. Select branch (main)
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Click "Deploy site"

**Step 3: Configure Environment Variables**
```bash
# In Netlify dashboard → Site settings → Environment variables
VITE_APP_NAME=DrLee IDE
VITE_APP_VERSION=1.0.0
VITE_PYODIDE_CDN=https://cdn.jsdelivr.net/pyodide/v0.24.1/full/
VITE_API_URL=https://your-worker.workers.dev
VITE_ANALYTICS_ID=your-plausible-id
```

### 3.3 Custom Domain

```bash
# In Netlify dashboard → Domain settings
1. Add custom domain (e.g., ide.example.com)
2. Configure DNS:
   - Type: CNAME
   - Name: ide
   - Value: your-site.netlify.app
3. Enable HTTPS (automatic with Let's Encrypt)
```

---

## 4. Vercel Deployment

### 4.1 Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 4.2 Automatic Deployment

**Step 1: Create `vercel.json`**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Step 2: Connect to GitHub**
1. Go to https://vercel.com/new
2. Import Git repository
3. Configure project
4. Deploy

---

## 5. Cloudflare Workers (Monetization)

### 5.1 Worker Setup

**Step 1: Create Cloudflare Worker**
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create worker project
wrangler init drlee-api
cd drlee-api
```

**Step 2: Implement Worker (see monetize.md for full code)**
```javascript
// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Runtime delivery endpoint
    if (url.pathname.startsWith('/runtime/')) {
      return handleRuntimeRequest(request, env);
    }

    // Subscription verification
    if (url.pathname === '/verify-subscription') {
      return handleSubscriptionCheck(request, env);
    }

    return new Response('Not found', { status: 404 });
  }
};

async function handleRuntimeRequest(request, env) {
  // Verify auth token
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify Stripe subscription
  const isValid = await verifyStripeSubscription(token, env.STRIPE_SECRET_KEY);
  if (!isValid) {
    return new Response('Subscription required', { status: 402 });
  }

  // Deliver WASM runtime
  const language = url.pathname.split('/').pop();
  const wasmUrl = getWasmUrl(language);
  const wasmResponse = await fetch(wasmUrl);

  return new Response(wasmResponse.body, {
    headers: {
      'Content-Type': 'application/wasm',
      'Cache-Control': 'private, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
```

**Step 3: Configure Secrets**
```bash
# Set Stripe secret key
wrangler secret put STRIPE_SECRET_KEY

# Enter your Stripe secret key when prompted
```

**Step 4: Deploy Worker**
```bash
wrangler publish
# Worker will be available at: https://drlee-api.<your-subdomain>.workers.dev
```

### 5.2 Cloudflare R2 (WASM Storage)

```bash
# Create R2 bucket
wrangler r2 bucket create wasm-runtimes

# Upload WASM files
wrangler r2 object put wasm-runtimes/python.wasm --file ./python.wasm
wrangler r2 object put wasm-runtimes/ruby.wasm --file ./ruby.wasm
```

---

## 6. Environment Configuration

### 6.1 Production Environment Variables

```bash
# .env.production
VITE_APP_NAME=DrLee IDE
VITE_APP_VERSION=1.0.0
VITE_ENV=production

# CDN URLs
VITE_PYODIDE_CDN=https://cdn.jsdelivr.net/pyodide/v0.24.1/full/
VITE_MONACO_CDN=https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs

# API Configuration (for premium features)
VITE_API_URL=https://drlee-api.your-subdomain.workers.dev
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key

# Analytics
VITE_ANALYTICS_ID=your-plausible-domain
VITE_SENTRY_DSN=your-sentry-dsn

# Feature Flags
VITE_ENABLE_PREMIUM=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
```

### 6.2 Staging Environment

```bash
# .env.staging
VITE_APP_NAME=DrLee IDE (Staging)
VITE_ENV=staging
VITE_API_URL=https://drlee-api-staging.workers.dev
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
```

---

## 7. Performance Optimization

### 7.1 Vite Build Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],

  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco': ['monaco-editor'],
          'vendor': ['react', 'react-dom']
        }
      }
    },

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },

    // Target modern browsers
    target: 'esnext',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },

  // Optimize dependencies
  optimizeDeps: {
    exclude: ['pyodide', '@ruby/wasm-wasi', 'php-wasm', 'webr']
  }
});
```

### 7.2 CDN Optimization

**Use CDN for large dependencies:**
```html
<!-- Load Monaco from CDN -->
<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
```

### 7.3 Lazy Loading

```javascript
// Lazy load language runtimes
const PythonRuntime = () => import('./runtimes/PythonRuntime.js');
const RubyRuntime = () => import('./runtimes/RubyRuntime.js');

// Load on demand
async function loadRuntime(language) {
  switch (language) {
    case 'python':
      const { default: Python } = await PythonRuntime();
      return new Python();
    // ... other languages
  }
}
```

---

## 8. Monitoring & Analytics

### 8.1 Plausible Analytics Setup

```html
<!-- Add to index.html -->
<script defer data-domain="ide.example.com" src="https://plausible.io/js/script.js"></script>
```

```javascript
// Track custom events
window.plausible('Language Selected', { props: { language: 'python' } });
window.plausible('Code Executed', { props: { language: 'python', duration: 123 } });
```

### 8.2 Sentry Error Tracking

```javascript
// src/main.js
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENV,
  release: import.meta.env.VITE_APP_VERSION,

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Error filtering
  beforeSend(event) {
    // Don't send errors in development
    if (import.meta.env.DEV) return null;
    return event;
  }
});
```

### 8.3 Performance Monitoring

```javascript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, id }) {
  // Send to analytics service
  console.log({ name, delta, id });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## 9. CI/CD Pipeline

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          VITE_APP_VERSION: ${{ github.sha }}
          VITE_ENV: production

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

      - name: Deploy Worker to Cloudflare
        uses: cloudflare/wrangler-action@2.0.0
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: './worker'
          command: publish
```

### 9.2 Pre-deployment Checks

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm run test:unit

      - name: Integration tests
        run: npm run test:integration

      - name: Build
        run: npm run build
```

---

## 10. Post-Deployment Checklist

### 10.1 Verify Deployment

- [ ] Site loads correctly
- [ ] All static assets load
- [ ] Monaco Editor initializes
- [ ] Free tier languages work (JS, Lua, SQLite)
- [ ] Premium paywall appears for Pro languages
- [ ] Database queries execute
- [ ] File save/load works
- [ ] Error handling works
- [ ] Analytics tracking works

### 10.2 Performance Checks

```bash
# Run Lighthouse audit
npx lighthouse https://ide.example.com --view

# Target scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 95+
```

### 10.3 Security Checks

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CSP policy active
- [ ] CORS configured correctly
- [ ] No sensitive data in client code
- [ ] Stripe keys are correct (test vs. live)

---

## 11. Rollback Procedure

### 11.1 Netlify Rollback

```bash
# List deployments
netlify deploy list

# Rollback to previous deployment
netlify deploy --alias production --dir dist

# Or in dashboard: Deploys → Click previous deploy → "Publish deploy"
```

### 11.2 Cloudflare Worker Rollback

```bash
# List versions
wrangler deployments list

# Rollback
wrangler rollback [deployment-id]
```

---

**Document End**
