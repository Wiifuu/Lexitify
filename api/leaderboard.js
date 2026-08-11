const KEY = 'lexitify:leaderboard:v1';

function cleanName(value) {
  return String(value || '')
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 20);
}

function getRedisConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Faltan UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN (o KV_REST_API_URL y KV_REST_API_TOKEN) en Vercel.'
    );
  }
  return { url: String(url).replace(/\/$/, ''), token };
}

async function redis(command) {
  const { url, token } = getRedisConfig();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  let body;
  try {
    body = await response.json();
  } catch (_) {
    throw new Error(`Redis respondió HTTP ${response.status} sin JSON válido.`);
  }

  if (!response.ok || body.error) {
    throw new Error(body.error || `Redis respondió HTTP ${response.status}.`);
  }
  return body.result;
}

function parseTop(raw) {
  if (!Array.isArray(raw)) return [];
  const rows = [];
  for (let i = 0; i < raw.length; i += 2) {
    rows.push({ name: String(raw[i]), score: Number(raw[i + 1]) });
  }
  return rows;
}

async function getTop() {
  const raw = await redis(['ZREVRANGE', KEY, '0', '9', 'WITHSCORES']);
  return parseTop(raw);
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    if (req.method === 'GET') {
      // /api/leaderboard?health=1 permite comprobar la conexión sin exponer credenciales.
      if (req.query && String(req.query.health || '') === '1') {
        const pong = await redis(['PING']);
        return res.status(200).json({ ok: pong === 'PONG', redis: 'connected', key: KEY });
      }
      return res.status(200).json({ top: await getTop() });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Método no permitido' });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); }
      catch (_) { return res.status(400).json({ error: 'JSON inválido' }); }
    }

    const name = cleanName(body.name);
    const difficulty = String(body.difficulty || '');
    const correct = Number(body.correct);
    const score = Number(body.score);
    const points = { facil: 50, normal: 75, dificil: 100 }[difficulty];

    if (name.length < 2) {
      return res.status(400).json({ error: 'Nombre de usuario inválido' });
    }
    if (!points || !Number.isInteger(correct) || correct < 0 || correct > 10) {
      return res.status(400).json({ error: 'Resultado inválido' });
    }
    if (!Number.isInteger(score) || score !== correct * points) {
      return res.status(400).json({ error: 'Puntuación inválida' });
    }

    // GT conserva el mejor puntaje de ese nombre, pero permite insertar nombres nuevos.
    await redis(['ZADD', KEY, 'GT', String(score), name]);

    const [rankRaw, bestRaw] = await Promise.all([
      redis(['ZREVRANK', KEY, name]),
      redis(['ZSCORE', KEY, name])
    ]);
    const top = await getTop();

    return res.status(200).json({
      saved: true,
      name,
      rank: rankRaw === null ? null : Number(rankRaw) + 1,
      bestScore: Number(bestRaw || score),
      top
    });
  } catch (error) {
    console.error('LEADERBOARD_ERROR', error);
    return res.status(500).json({
      error: 'No se pudo guardar o cargar el leaderboard',
      detail: String(error && error.message ? error.message : error)
    });
  }
}

module.exports = handler;
