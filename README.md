# Fucksnews - Pagina de votacion por QR

Sistema simple para votar entre:
- Noticias del Mago
- Noticias de Sanchez

## 1) Ejecutar local

Requisitos: Node.js 18+.

```bash
node server.js
```

Abrir:
- `http://localhost:3000/` -> pagina de votacion
- `http://localhost:3000/admin.html` -> generador de QR

## Caricaturas en portada

Para usar la imagen de caricaturas en el hero:

1. Crea la carpeta `public/assets/` si no existe.
2. Guarda la imagen como `public/assets/fucksnews-caricaturas.png` (recomendado), o `.jpg/.jpeg/.webp`.
3. Recarga la pagina.

## 2) Como usar en el canal

1. Sube este proyecto a un hosting (Render, Railway, VPS, etc.).
2. Abre `/admin.html`.
3. Genera el QR con la URL publica.
4. Muestra el QR en stream/video para que la gente escanee y vote.

## Deploy recomendado (Render)

GitHub Pages no puede ejecutar la API de votos. Para que SI funcione la votacion:

1. En Render, crea un servicio desde este repo.
2. Render detecta `render.yaml` automaticamente.
3. Espera deploy y abre la URL publica de Render.
4. En `/admin.html`, genera QR con esa URL publica.

## 3) Seguridad basica incluida

- 1 voto por navegador (cookie).
- Bloqueo adicional por huella IP+User-Agent.

## 4) Reset de votos (opcional)

Si defines `ADMIN_TOKEN`, puedes resetear con:

```bash
curl -X POST http://localhost:3000/api/reset -H "x-admin-token: TU_TOKEN"
```
