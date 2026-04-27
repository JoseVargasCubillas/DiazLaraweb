# Diaz Lara Landing (Frontend)

Landing en React + TypeScript + Vite para captar solicitudes de sesion.

## Requisitos

- Node.js 20+
- Backend levantado y accesible por HTTP

## Configuracion de entorno

1. Crea un archivo `.env` en la raiz.
2. Copia el contenido de `.env.example`.
3. Ajusta los valores segun tu backend.

Variables usadas por el frontend:

- `VITE_API_URL`: URL base del backend (ejemplo: `http://localhost:3000`).
- `VITE_BOOKING_ENDPOINT`: endpoint para guardar reservas.
  - Ruta relativa: ` /api/sessions/bookings` (se concatena con `VITE_API_URL`).
  - URL completa: `https://api.tudominio.com/api/sessions/bookings`.

## Ejecutar

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Nota importante

Este repositorio contiene solo frontend. El guardado en base de datos depende de que exista un backend activo en el endpoint configurado.
