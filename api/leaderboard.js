const BASE_KEY = 'lexitify:leaderboard:v2';

const LEVELS = {
  facil: {
    points: 50,
    maxCorrect: 10
  },
  normal: {
    points: 75,
    maxCorrect: 10
  },
  dificil: {
    points: 100,
    maxCorrect: 10
  },
  extremo: {
    points: 1,
    maxCorrect: 150
  }
};


// ======================================================
// CONFIGURACIÓN DE UPSTASH / VERCEL
// ======================================================

function getEnv() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Faltan UPSTASH_REDIS_REST_URL y ' +
      'UPSTASH_REDIS_REST_TOKEN ' +
      '(o KV_REST_API_URL y KV_REST_API_TOKEN) en Vercel.'
    );
  }

  return {
    url: url.replace(/\/+$/, ''),
    token
  };
}


// ======================================================
// CONEXIÓN CON REDIS
// ======================================================

async function redis(command) {
  const { url, token } = getEnv();

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
  } catch {
    throw new Error(
      `Redis respondió con HTTP ${response.status}`
    );
  }

  if (!response.ok || body.error) {
    throw new Error(
      body.error ||
      `Error Redis HTTP ${response.status}`
    );
  }

  return body.result;
}


// ======================================================
// LIMPIAR NOMBRE DEL JUGADOR
// ======================================================

function cleanName(value) {
  return String(value ?? '')
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 20);
}


// ======================================================
// VALIDAR DIFICULTAD
// ======================================================

function validDifficulty(value) {
  const difficulty =
    String(value || '').toLowerCase();

  return Object.prototype.hasOwnProperty.call(
    LEVELS,
    difficulty
  )
    ? difficulty
    : null;
}


// ======================================================
// CLAVE REDIS PARA CADA LEADERBOARD
// ======================================================

function keyFor(difficulty) {
  return `${BASE_KEY}:${difficulty}`;
}


// ======================================================
// CONVERTIR RESPUESTA REDIS EN LISTA
// ======================================================

function parseTop(raw) {
  const rows = [];

  for (
    let i = 0;
    i < (raw || []).length;
    i += 2
  ) {
    rows.push({
      name: String(raw[i]),
      score: Number(raw[i + 1])
    });
  }

  return rows;
}


// ======================================================
// OBTENER TOP 10
// ======================================================

async function getTop(difficulty) {
  const raw = await redis([
    'ZREVRANGE',
    keyFor(difficulty),
    '0',
    '9',
    'WITHSCORES'
  ]);

  return parseTop(raw);
}


// ======================================================
// RESPUESTA JSON
// ======================================================

function send(res, status, data) {
  res.statusCode = status;

  res.setHeader(
    'Content-Type',
    'application/json; charset=utf-8'
  );

  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate'
  );

  res.end(JSON.stringify(data));
}


// ======================================================
// LEER PARÁMETROS DE LA URL
// ======================================================

function getQuery(req) {
  try {
    return new URL(
      req.url,
      'http://localhost'
    ).searchParams;
  } catch {
    return new URLSearchParams();
  }
}


// ======================================================
// LEER BODY JSON
// ======================================================

async function readJsonBody(req) {

  // Vercel normalmente entrega req.body ya procesado.

  if (
    req.body &&
    typeof req.body === 'object'
  ) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  let raw = '';

  for await (const chunk of req) {
    raw += chunk;
  }

  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}


// ======================================================
// API PRINCIPAL
// ======================================================

