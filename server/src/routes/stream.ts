import { Router } from 'express';
import { resolveStreamUrl } from '../lib/resolver.js';
import { proxyRangeRequest } from '../lib/rangeProxy.js';
import { StreamResolutionError } from '../lib/errors.js';

const VIDEO_ID_RE = /^[\w-]{11}$/;

export const streamRouter = Router();

streamRouter.get('/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!VIDEO_ID_RE.test(videoId)) {
    res.status(400).json({ error: 'videoId inválido', code: 'invalid_id' });
    return;
  }

  try {
    const cdnUrl = await resolveStreamUrl(videoId);
    await proxyRangeRequest(cdnUrl, req, res);
  } catch (err) {
    if (err instanceof StreamResolutionError) {
      res.status(err.status).json({ error: err.message, code: err.code });
      return;
    }
    res.status(500).json({ error: 'Error inesperado', code: 'unknown' });
  }
});
