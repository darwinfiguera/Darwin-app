# MisCuentas

App de finanzas personales y familiares: no solo registra gastos e ingresos, sino que actúa como un compañero financiero que alerta con un semáforo (verde/amarillo/rojo), sugiere mejoras basadas en reglas de coaching financiero (regla 50/30/20, fondo de emergencia, ratio de deuda, detección de gastos en aumento) y ayuda a cumplir metas de ahorro.

El código es 100% tuyo: la app se compila con Expo/React Native y el backend es un servidor Node.js + PostgreSQL que alojás vos, en el servidor que quieras.

```
.
├── app/       → App móvil (Expo / React Native + TypeScript)
├── backend/   → API + panel de admin (Node.js/Express + Prisma + PostgreSQL)
├── design/    → Wireframes de diseño (wireframes.html)
└── docker-compose.yml → Levanta backend + base de datos con un solo comando
```

## 1. Backend (lo que alojás en tu servidor)

### Opción rápida: Docker (recomendado para producción)

```bash
cd backend
cp .env.example .env      # completá JWT_SECRET, ADMIN_EMAIL, y las claves de Stripe/Google/Apple cuando las tengas
cd ..
docker compose up -d --build
```

Esto levanta PostgreSQL + el backend en `http://tu-servidor:4000`, corre las migraciones automáticamente y sirve el panel de admin en `http://tu-servidor:4000/admin`.

### Opción local (para desarrollar)

Requisitos: Node.js 20+, PostgreSQL corriendo localmente.

```bash
cd backend
npm install
cp .env.example .env      # ajustá DATABASE_URL a tu Postgres local
npx prisma migrate dev    # crea las tablas
npm run seed               # carga las categorías predefinidas (Comida, Transporte, etc.)
npm run dev                 # http://localhost:4000
```

### Variables de entorno importantes (`backend/.env`)

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Firma de sesiones — generá un string largo y random |
| `ADMIN_EMAIL` | El primer usuario que se registre con este email queda como administrador (puede generar códigos de acceso gratuito) |
| `GOOGLE_CLIENT_ID` | Habilita "Continuar con Google" (creá credenciales en [Google Cloud Console](https://console.cloud.google.com/apis/credentials)) |
| `APPLE_CLIENT_ID` | Habilita "Continuar con Apple" (Services ID en tu cuenta de Apple Developer) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_ANNUAL` | Cobro de la suscripción Premium |

Sin las claves de Stripe/Google/Apple, el resto de la app funciona igual (registro por email, categorías, presupuestos, metas, códigos de canje); esas integraciones quedan deshabilitadas hasta que las completes.

### Panel de administración

Andá a `http://tu-servidor:4000/admin`, iniciá sesión con la cuenta que coincide con `ADMIN_EMAIL`, y generá códigos de acceso Premium gratuito (30 días / 6 meses / de por vida). Ahí mismo ves qué código usó cada usuario y cuándo.

## 2. App móvil

Requisitos: Node.js 20+, y para probar en el teléfono la app **Expo Go** (o Xcode/Android Studio si querés compilar nativo).

```bash
cd app
npm install
cp .env.example .env
# EXPO_PUBLIC_API_URL debe apuntar a tu backend.
# Si probás desde el celular, usá la IP de tu compu en la red (no "localhost").
npx expo start
```

Escaneá el QR con la app **Expo Go** (Android) o la cámara (iOS) para probarla en tu celular sin compilar nada.

### Publicar en las stores

Cuando quieras subirla a la App Store / Google Play, usá [EAS Build](https://docs.expo.dev/build/introduction/) (de Expo):

```bash
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android
```

Esto no requiere ningún servicio de Expo para tu backend — solo se usa para compilar los instaladores de iOS/Android. Tu API sigue viviendo enteramente en tu servidor.

## 3. Cómo está armado el "compañero financiero"

- **Semáforo de presupuesto**: verde (0–70% del presupuesto de una categoría), amarillo (70–100%), rojo (+100%). Se calcula en `backend/src/utils/alerts.ts` y se muestra en los medidores del dashboard.
- **Coach financiero** (`backend/src/services/coach.service.ts`): aplica la regla 50/30/20 (necesidades/gustos/ahorro), calcula meses de fondo de emergencia cubiertos, alerta si la deuda supera el 20% de tus ingresos, detecta categorías con gasto en aumento mes a mes, y arma un puntaje de salud financiera de 0 a 100. Todo con mensajes cercanos y motivadores, nunca punitivos.
- **Freemium**: el plan gratuito limita a 1 cuenta, 1 meta activa, categorías predefinidas y 1 mes de histórico (`backend/src/utils/plan.ts`). Premium se activa por Stripe o por código de canje.

## 4. Diseño

Los wireframes de las 5 pantallas principales (onboarding, dashboard, registro de gasto, metas, canje de código) están en `design/wireframes.html` — abrilo en el navegador para verlos.
