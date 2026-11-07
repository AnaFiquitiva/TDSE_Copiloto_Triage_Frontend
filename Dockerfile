# Interfaz web: build con Node y servida con nginx, que reenvia /api y
# /cds-services a la API. Contexto de build: la raiz de este repositorio.
FROM node:22-alpine AS build
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
