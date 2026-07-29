# jntugv_admmissions

Admissions portal for the JNTUGV RUKF-IIBMP 2026 application process.

## Features

- React/Vite frontend for candidate application flow.
- Node.js backend for yearly admissions schemas and application storage.
- File upload persistence for certificates, rank cards, SBI Collect payment receipts, photos, and signatures.
- Department Login for Directorate of Admissions users.
- Convenor, Co-convenor, and Verification Officer management.
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

For local development without MySQL, use JSON storage:

```bash
STORAGE_DRIVER=json
PORT=5000
PUBLIC_ORIGIN=http://localhost:5173
```

Start the backend API:

```bash
npm run dev:api:local
```

Start the frontend:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://localhost:5000`

## Department Login

On first backend start, a default Convenor account is created in local runtime data from environment variables.

```text
ADMIN_USERNAME=da@jntugv.edu.in
ADMIN_PASSWORD=use-a-strong-secret-password
ADMIN_NAME=Directorate of Admissions Convenor
```

Set these values in `.env` for local use and in `/etc/jntugv-admissions.env` for production. The runtime `server/data/admin-users.json` file stores only the password hash. The Convenor can create Co-convenor and Verification Officer logins from Department Login.

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

Database-backed production storage is enabled when `DB_NAME` and `DB_USER` are set. The application still stores the full application JSON for existing fetch screens, and also writes searchable MySQL rows for applications, payments, department logins, and serialized counters.

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=iibmp-admissions
DB_USER=jntugv-admissions
DB_PASSWORD=your-database-password
```

Email notifications are enabled when `SMTP_HOST` is set. The server emails candidates after submission and status changes, and emails department login credentials when a Convenor creates a Co-convenor or Verification Officer.

```text
MAIL_FROM=admissions@jntugv.edu.in
ADMIN_NOTIFY_EMAIL=da@jntugv.edu.in
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admissions@jntugv.edu.in
SMTP_PASS=your-smtp-password
```

Recommended server layout:

```text
/var/www/jntugv-admissions      application code
/etc/jntugv-admissions.env      production environment variables
```

Deployment templates are included:

- `deploy/jntugv-admissions.service` for systemd.
- `deploy/nginx-admissions.jntugv.edu.in.conf` for Nginx reverse proxy.
- `ecosystem.config.cjs` for PM2 production hosting.

Point `admissions.jntugv.edu.in` to the server, proxy it to `127.0.0.1:5000`, then enable HTTPS using the institution SSL certificate or Certbot.

If PM2 is used in production, do not run the Vite development server publicly. Build the frontend and serve it through the Node API:

```bash
set -a
. /etc/jntugv-admissions.env
set +a
npm ci
npm run build
pm2 delete jntugv_admissions_frontend || true
pm2 startOrReload ecosystem.config.cjs --env production --update-env
pm2 save
```

## SBI Collect Payment

Admissions fee payment is handled through SBI Collect outside the portal. Candidates must complete payment first, then enter the payment details in Step 5.

Required payment flow:

1. Open SBI Collect and pay the admission application fee under the official university payment category.
2. Download the SBI Collect receipt after payment.
3. Enter the fee amount, SBI Collect reference number, transaction date, mode of payment, and payment status in the portal.
4. Upload the SBI Collect receipt as a PDF payment proof.

The admissions office can verify the uploaded PDF receipt from the admin console.

## Verification Workflow

Admissions verification follows this office flow:

```text
Submitted -> Under Review / Verification in Progress -> Verified / Needs Correction / Rejected
```

Director / Convenor admin users can assign each submitted application to a specific active verification officer. Verification officers see only the applications assigned to them.

## Runtime Data

Runtime application data, uploaded files, and admin user credentials are intentionally ignored by Git. Yearly schema files, such as `server/data/admissions/2026/IIBMP/schema.json`, remain source-controlled.

Back up `server/data/` regularly in production. It contains submitted applications, uploaded documents, verification users, and review status records.
