# Lexitify — versión corregida

## Cambios incluidos

- 100 ejercicios en Fácil.
- 100 ejercicios en Normal.
- 100 ejercicios en Difícil.
- 300 ejercicios totales.
- Cada partida selecciona 10 ejercicios al azar del banco de 100.
- Cada pregunta muestra 6 alternativas.
- Las 6 alternativas se barajan en cada pregunta, incluida la correcta.
- Hay una pausa breve antes de habilitar las respuestas para obligar a leer las opciones.
- Leaderboard corregido para Vercel en `api/leaderboard.js`.
- Compatible con variables `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` y también `KV_REST_API_URL` / `KV_REST_API_TOKEN`.

## Vercel

La estructura debe quedar:

```
index.html
vercel.json
api/
  leaderboard.js
```

Conecta una base Redis/Upstash y configura uno de estos pares de variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

o:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Después haz un redeploy.
