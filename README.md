# TDSE Copiloto de Triage RAG — Frontend

Interfaz web (React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts) para el
prototipo del copiloto de triage. Es una capa de presentación **opcional**:
consume la API FastAPI del repositorio **TDSE_Copiloto_Triage_Backend**
(desplegada en Azure), que a su vez envuelve el pipeline principal sin
duplicar su lógica. Ver el README de ese repositorio, sección **"Interfaz web
(React + TypeScript)"**, para el contexto completo.

## Conexión con el backend

La URL de la API se fija en tiempo de build con `VITE_API_URL` (ver
`.env.example`). Vacía, el front usa rutas relativas (`/api/...`), que en
desarrollo resuelve el proxy de Vite hacia `http://127.0.0.1:8000`.
El backend debe incluir el dominio de Vercel en `CORS_ORIGINS` /
`CORS_ORIGIN_REGEX`.

## Despliegue (Vercel) — provisional

1. `npx vercel link` (crea el proyecto y `.vercel/project.json`, no se versiona).
2. En Vercel > Settings > Environment Variables: `VITE_API_URL=https://<app>.azurewebsites.net`
   para **Production** y **Preview**.
3. En GitHub > Settings > Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
   (los dos últimos salen de `.vercel/project.json`).
4. Desactivar el despliegue automático por Git de Vercel (Settings > Git) para
   no desplegar dos veces: lo hace `.github/workflows/ci-cd.yml` (preview en
   cada PR, producción en cada push a `main`).

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:5173, proxyea /api/* a http://127.0.0.1:8000
```

Requiere que el backend esté corriendo en el puerto 8000 (ver su README) para que las pantallas con datos reales funcionen.

## Build de producción

```bash
npm run build      # type-checks (tsc -b) + build (vite build) -> dist/
npm run preview     # sirve el build de dist/ localmente
```

## Estructura

```
src/
  api.ts            Cliente tipado de la API (fetch + tipos de types.ts)
  types.ts          Tipos TypeScript en espejo de los modelos Pydantic del backend
  components/       Componentes compartidos (badges de nivel, tarjetas, spinners...)
  views/
    ConsultaView.tsx      Equivalente web de demo.py / la pestaña "Consulta individual" de gui.py
    ExperimentoView.tsx   Equivalente web de `python -m experiments.run_experiment`, con gráfico
    DatasetView.tsx       Equivalente web de `python -m experiments.analyze_external_data`, con gráficos
    ExplorarView.tsx      Explorador del corpus normativo y las 74 viñetas del gold standard
  App.tsx           Shell con navegación lateral entre las 4 vistas
```
