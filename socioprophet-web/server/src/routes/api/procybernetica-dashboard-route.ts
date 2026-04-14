export {};
const express = require('express');
const NodeCache = require('node-cache');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 });

const DEFAULT_PATH = '/api/procybernetica/dashboard';

const buildUnavailablePayload = (reason: string) => ({
  generatedAtUtc: new Date().toISOString(),
  status: 'unavailable',
  reason,
  totals: {
    subjects: 0,
    labs: 0,
    models: 0,
    changedSubjects: 0,
    openEscalations: 0,
  },
  leaderboard: [],
  contradictions: [],
});

router.get('/dashboard', async (_req: Request, res: any) => {
  const baseUrl = process.env.SHERLOCK_SEARCH_BASE_URL;

  if (!baseUrl) {
    return res.status(503).json(
      buildUnavailablePayload(
        'SHERLOCK_SEARCH_BASE_URL is not configured on the Socioprophet server.'
      )
    );
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}${DEFAULT_PATH}`;
  const cached = cache.get(endpoint);

  if (cached) {
    return res.json(cached);
  }

  try {
    const upstream = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json(
        buildUnavailablePayload(
          `Sherlock-search returned ${upstream.status} for ${DEFAULT_PATH}.`
        )
      );
    }

    const payload = await upstream.json();
    cache.set(endpoint, payload);
    return res.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Sherlock-search proxy failure';
    return res.status(502).json(buildUnavailablePayload(message));
  }
});

module.exports = router;
