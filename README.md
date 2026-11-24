# Taantira Frontend (React + Vite + JavaScript + Tailwind CSS)

Shared frontend repository (`taantira-frontend`). Contains zero backend source files or secrets.

## Local Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Preserved & Storefront Routes

- `/` — Preserved Vite React starter page (`hero.png`, `App.css`, `index.css` intact) with quick portal links
- `/store` — Taantira Women's Fashion Storefront Homepage
- `/collections/:slug` — Filterable product catalogue
- `/products/:slug` — Product detail page with category-dependent tailoring/gift options
- `/cart` & `/checkout` — Shopping bag & 7-step checkout (COD & manual UPI verification)
- `/account/*` — Customer dashboard, monthly spending Recharts, live map tracking & OTP display
- `/admin/*` — Role-based admin portal (12 Recharts charts, TanStack Tables, CSV export)
- `/delivery` — Web delivery partner portal with browser Geolocation & OTP delivery proof

## Hosting Notice

`vercel.json` is included for SPA rewrites, but Vercel Hobby is strictly for personal/non-commercial use. Choose a commercial-eligible hosting plan before launching Taantira commercially.
