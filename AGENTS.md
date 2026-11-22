# ShopLedger Agent Guide

## Stack
- Node.js with CommonJS modules.
- Express 4 and body-parser 1; `server.js` serves `public/` and mounts the API routers at `/api`.
- Browser UI is plain HTML, CSS, and JavaScript under `public/`.
- Application records are stored in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers and records Khata settlements.
- `routes/orders.js` — lists, reads, places, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — supplies today's date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable HTML.
- `lib/ledger.js` — lists customers, charges/reverses Khata orders, and records settlements.
- `lib/orders.js` — adds, finds, cancels, and lists orders.
- `lib/pricing.js` — computes subtotals, discounts, line tax, and order totals.
- `lib/reports.js` — builds dashboard summaries and compares invoice figures with stored order figures.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves item GST rates/slabs and splits tax into CGST and SGST.

## Commands
- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.
- `package.json`'s `npm test` script is a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
