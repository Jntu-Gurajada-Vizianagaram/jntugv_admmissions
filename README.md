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
jntugv-portal/
  src/                    React frontend
  server/                 Node.js admissions API
  server/data/admissions/ Year/process schemas and runtime data
  public/                 Static assets and logos
```

## Development

Install dependencies:

```bash
cd jntugv-portal
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

On first backend start, a default admin account is created in local runtime data.

```text
Username: admin
Password: Admin@2026
```

Change or disable this account from the admin console before production use.

## Useful Commands

```bash
npm run build
npm run lint
```

## Runtime Data

Runtime application data, uploaded files, and admin user credentials are intentionally ignored by Git. Yearly schema files, such as `server/data/admissions/2026/IIBMP/schema.json`, remain source-controlled.
