import type { Request, Response } from 'express';

/** Reenvía un pedido (con soporte de Range, para permitir seek) hacia una URL de CDN. */
export async function proxyRangeRequest(
  cdnUrl: string,
  req: Request,
  res: Response,
): Promise<void> {
  const range = req.headers.range;

  const upstream = await fetch(cdnUrl, {
    headers: range ? { Range: range } : {},
  });

  if (!upstream.ok && upstream.status !== 206) {
    res.status(502).json({ error: 'El CDN de origen no respondió', code: 'unknown' });
    return;
  }

  res.status(upstream.status);
  for (const header of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(header);
    if (value) res.setHeader(header, value);
  }
  if (!upstream.headers.get('accept-ranges')) {
    res.setHeader('Accept-Ranges', 'bytes');
  }

  if (!upstream.body) {
    res.end();
    return;
  }

  const reader = upstream.body.getReader();

  req.on('close', () => {
    reader.cancel().catch(() => {});
  });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(value)) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
    }
    res.end();
  } catch {
    res.end();
  }
}
