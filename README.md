# jntugv_admmissions

Admissions portal for the JNTUGV RUKF-IIBMP 2026 application process.

## Features

- React/Vite frontend for candidate application flow.
- Node.js backend for yearly admissions schemas and application storage.
- File upload persistence for certificates, rank cards, payment proofs, photos, and signatures.
- Admin login for admissions office users.
- Verification officer management.
- College-level application retrieval, document preview, verification, print, and PDF download.
- Printable application format with JNTUGV and Reutlingen Knowledge Foundation branding.

## Project Structure

```text
src/                    React frontend
server/                 Node.js admissions API
server/data/admissions/ Year/process schemas and runtime data
public/                 Static assets and logos
```

## Development

Install dependencies:

```bash
npm install
```

Start the backend API:

```bash
npm run dev:api
```

Start the frontend:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://localhost:5000`

## Admin Login

On first backend start, a default admin account is created in local runtime data from environment variables.

```text
ADMIN_USERNAME=da@jntugv.edu.in
ADMIN_PASSWORD=use-a-strong-secret-password
ADMIN_NAME=Director of Admissions
```

Set these values in `.env` for local use and in `/etc/jntugv-admissions.env` for production. The runtime `server/data/admin-users.json` file stores only the password hash.

## Useful Commands

```bash
npm run build
npm run lint
npm start
```

## Production Deployment

The production domain is expected to be:

```text
https://admissions.jntugv.edu.in
```

Build the frontend and serve the complete portal from the Node backend:

```bash
npm ci
npm run build
npm start
```

Use `.env.production.example` as the template for the server environment. In production, set a strong unique `ADMIN_TOKEN_SECRET`, keep `PORT=5000`, and set:

```text
PUBLIC_ORIGIN=https://admissions.jntugv.edu.in
```

Recommended server layout:

```text
/var/www/jntugv-admissions      application code
/etc/jntugv-admissions.env      production environment variables
```

Deployment templates are included:

- `deploy/jntugv-admissions.service` for systemd.
- `deploy/nginx-admissions.jntugv.edu.in.conf` for Nginx reverse proxy.

Point `admissions.jntugv.edu.in` to the server, proxy it to `127.0.0.1:5000`, then enable HTTPS using the institution SSL certificate or Certbot.

## Runtime Data

Runtime application data, uploaded files, and admin user credentials are intentionally ignored by Git. Yearly schema files, such as `server/data/admissions/2026/IIBMP/schema.json`, remain source-controlled.

Back up `server/data/` regularly in production. It contains submitted applications, uploaded documents, verification users, and review status records.
