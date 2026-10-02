export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.includes('/api/') && request.method === 'POST') {
      return handleApi(request, env, url);
    }

    return env.ASSETS.fetch(request);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

async function handleApi(request, env, url) {
  const path = url.pathname.replace(/\/$/, '');

  if (!path.endsWith('/api/remove-bg')) {
    return json({ error: 'Not found' }, 404);
  }

  return handleRemoveBg(request, env);
}

async function handleRemoveBg(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return json({ error: 'No image provided.' }, 400);
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return json({ error: 'Only JPEG, PNG, and WebP are supported.' }, 400);
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return json({ error: 'Image must be under 10MB.' }, 400);
    }

    const bytes = await file.arrayBuffer();

    // 使用 Images binding 进行背景移除
    const response = await env.IMAGES
      .input(bytes)
      .transform({
        segment: 'foreground'
      })
      .output({ format: 'image/png' })
      .response();

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="no-background.png"'
      }
    });
  } catch (err) {
    console.error('Background removal error:', err);
    return json({ error: 'Processing failed. Please try again.' }, 500);
  }
}
