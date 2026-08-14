# Lexitify

**Lexitify** es un juego web educativo diseñado para practicar y mejorar la ortografía en español de una forma dinámica, progresiva y competitiva.

El jugador debe resolver distintos desafíos ortográficos, completar oraciones, elegir palabras correctamente y acumular puntos para posicionarse en el leaderboard.

> **Proyecto · Liahona El Belloto · 2026**

---

## 🎯 Objetivo

Lexitify busca transformar la práctica de la ortografía en una experiencia más entretenida e interactiva.

En lugar de limitarse a ejercicios tradicionales, el proyecto incorpora:

* Preguntas aleatorias.
* Diferentes niveles de dificultad.
* Opciones que cambian de posición.
* Ejercicios de selección y completación.
* Sistema de puntuación.
* Leaderboards independientes.
* Un modo secreto de alta dificultad.

---

## 🎮 Modos de juego

### 🌱 Fácil

Nivel pensado para practicar conceptos fundamentales de ortografía y palabras de uso habitual.

* 10 ejercicios por partida.
* Banco amplio de preguntas.
* **50 puntos** por respuesta correcta.
* Puntuación máxima por partida: **500 puntos**.
* Leaderboard independiente.

### ⚡ Normal

Aumenta la dificultad e incorpora ejercicios más exigentes, incluyendo homófonos, grafías, puntuación y completación de oraciones.

* 10 ejercicios por partida.
* **75 puntos** por respuesta correcta.
* Puntuación máxima: **750 puntos**.
* Leaderboard independiente.

### 🧠 Difícil

Orientado a jugadores que buscan mayor precisión ortográfica y dominio del idioma.

* 10 ejercicios por partida.
* Mayor presencia de ejercicios de completación.
* **100 puntos** por respuesta correcta.
* Puntuación máxima: **1000 puntos**.
* Leaderboard independiente.

### 🜏 Extremo

Existe además un **modo oculto** para quienes quieran llevar el desafío mucho más lejos.

Sus reglas son diferentes:

* Hasta **150 retos**.
* Cada reto contiene **8 espacios y 32 opciones**.
* Las palabras deben seleccionarse en el orden correcto.
* Cada reto superado entrega **1 punto**.
* **Un solo error termina inmediatamente la partida.**
* Leaderboard exclusivo para Extremo.

El acceso a este nivel está oculto dentro de la interfaz de Lexitify.

---

## 🔀 Sistema de preguntas

Lexitify utiliza bancos de ejercicios y selección aleatoria para reducir la memorización mecánica.

Las preguntas y alternativas pueden cambiar de posición entre partidas, obligando al jugador a leer y analizar las opciones en lugar de aprender dónde se encuentra visualmente la respuesta correcta.

En los ejercicios tradicionales también existe una breve pausa antes de habilitar las alternativas.

---

## 🏆 Leaderboard

Lexitify cuenta con un sistema de clasificación persistente.

Cada modalidad posee su propia tabla:

| Nivel      | Puntos por acierto | Máximo |
| ---------- | -----------------: | -----: |
| 🌱 Fácil   |                 50 |    500 |
| ⚡ Normal   |                 75 |    750 |
| 🧠 Difícil |                100 |   1000 |
| 🜏 Extremo |                  1 |    150 |

Los resultados de un nivel no se mezclan con los de los demás.

El sistema conserva el **mejor puntaje registrado por cada nombre de usuario** dentro de cada modalidad.

---

## ☁️ Persistencia de datos

El leaderboard utiliza **Redis/Upstash** para almacenar las puntuaciones.

La API se encuentra en:

```text
/api/leaderboard.js
```

Las tablas utilizan claves independientes para cada modalidad:

```text
lexitify:leaderboard:v2:facil
lexitify:leaderboard:v2:normal
lexitify:leaderboard:v2:dificil
lexitify:leaderboard:v2:extremo
```

---

## 🛠️ Tecnologías

El proyecto está construido principalmente con:

* HTML5
* CSS3
* JavaScript
* Vercel Serverless Functions
* Redis / Upstash
* GitHub
* Vercel

La interfaz principal se mantiene deliberadamente ligera y funciona directamente desde el navegador.

---

## 📁 Estructura

```text
Lexitify/
│
├── index.html
├── vercel.json
├── logo.png
├── favicon.ico
├── README.md
│
└── api/
    └── leaderboard.js
```

`index.html` contiene la interfaz y la lógica principal del juego.

`api/leaderboard.js` administra la comunicación con Redis y los rankings.

`vercel.json` contiene la configuración necesaria para el despliegue.

---

## ⚙️ Variables de entorno

Para que el leaderboard funcione en Vercel deben configurarse las credenciales de Redis/Upstash.

Lexitify admite:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

También es compatible con:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

Estas credenciales **no deben escribirse directamente en `index.html` ni publicarse en el repositorio**.

---

## 🚀 Despliegue

El proyecto está preparado para desplegarse mediante Vercel.

Después de conectar el repositorio a Vercel:

1. Configurar las variables de entorno de Redis/Upstash.
2. Realizar el deployment.
3. Verificar la conexión del leaderboard.
4. Probar el guardado de puntuaciones en cada modalidad.

La API dispone además de una comprobación de conexión para facilitar el diagnóstico del backend.

---

## 🧩 Filosofía del juego

Lexitify se basa en tres ideas:

### 01 · Practica

Ejercicios breves y claros para trabajar la ortografía de forma activa.

### 02 · Progresa

Diferentes dificultades permiten aumentar gradualmente la complejidad.

### 03 · Compite

Los rankings añaden un componente competitivo y permiten intentar superar el mejor resultado.

---

## 🔒 Seguridad básica

Las puntuaciones son validadas por el backend antes de almacenarse.

El servidor comprueba que el puntaje recibido sea compatible con:

* La modalidad seleccionada.
* La cantidad de respuestas correctas.
* Los puntos permitidos por ese nivel.

Las credenciales de Redis permanecen exclusivamente como variables de entorno del servidor.

---

## 📌 Estado del proyecto

Lexitify se encuentra actualmente en desarrollo activo.

Entre las características implementadas se encuentran:

* [x] Nivel Fácil
* [x] Nivel Normal
* [x] Nivel Difícil
* [x] Modo Extremo oculto
* [x] Preguntas aleatorias
* [x] Alternativas aleatorias
* [x] Ejercicios de completación
* [x] Sistema de puntuación
* [x] Leaderboards separados
* [x] Persistencia mediante Redis
* [x] Diseño responsive para computador y dispositivos móviles
* [x] Despliegue mediante Vercel

---

## 🏫 Proyecto

**Lexitify · Proyecto · Liahona El Belloto · 2026**

Proyecto educativo desarrollado con el propósito de fomentar la práctica de la ortografía mediante una experiencia web interactiva, accesible y competitiva.
