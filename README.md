# AI Background Remover

A Cloudflare Worker that removes image backgrounds using Cloudflare Images.

## Features

- Drag-and-drop or click to upload
- JPEG, PNG, WebP input (max 10MB)
- Transparent PNG output
- Runs on Cloudflare Images (5,000 free transformations/month)
- Image is not stored or logged
- Multi-language interface (EN + ZH)

## Architecture

- **Worker** handles POST /api/remove-bg
- **Cloudflare Images** binding via `[images]` in wrangler.toml
- **Static assets** in `public/`

## Setup

```bash
npm install
npx wrangler login
npx wrangler deploy
```

## Free tier

- Cloudflare Images: 5,000 unique transformations/month

## License

MIT
