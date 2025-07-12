# Image Optimization Plan

This document outlines a strategy for improving image delivery performance in DreamSeed.

## Goals
- Serve thumbnails and full size images quickly.
- Avoid transferring unnecessarily large files.
- Cache images to prevent repeated downloads.

## Proposed Approach

1. **Generate multiple image sizes on upload**
   - Use [`sharp`](https://github.com/lovell/sharp) on the server to create:
     - A small WebP thumbnail (e.g. 300px width).
     - A medium image for the viewer modal (e.g. 1024px width).
     - Keep the original as the full resolution backup.
   - Upload these variants to S3 under predictable keys (`thumb/`, `medium/`, `original/`).

2. **Serve images through a CDN**
   - Configure Cloudflare or BunnyCDN in front of the S3 bucket.
   - Enable long lived cache headers for image objects.
   - CDN edge caching will drastically reduce latency for users around the world.

3. **Frontend usage**
   - Thumbnails should load the WebP `thumb` version.
   - The modal should request the `medium` variant.
   - Use `loading="lazy"` and prefetch the next/previous images when the modal is open.

4. **Cache control and invalidation**
   - Set `Cache-Control` headers when uploading images so the CDN knows how long to cache each variant.
   - When deleting or replacing an image, purge the related CDN paths.

5. **Future improvements**
   - Integrate the `@nuxt/image` module for automatic format negotiation and additional lazy loading helpers.
   - Consider storing frequently accessed images on an even faster storage tier or using signed URLs for private content.

Implementing this workflow will keep the UI responsive and minimize bandwidth usage while still preserving high resolution copies when needed.