module.exports = async function handler(req, res) {

  try {

    const query = getQuery(req);


    // ==================================================
    // TEST DE CONEXIÓN
    // /api/leaderboard?health=1
    // ==================================================

    if (
      req.method === 'GET' &&
      query.get('health') === '1'
    ) {

      await redis(['PING']);

      return send(res, 200, {
        ok: true,
        redis: 'connected',
        baseKey: BASE_KEY,
        levels: Object.keys(LEVELS)
      });
    }


    // ==================================================
    // GET
    // CARGAR LEADERBOARD
    // ==================================================

    if (req.method === 'GET') {

      const difficulty =
        validDifficulty(
          query.get('difficulty')
        );

      if (!difficulty) {
        return send(res, 400, {
          error:
            'Debes indicar difficulty=facil, normal, dificil o extremo'
        });
      }

      const top =
        await getTop(difficulty);

      return send(res, 200, {
        difficulty,
        top
      });
    }


    // ==================================================
    // SOLO GET Y POST
    // ==================================================

    if (req.method !== 'POST') {

      res.setHeader(
        'Allow',
        'GET, POST'
      );

      return send(res, 405, {
        error: 'Método no permitido'
      });
    }


    // ==================================================
    // RECIBIR RESULTADO DE PARTIDA
    // ==================================================

    const body =
      await readJsonBody(req);

    const name =
      cleanName(body.name);

    const difficulty =
      validDifficulty(
        body.difficulty
      );

    const correct =
      Number(body.correct);

    const score =
      Number(body.score);


    // ==================================================
    // VALIDAR NOMBRE
    // ==================================================

    // Permite nombres desde 1 carácter.
    // Máximo 20 caracteres.

    if (!name) {
      return send(res, 400, {
        error:
          'Nombre de usuario inválido'
      });
    }


    // ==================================================
    // VALIDAR NIVEL
    // ==================================================

    if (!difficulty) {
      return send(res, 400, {
        error:
          'Dificultad inválida'
      });
    }


    const config =
      LEVELS[difficulty];


    // ==================================================
    // VALIDAR RESPUESTAS CORRECTAS
    // ==================================================

    if (
      !Number.isInteger(correct) ||
      correct < 0 ||
      correct > config.maxCorrect
    ) {

      return send(res, 400, {
        error:
          'Cantidad de respuestas correctas inválida'
      });
    }


    // ==================================================
    // VALIDAR PUNTUACIÓN
    // ==================================================

    const expectedScore =
      correct * config.points;

    if (
      !Number.isInteger(score) ||
      score !== expectedScore
    ) {

      return send(res, 400, {
        error:
          'Puntuación inválida',

        detail:
          `Para ${difficulty}, ` +
          `${correct} aciertos deben equivaler a ` +
          `${expectedScore} puntos.`
      });
    }


    // ==================================================
    // LEADERBOARD CORRESPONDIENTE
    // ==================================================

    const key =
      keyFor(difficulty);


    // ==================================================
    // BUSCAR PUNTAJE ANTERIOR
    // ==================================================

    const previousRaw =
      await redis([
        'ZSCORE',
        key,
        name
      ]);

    const previousScore =
      previousRaw === null ||
      previousRaw === undefined
        ? null
        : Number(previousRaw);


    // ==================================================
    // GUARDAR SOLO SI ES UN NUEVO RÉCORD
    // ==================================================

    if (
      previousScore === null ||
      score > previousScore
    ) {

      await redis([
        'ZADD',
        key,
        String(score),
        name
      ]);
    }


    // ==================================================
    // OBTENER POSICIÓN, RÉCORD Y TOP 10
    // ==================================================

    const [
      rankRaw,
      bestRaw,
      top
    ] = await Promise.all([

      redis([
        'ZREVRANK',
        key,
        name
      ]),

      redis([
        'ZSCORE',
        key,
        name
      ]),

      getTop(difficulty)

    ]);


    // Redis comienza las posiciones desde 0.
    // Por eso sumamos 1.

    const rank =
      rankRaw === null ||
      rankRaw === undefined
        ? null
        : Number(rankRaw) + 1;


    const bestScore =
      bestRaw === null ||
      bestRaw === undefined
        ? score
        : Number(bestRaw);


    // ==================================================
    // RESPUESTA FINAL
    // ==================================================

    return send(res, 200, {

      saved: true,

      name,

      difficulty,

      rank,

      bestScore,

      top

    });


  } catch (error) {

    console.error(
      'Leaderboard API:',
      error
    );

    return send(res, 500, {

      error:
        'No se pudo guardar o cargar el leaderboard',

      detail:
        String(
          error?.message ||
          error
        )

    });
  }
};
