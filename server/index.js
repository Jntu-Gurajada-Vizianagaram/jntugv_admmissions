import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const STATIC_DIR = path.join(ROOT_DIR, 'dist');
const PORT = Number(process.env.PORT || 5000);
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || '*';
const DATA_DIR = path.join(__dirname, 'data');
const ADMISSIONS_DIR = path.join(DATA_DIR, 'admissions');
const LEGACY_APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const ADMIN_USERS_FILE = path.join(DATA_DIR, 'admin-users.json');
const PASSWORD_RESETS_FILE = path.join(DATA_DIR, 'password-resets.json');
const APPLICANT_ACCOUNTS_FILE = path.join(DATA_DIR, 'applicant-accounts.json');
const APPLICANT_DRAFTS_FILE = path.join(DATA_DIR, 'applicant-drafts.json');
const DEFAULT_YEAR = '2026';
const DEFAULT_PROCESS = 'IIBMP';
const MAX_BODY_SIZE = 120_000_000;
const VERIFICATION_STAGES = ['Submitted', 'Under Review / Verification in Progress', 'Verified', 'Needs Correction', 'Rejected'];
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'jntugv-admissions-local-secret';
const APPLICATION_OPENS_AT = new Date('2026-07-30T17:00:00+05:30').getTime();
const APPLICATION_OPEN_OVERRIDE = String(process.env.APPLICATION_OPEN_OVERRIDE || '').toLowerCase() === 'true';
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'auto';
const DB_CONFIGURED = STORAGE_DRIVER !== 'json' && Boolean(process.env.DATABASE_URL || (process.env.DB_NAME && process.env.DB_USER));
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_USERNAME || '';
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || ADMIN_NOTIFY_EMAIL;
const PAYMENT_TITLES = ['Counselling Fee', 'First-Year Tuition Fee'];
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

const IIBMP_2026_SCHEMA = {
  year: '2026',
  processCode: 'IIBMP',
  title: 'RUKF-IIBMP Application 2026',
  registrationPrefix: 'JNTUGV-IIBMP',
  programmes: [
    'B. Tech in CSE & M. Sc in Professional Software Engineering',
    'B. Tech in ECE & M. Sc in Digital Business Management',
  ],
  eligibilityExams: ['ap', 'tg', 'jee', 'others'],
  requiredSections: [
    'programme',
    'personal',
    'education',
    'additionalDocuments',
    'declaration',
  ],
  documentRules: {
    rankCards: 'Required for every selected competitive exam',
    aadhaar: 'Required for all candidates',
    caste: 'Required when category is not OC',
    educationCertificates: 'Required on each education row',
  },
};

let dbPool = null;
let dbUnavailable = false;
let mailTransporter = null;

const toMysqlDateTime = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const toIsoString = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
};

const parseStoredJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const createDbPool = () => {
  if (process.env.DATABASE_URL) {
    return mysql.createPool(process.env.DATABASE_URL);
  }
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    namedPlaceholders: true,
  });
};

const getDb = async () => {
  if (!DB_CONFIGURED || dbUnavailable) return null;
  try {
    if (!dbPool) dbPool = createDbPool();
    await dbPool.query('SELECT 1');
    return dbPool;
  } catch (error) {
    dbUnavailable = true;
    console.warn(`Database unavailable, using JSON storage fallback: ${error.message}`);
    return null;
  }
};

const initializeDatabase = async () => {
  const db = await getDb();
  if (!db) return false;

  await db.query(`
    CREATE TABLE IF NOT EXISTS admission_counters (
      year VARCHAR(8) NOT NULL,
      process_code VARCHAR(32) NOT NULL,
      last_number INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (year, process_code)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(80) NOT NULL PRIMARY KEY,
      username VARCHAR(190) NOT NULL UNIQUE,
      name VARCHAR(190) NOT NULL,
      role VARCHAR(40) NOT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      salt VARCHAR(80) NOT NULL,
      password_hash VARCHAR(128) NOT NULL,
      created_at DATETIME NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS applications (
      registration_no VARCHAR(80) NOT NULL PRIMARY KEY,
      year VARCHAR(8) NOT NULL,
      process_code VARCHAR(32) NOT NULL,
      schema_version VARCHAR(80) NOT NULL,
      status VARCHAR(80) NOT NULL,
      submitted_at DATETIME NOT NULL,
      verification_notes TEXT NULL,
      verification_stages LONGTEXT NULL,
      verified_by VARCHAR(190) NULL,
      verified_at DATETIME NULL,
      assigned_officer_id VARCHAR(80) NULL,
      application_json LONGTEXT NOT NULL,
      candidate_name VARCHAR(190) NULL,
      candidate_email VARCHAR(190) NULL,
      candidate_mobile VARCHAR(40) NULL,
      category VARCHAR(40) NULL,
      programme VARCHAR(255) NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_applications_year_process (year, process_code),
      INDEX idx_applications_status (status),
      INDEX idx_applications_candidate (candidate_name, candidate_email, candidate_mobile)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS application_payments (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      registration_no VARCHAR(80) NOT NULL,
      title VARCHAR(120) NOT NULL,
      amount DECIMAL(12,2) NULL,
      txn_ref VARCHAR(120) NULL,
      txn_date DATE NULL,
      mode VARCHAR(80) NULL,
      proof_name VARCHAR(255) NULL,
      proof_url VARCHAR(500) NULL,
      status VARCHAR(80) NOT NULL DEFAULT 'Submitted',
      payment_json LONGTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_payment_row (registration_no, title),
      INDEX idx_payments_txn_ref (txn_ref),
      CONSTRAINT fk_payments_application FOREIGN KEY (registration_no)
        REFERENCES applications(registration_no) ON DELETE CASCADE
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash VARCHAR(128) NOT NULL PRIMARY KEY,
      user_id VARCHAR(80) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_password_resets_user (user_id),
      CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id)
        REFERENCES admin_users(id) ON DELETE CASCADE
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS applicant_accounts (
      id VARCHAR(80) NOT NULL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      candidate_email VARCHAR(190) NOT NULL,
      candidate_mobile VARCHAR(40) NULL,
      candidate_name VARCHAR(190) NULL,
      salt VARCHAR(80) NOT NULL,
      password_hash VARCHAR(128) NOT NULL,
      created_at DATETIME NOT NULL,
      INDEX idx_applicant_email (candidate_email),
      INDEX idx_applicant_mobile (candidate_mobile)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS applicant_drafts (
      applicant_id VARCHAR(80) NOT NULL PRIMARY KEY,
      year VARCHAR(8) NOT NULL,
      process_code VARCHAR(32) NOT NULL,
      current_step INT NOT NULL DEFAULT 1,
      draft_json LONGTEXT NOT NULL,
      saved_at DATETIME NOT NULL,
      CONSTRAINT fk_applicant_drafts_account FOREIGN KEY (applicant_id)
        REFERENCES applicant_accounts(id) ON DELETE CASCADE
    )
  `);
  return true;
};

const getMailTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || '',
      } : undefined,
    });
  }
  return mailTransporter;
};

const sendMailSafe = async ({ to, subject, text, html }) => {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return;
  const transporter = getMailTransporter();
  if (!transporter || !MAIL_FROM) {
    console.log(`Mail skipped: ${subject} -> ${recipients.join(', ')}`);
    return { sent: false, skipped: true, error: 'Mail service is not configured.' };
  }
  try {
    const info = await transporter.sendMail({ from: MAIL_FROM, to: recipients.join(','), subject, text, html });
    return { sent: (info.accepted || []).length > 0, accepted: info.accepted || [], rejected: info.rejected || [] };
  } catch (error) {
    console.warn(`Mail delivery failed: ${error.message}`);
    return { sent: false, skipped: false, error: error.message };
  }
};

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

const commonHeaders = () => ({
  'Access-Control-Allow-Origin': PUBLIC_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

const json = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...commonHeaders(),
  });
  res.end(JSON.stringify(payload));
};

const readBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  let rejected = false;
  req.on('data', chunk => {
    if (rejected) return;
    body += chunk;
    if (body.length > MAX_BODY_SIZE) {
      rejected = true;
      const error = new Error('Payload too large. Please reduce uploaded file sizes and try again.');
      error.statusCode = 413;
      reject(error);
    }
  });
  req.on('end', () => {
    if (rejected) return;
    try {
      resolve(body ? JSON.parse(body) : {});
    } catch {
      reject(new Error('Invalid JSON payload'));
    }
  });
  req.on('error', reject);
});

const processDir = (year = DEFAULT_YEAR, processCode = DEFAULT_PROCESS) => (
  path.join(ADMISSIONS_DIR, String(year), String(processCode))
);

const applicationsFile = (year, processCode) => path.join(processDir(year, processCode), 'applications.json');
const schemaFile = (year, processCode) => path.join(processDir(year, processCode), 'schema.json');
const uploadDir = (year, processCode, registrationNo) => (
  path.join(processDir(year, processCode), 'uploads', registrationNo)
);

const ensureProcessStore = async (year = DEFAULT_YEAR, processCode = DEFAULT_PROCESS) => {
  await mkdir(processDir(year, processCode), { recursive: true });
  await mkdir(path.join(processDir(year, processCode), 'uploads'), { recursive: true });

  if (year === DEFAULT_YEAR && processCode === DEFAULT_PROCESS) {
    try {
      await access(schemaFile(year, processCode));
    } catch {
      await writeFile(schemaFile(year, processCode), JSON.stringify(IIBMP_2026_SCHEMA, null, 2));
    }
  }
};

const readJson = async (filePath, fallback) => {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
};

const writeJson = async (filePath, payload) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(payload, null, 2));
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  hash: crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex'),
});

const verifyPassword = (password, user) => {
  const hashed = hashPassword(password, user.salt);
  return hashed.hash === user.passwordHash;
};

const defaultAdminUsers = () => {
  const password = hashPassword(process.env.ADMIN_PASSWORD || 'admin');
  return [{
    id: 'admin',
    username: process.env.ADMIN_USERNAME || 'admin',
    name: process.env.ADMIN_NAME || 'Convenor, Admissions',
    role: 'admin',
    active: true,
    salt: password.salt,
    passwordHash: password.hash,
    createdAt: new Date().toISOString(),
  }];
};

const syncConfiguredAdminUser = async (users) => {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    return { users, changed: false, password: '' };
  }

  const configuredAdmin = defaultAdminUsers()[0];
  const existingIndex = users.findIndex(user => user.id === 'admin' || user.username === configuredAdmin.username);
  if (existingIndex >= 0) {
    const current = users[existingIndex];
    const shouldRepairPassword = current.username !== configuredAdmin.username;
    const passwordMatches = !shouldRepairPassword || verifyPassword(process.env.ADMIN_PASSWORD, current);
    const changed = (
      current.username !== configuredAdmin.username
      || current.name !== configuredAdmin.name
      || current.role !== configuredAdmin.role
      || !current.active
      || !passwordMatches
    );

    if (!changed) return { users, changed: false, password: '' };

    users[existingIndex] = {
      ...current,
      username: configuredAdmin.username,
      name: configuredAdmin.name,
      role: configuredAdmin.role,
      active: true,
      salt: shouldRepairPassword ? configuredAdmin.salt : current.salt,
      passwordHash: shouldRepairPassword ? configuredAdmin.passwordHash : current.passwordHash,
    };
    return { users, changed: true, password: process.env.ADMIN_PASSWORD };
  }

  return {
    users: [configuredAdmin, ...users],
    changed: true,
    password: process.env.ADMIN_PASSWORD,
  };
};

const loadAdminUsers = async () => {
  const db = await getDb();
  if (db) {
    const [rows] = await db.query('SELECT * FROM admin_users ORDER BY created_at ASC');
    if (rows.length > 0) {
      const dbUsers = rows.map(row => ({
        id: row.id,
        username: row.username,
        name: row.name,
        role: row.role,
        active: Boolean(row.active),
        salt: row.salt,
        passwordHash: row.password_hash,
        createdAt: toIsoString(row.created_at),
      }));
      const synced = await syncConfiguredAdminUser(dbUsers);
      if (synced.changed) {
        await saveAdminUsers(synced.users);
        await notifyDepartmentLoginCreated({ user: synced.users.find(user => user.id === 'admin'), password: synced.password });
      }
      return synced.users;
    }

    const initialUsers = defaultAdminUsers();
    await saveAdminUsers(initialUsers);
    await notifyDepartmentLoginCreated({ user: initialUsers[0], password: process.env.ADMIN_PASSWORD || 'admin' });
    return initialUsers;
  }

  const users = await readJson(ADMIN_USERS_FILE, null);
  if (users) {
    const synced = await syncConfiguredAdminUser(users);
    if (synced.changed) {
      await writeJson(ADMIN_USERS_FILE, synced.users);
      await notifyDepartmentLoginCreated({ user: synced.users.find(user => user.id === 'admin'), password: synced.password });
    }
    return synced.users;
  }
  const initialUsers = defaultAdminUsers();
  await writeJson(ADMIN_USERS_FILE, initialUsers);
  await notifyDepartmentLoginCreated({ user: initialUsers[0], password: process.env.ADMIN_PASSWORD || 'admin' });
  return initialUsers;
};

const saveAdminUsers = async (users) => {
  const db = await getDb();
  if (db) {
    for (const user of users) {
      await db.query(`
        INSERT INTO admin_users (
          id, username, name, role, active, salt, password_hash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          username = VALUES(username),
          name = VALUES(name),
          role = VALUES(role),
          active = VALUES(active),
          salt = VALUES(salt),
          password_hash = VALUES(password_hash)
      `, [
        user.id,
        user.username,
        user.name,
        user.role,
        user.active ? 1 : 0,
        user.salt,
        user.passwordHash,
        toMysqlDateTime(user.createdAt) || toMysqlDateTime(new Date()),
      ]);
    }
    return;
  }
  await writeJson(ADMIN_USERS_FILE, users);
};

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role,
  active: user.active,
  createdAt: user.createdAt,
});

const signToken = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
};

const readToken = (token) => {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  if (signature !== expected) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
  return payload;
};

const getAuthUser = async (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = readToken(token);
  if (!payload?.id) return null;
  const users = await loadAdminUsers();
  const user = users.find(item => item.id === payload.id && item.active);
  return user || null;
};

const requireAdminUser = async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) {
    json(res, 401, { message: 'Admin login required' });
    return null;
  }
  return user;
};

const requireSuperAdmin = async (req, res) => {
  const user = await requireAdminUser(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    json(res, 403, { message: 'Administrator access required' });
    return null;
  }
  return user;
};

const normalizeLegacyRecord = (record) => {
  const year = record.year || DEFAULT_YEAR;
  const processCode = record.processCode || DEFAULT_PROCESS;
  return {
    id: record.id || record.registrationNo,
    year,
    processCode,
    schemaVersion: record.schemaVersion || `${processCode}-${year}`,
    registrationNo: record.registrationNo,
    status: record.status || 'Submitted',
    submittedAt: record.submittedAt || new Date().toISOString(),
    verificationNotes: record.verificationNotes || '',
    verificationStages: record.verificationStages || {},
    verifiedBy: record.verifiedBy || '',
    verifiedAt: record.verifiedAt || '',
    application: record.application || {},
  };
};

const migrateLegacyApplications = async (year = DEFAULT_YEAR, processCode = DEFAULT_PROCESS) => {
  const targetFile = applicationsFile(year, processCode);
  const existing = await readJson(targetFile, null);
  if (existing) return;

  const legacyRecords = await readJson(LEGACY_APPLICATIONS_FILE, []);
  const migrated = legacyRecords
    .filter(record => record?.registrationNo)
    .map(normalizeLegacyRecord)
    .filter(record => record.year === year && record.processCode === processCode);

  if (migrated.length > 0) {
    await writeJson(targetFile, migrated);
  }
};

const sanitizeFilename = (name) => (
  String(name || 'upload')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'upload'
);

const extFromMime = (mimeType) => {
  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/jpeg') return '.jpg';
  return '.bin';
};

const decodeDataUrl = (dataUrl) => {
  const match = /^data:([^;]+);base64,(.+)$/u.exec(dataUrl || '');
  if (!match) return null;
  return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
};

const publicFileUrl = (year, processCode, registrationNo, filename) => (
  `/api/files/${encodeURIComponent(year)}/${encodeURIComponent(processCode)}/${encodeURIComponent(registrationNo)}/${encodeURIComponent(filename)}`
);

const saveUpload = async ({ year, processCode, registrationNo, fieldPath, file }) => {
  const upload = file?.dataUrl ? decodeDataUrl(file.dataUrl) : null;
  if (!upload) return file;

  const originalName = file.name || `${fieldPath}${extFromMime(upload.mimeType)}`;
  const filename = `${sanitizeFilename(fieldPath)}-${Date.now()}-${sanitizeFilename(originalName)}`;
  const targetDir = uploadDir(year, processCode, registrationNo);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, filename), upload.buffer);

  return {
    name: originalName,
    type: file.type || upload.mimeType,
    size: file.size || upload.buffer.length,
    storedName: filename,
    url: publicFileUrl(year, processCode, registrationNo, filename),
  };
};

const saveDataUrlImage = async ({ year, processCode, registrationNo, fieldPath, value }) => {
  const upload = decodeDataUrl(value);
  if (!upload) return value;

  const filename = `${sanitizeFilename(fieldPath)}${extFromMime(upload.mimeType)}`;
  const targetDir = uploadDir(year, processCode, registrationNo);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, filename), upload.buffer);

  return {
    name: filename,
    type: upload.mimeType,
    size: upload.buffer.length,
    storedName: filename,
    url: publicFileUrl(year, processCode, registrationNo, filename),
  };
};

const persistApplicationUploads = async ({ application, year, processCode, registrationNo }) => {
  const next = structuredClone(application);

  if (typeof next.personal?.photo === 'string') {
    next.personal.photo = await saveDataUrlImage({ year, processCode, registrationNo, fieldPath: 'photo', value: next.personal.photo });
  }

  if (typeof next.personal?.signature === 'string') {
    next.personal.signature = await saveDataUrlImage({ year, processCode, registrationNo, fieldPath: 'signature', value: next.personal.signature });
  }

  if (next.documents) {
    for (const [key, file] of Object.entries(next.documents)) {
      if (file?.dataUrl) {
        next.documents[key] = await saveUpload({ year, processCode, registrationNo, fieldPath: `documents-${key}`, file });
      }
    }
  }

  if (Array.isArray(next.education)) {
    for (const [index, row] of next.education.entries()) {
      if (row.certificateFile?.dataUrl) {
        row.certificateFile = await saveUpload({
          year,
          processCode,
          registrationNo,
          fieldPath: `education-${index + 1}-certificate`,
          file: row.certificateFile,
        });
      }
    }
  }

  if (Array.isArray(next.payments)) {
    for (const [index, payment] of next.payments.entries()) {
      if (payment.proofFile?.dataUrl) {
        payment.proofFile = await saveUpload({
          year,
          processCode,
          registrationNo,
          fieldPath: `payment-${index + 1}-proof`,
          file: payment.proofFile,
        });
      }
    }
  }

  return next;
};

const formatRegistrationNo = (year, processCode, serial) => (
  `JNTUGV-${processCode}-${year}-${String(serial).padStart(6, '0')}`
);

const nextSerialInTransaction = async (connection, year, processCode) => {
  const [rows] = await connection.query(
    'SELECT last_number FROM admission_counters WHERE year = ? AND process_code = ? FOR UPDATE',
    [year, processCode]
  );
  const nextSerial = rows.length ? Number(rows[0].last_number) + 1 : 1;
  if (rows.length) {
    await connection.query(
      'UPDATE admission_counters SET last_number = ? WHERE year = ? AND process_code = ?',
      [nextSerial, year, processCode]
    );
  } else {
    await connection.query(
      'INSERT INTO admission_counters (year, process_code, last_number) VALUES (?, ?, ?)',
      [year, processCode, nextSerial]
    );
  }
  return nextSerial;
};

const createRegistrationNo = async (year, processCode) => {
  const db = await getDb();
  if (db) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const nextSerial = await nextSerialInTransaction(connection, year, processCode);
      await connection.commit();
      return formatRegistrationNo(year, processCode, nextSerial);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  const records = await loadApplications(year, processCode);
  const maxSerial = records.reduce((max, record) => {
    const match = String(record.registrationNo || '').match(/-(\d+)$/u);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return formatRegistrationNo(year, processCode, maxSerial + 1);
};

const summarizeApplication = (record) => ({
  id: record.id,
  year: record.year,
  processCode: record.processCode,
  registrationNo: record.registrationNo,
  status: record.status,
  candidateName: record.application?.personal?.name || '',
  mobile: record.application?.personal?.mobile || '',
  email: record.application?.personal?.email || '',
  category: record.application?.personal?.category || '',
  programme: record.application?.programme?.applied || 'RUKF-IIBMP',
  submittedAt: record.submittedAt,
  verifiedAt: record.verifiedAt || '',
  verifiedBy: record.verifiedBy || '',
  assignedOfficerId: record.assignedOfficerId || '',
  assignedOfficerName: record.assignedOfficerName || '',
});

const loadApplications = async (year = DEFAULT_YEAR, processCode = DEFAULT_PROCESS) => {
  const db = await getDb();
  if (db) {
    const [rows] = await db.query(`
      SELECT applications.*, admin_users.name AS assigned_officer_name
      FROM applications
      LEFT JOIN admin_users ON admin_users.id = applications.assigned_officer_id
      WHERE applications.year = ? AND applications.process_code = ?
      ORDER BY applications.submitted_at DESC
    `, [year, processCode]);

    return rows.map(row => ({
      id: row.registration_no,
      year: row.year,
      processCode: row.process_code,
      schemaVersion: row.schema_version,
      registrationNo: row.registration_no,
      status: row.status,
      submittedAt: toIsoString(row.submitted_at),
      verificationNotes: row.verification_notes || '',
      verificationStages: parseStoredJson(row.verification_stages, {}),
      verifiedBy: row.verified_by || '',
      verifiedAt: toIsoString(row.verified_at),
      assignedOfficerId: row.assigned_officer_id || '',
      assignedOfficerName: row.assigned_officer_name || '',
      application: parseStoredJson(row.application_json, {}),
    }));
  }

  await ensureProcessStore(year, processCode);
  await migrateLegacyApplications(year, processCode);
  const records = await readJson(applicationsFile(year, processCode), []);
  const users = await loadAdminUsers();
  const officerNames = new Map(users.map(user => [user.id, user.name]));
  return records.map(record => ({
    ...record,
    assignedOfficerName: record.assignedOfficerName || officerNames.get(record.assignedOfficerId) || '',
  }));
};

const saveApplications = async (records, year = DEFAULT_YEAR, processCode = DEFAULT_PROCESS) => {
  const db = await getDb();
  if (db) {
    for (const record of records) {
      await saveApplicationRecord(record);
    }
    return;
  }

  await ensureProcessStore(year, processCode);
  await writeJson(applicationsFile(year, processCode), records);
};

const extractPayments = (record) => (
  (Array.isArray(record.application?.payments) ? record.application.payments : [])
    .map((payment, index) => ({
      title: payment.title || PAYMENT_TITLES[index] || `Payment ${index + 1}`,
      amount: Number(payment.amount || payment.fee || (index === 0 ? 2000 : 150000)) || null,
      txnRef: payment.txn_ref || payment.referenceNo || '',
      txnDate: payment.txn_date || payment.transactionDate || null,
      mode: payment.mode || '',
      proofName: payment.proofFile?.name || payment.proofFile?.storedName || '',
      proofUrl: payment.proofFile?.url || '',
      status: payment.status || record.status || 'Submitted',
      payment,
    }))
    .filter(payment => payment.txnRef || payment.txnDate || payment.proofName)
);

const saveApplicationPayments = async (db, record) => {
  await db.query('DELETE FROM application_payments WHERE registration_no = ?', [record.registrationNo]);
  for (const payment of extractPayments(record)) {
    await db.query(`
      INSERT INTO application_payments (
        registration_no, title, amount, txn_ref, txn_date, mode, proof_name, proof_url, status, payment_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.registrationNo,
      payment.title,
      payment.amount,
      payment.txnRef,
      payment.txnDate || null,
      payment.mode,
      payment.proofName,
      payment.proofUrl,
      payment.status,
      JSON.stringify(payment.payment),
    ]);
  }
};

const writeApplicationRecordToDb = async (db, record) => {
  await db.query(`
    INSERT INTO applications (
      registration_no, year, process_code, schema_version, status, submitted_at,
      verification_notes, verification_stages, verified_by, verified_at, assigned_officer_id,
      application_json, candidate_name, candidate_email, candidate_mobile, category, programme
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      verification_notes = VALUES(verification_notes),
      verification_stages = VALUES(verification_stages),
      verified_by = VALUES(verified_by),
      verified_at = VALUES(verified_at),
      assigned_officer_id = VALUES(assigned_officer_id),
      application_json = VALUES(application_json),
      candidate_name = VALUES(candidate_name),
      candidate_email = VALUES(candidate_email),
      candidate_mobile = VALUES(candidate_mobile),
      category = VALUES(category),
      programme = VALUES(programme)
  `, [
    record.registrationNo,
    record.year,
    record.processCode,
    record.schemaVersion,
    record.status,
    toMysqlDateTime(record.submittedAt) || toMysqlDateTime(new Date()),
    record.verificationNotes || '',
    JSON.stringify(record.verificationStages || {}),
    record.verifiedBy || '',
    toMysqlDateTime(record.verifiedAt),
    record.assignedOfficerId || null,
    JSON.stringify(record.application || {}),
    record.application?.personal?.name || '',
    record.application?.personal?.email || '',
    record.application?.personal?.mobile || '',
    record.application?.personal?.category || '',
    record.application?.programme?.applied || 'RUKF-IIBMP',
  ]);
  await saveApplicationPayments(db, record);
};

const saveApplicationRecord = async (record) => {
  const db = await getDb();
  if (!db) {
    const records = await loadApplications(record.year, record.processCode);
    const index = records.findIndex(item => item.registrationNo === record.registrationNo);
    if (index >= 0) records[index] = record;
    else records.unshift(record);
    await saveApplications(records, record.year, record.processCode);
    return;
  }

  await writeApplicationRecordToDb(db, record);
};

const createSubmittedApplicationRecord = async ({ year, processCode, rawApplication }) => {
  const db = await getDb();
  if (!db) {
    const registrationNo = await createRegistrationNo(year, processCode);
    const application = await persistApplicationUploads({
      application: rawApplication,
      year,
      processCode,
      registrationNo,
    });
    const record = {
      id: registrationNo,
      year,
      processCode,
      schemaVersion: `${processCode}-${year}`,
      registrationNo,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      verificationNotes: '',
      verificationStages: {},
      verifiedBy: '',
      verifiedAt: '',
      application,
    };
    await saveApplicationRecord(record);
    return record;
  }

  const connection = await db.getConnection();
  const submittedAt = new Date().toISOString();
  let record;
  try {
    await connection.beginTransaction();
    const serial = await nextSerialInTransaction(connection, year, processCode);
    const registrationNo = formatRegistrationNo(year, processCode, serial);
    record = {
      id: registrationNo,
      year,
      processCode,
      schemaVersion: `${processCode}-${year}`,
      registrationNo,
      status: 'Submitted',
      submittedAt,
      verificationNotes: '',
      verificationStages: {},
      verifiedBy: '',
      verifiedAt: '',
      application: rawApplication,
    };
    await writeApplicationRecordToDb(connection, record);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const application = await persistApplicationUploads({
    application: rawApplication,
    year,
    processCode,
    registrationNo: record.registrationNo,
  });
  record = { ...record, application };
  await saveApplicationRecord(record);
  return record;
};

const migrateJsonApplicationsToDatabase = async (year = DEFAULT_YEAR, processCode = DEFAULT_PROCESS) => {
  const db = await getDb();
  if (!db) return;
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM applications WHERE year = ? AND process_code = ?',
    [year, processCode]
  );
  if (Number(rows[0]?.total || 0) > 0) return;

  await ensureProcessStore(year, processCode);
  await migrateLegacyApplications(year, processCode);
  const records = await readJson(applicationsFile(year, processCode), []);
  for (const record of records.map(normalizeLegacyRecord)) {
    await saveApplicationRecord(record);
  }

  const maxSerial = records.reduce((max, record) => {
    const match = String(record.registrationNo || '').match(/-(\d+)$/u);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  if (maxSerial > 0) {
    await db.query(`
      INSERT INTO admission_counters (year, process_code, last_number)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE last_number = GREATEST(last_number, VALUES(last_number))
    `, [year, processCode, maxSerial]);
  }
};

const findApplication = async (registrationNo) => {
  const records = await loadApplications(DEFAULT_YEAR, DEFAULT_PROCESS);
  return {
    records,
    record: records.find(item => item.registrationNo === registrationNo),
    year: DEFAULT_YEAR,
    processCode: DEFAULT_PROCESS,
  };
};

const portalUrl = () => PUBLIC_ORIGIN === '*' ? 'https://admissions.jntugv.edu.in' : PUBLIC_ORIGIN;

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const brandedEmailHtml = ({ title, intro, rows = [], actionUrl = '', actionLabel = 'Open Portal', note = '' }) => {
  const baseUrl = portalUrl();
  const rowsHtml = rows.map((row, index) => {
    const border = index === rows.length - 1 ? '0' : '1px solid #e5edf7';
    return `<tr>
                    <td style="padding:10px 14px;border-bottom:${border};color:#64748b;font-size:13px;font-weight:700;">${escapeHtml(row.label)}</td>
                    <td style="padding:10px 14px;border-bottom:${border};color:#0f172a;font-size:14px;font-weight:800;text-align:right;">${escapeHtml(row.value)}</td>
                  </tr>`;
  }).join('');
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#102033;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dbe3ef;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:18px 22px;border-bottom:1px solid #e5edf7;background:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:64px;"><img src="${baseUrl}/jntugv-logo.png" width="54" height="54" alt="JNTUGV" style="display:block;border:0;"></td>
                    <td>
                      <div style="font-size:12px;font-weight:700;color:#2563eb;text-transform:uppercase;">Directorate of Admissions</div>
                      <div style="font-size:18px;font-weight:800;color:#0f2f5f;">JNTU-GV RUKF-IIBMP 2026-27</div>
                    </td>
                    <td align="right" style="width:72px;"><img src="${baseUrl}/reutlingen-logo.png" width="58" alt="Reutlingen University" style="display:block;border:0;"></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 22px;">
                <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#0f2f5f;">${escapeHtml(title)}</h1>
                <p style="margin:0 0 18px;line-height:1.6;color:#475569;">${escapeHtml(intro)}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbeafe;border-radius:8px;background:#f8fbff;margin:0 0 18px;">
                  ${rowsHtml}
                </table>
                ${actionUrl ? `<p style="margin:0 0 18px;"><a href="${actionUrl}" style="display:inline-block;background:#0f2f5f;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:6px;">${escapeHtml(actionLabel)}</a></p>` : ''}
                ${note ? `<p style="margin:0;padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;color:#9a3412;line-height:1.5;">${escapeHtml(note)}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 22px;background:#0f2f5f;color:#dbeafe;font-size:12px;line-height:1.5;">
                <strong style="display:block;color:#ffffff;font-size:13px;">Convenor, JNTUGV_RUKF-IIBMP</strong>
                <span>This is an automated message from the JNTU-GV Admissions Portal.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const notifyApplicationSubmitted = async (record) => {
  const candidateEmail = record.application?.personal?.email || '';
  const candidateName = record.application?.personal?.name || 'Candidate';
  const subject = `JNTUGV IIBMP Application Submitted - ${record.registrationNo}`;
  const text = [
    `Dear ${candidateName},`,
    '',
    'Your JNTUGV RUKF-IIBMP 2026 application has been submitted successfully.',
    `Application Number: ${record.registrationNo}`,
    `Status: ${record.status}`,
    `Submitted At: ${record.submittedAt}`,
    '',
    `You can check your application status at ${portalUrl()}.`,
    '',
    'Congratulations on completing your application!',
    '',
    'Convenor, JNTUGV_RUKF-IIBMP',
  ].join('\n');

  await sendMailSafe({
    to: candidateEmail,
    subject,
    text,
    html: brandedEmailHtml({
      title: 'Application Submitted Successfully',
      intro: `Dear ${candidateName}, your JNTUGV RUKF-IIBMP application has been submitted successfully.`,
      rows: [
        { label: 'Application Number', value: record.registrationNo },
        { label: 'Status', value: record.status },
        { label: 'Submitted At', value: record.submittedAt },
      ],
      actionUrl: portalUrl(),
      actionLabel: 'Check Application Status',
    }),
  });
  await sendMailSafe({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `New IIBMP application: ${record.registrationNo}`,
    text: [
      `Application Number: ${record.registrationNo}`,
      `Candidate: ${candidateName}`,
      `Email: ${candidateEmail || 'Not provided'}`,
      `Mobile: ${record.application?.personal?.mobile || 'Not provided'}`,
      `Programme: ${record.application?.programme?.applied || 'RUKF-IIBMP'}`,
      '',
      'Convenor, JNTUGV_RUKF-IIBMP',
    ].join('\n'),
  });
};

const notifyApplicationUpdated = async (record, previousStatus) => {
  const candidateEmail = record.application?.personal?.email || '';
  if (!candidateEmail || previousStatus === record.status) return;
  await sendMailSafe({
    to: candidateEmail,
    subject: `JNTUGV IIBMP Application Status - ${record.registrationNo}`,
    text: [
      `Dear ${record.application?.personal?.name || 'Candidate'},`,
      '',
      `Your application status is now: ${record.status}`,
      `Application Number: ${record.registrationNo}`,
      record.verificationNotes ? `Remarks: ${record.verificationNotes}` : '',
      '',
      `Track your application at ${portalUrl()}.`,
      '',
      
      'Convenor, JNTUGV_RUKF-IIBMP',
    ].filter(Boolean).join('\n'),
    html: brandedEmailHtml({
      title: 'Application Status Updated',
      intro: `Dear ${record.application?.personal?.name || 'Candidate'}, your application status has been updated.`,
      rows: [
        { label: 'Application Number', value: record.registrationNo },
        { label: 'Current Status', value: record.status },
        { label: 'Remarks', value: record.verificationNotes || 'No remarks' },
      ],
      actionUrl: portalUrl(),
      actionLabel: 'Open Portal',
    }),
  });
};

const notifyDepartmentLoginCreated = async ({ user, password }) => {
  return sendMailSafe({
    to: user.username,
    subject: 'JNTUGV Admissions Portal Login Created',
    text: [
      `Dear ${user.name},`,
      '',
      'Your department login has been created for the JNTUGV Admissions Portal.',
      `Login URL: ${portalUrl()}`,
      `Username: ${user.username}`,
      `Temporary Password: ${password}`,
      `Role: ${user.role}`,
      '',
      'Please sign in and keep this credential secure.',
      '',
      'Convenor, JNTUGV_RUKF-IIBMP',
    ].join('\n'),
    html: brandedEmailHtml({
      title: 'Department Login Created',
      intro: `Dear ${user.name}, your admissions portal login has been created.`,
      rows: [
        { label: 'Login URL', value: portalUrl() },
        { label: 'Username', value: user.username },
        { label: 'Temporary Password', value: password },
        { label: 'Role', value: user.role },
      ],
      actionUrl: portalUrl(),
      actionLabel: 'Open Department Login',
      note: 'Please keep this credential secure and change it if requested by the admissions office.',
    }),
  });
};

const notifyPasswordResetRequested = async (request) => {
  await sendMailSafe({
    to: ADMIN_NOTIFY_EMAIL,
    subject: 'Admissions Portal Password Reset Request',
    text: [
      'A department login password reset was requested from the admissions portal.',
      '',
      `Name: ${request.name || 'Not provided'}`,
      `Username / Email: ${request.username || 'Not provided'}`,
      `Role: ${request.role || 'Not provided'}`,
      `Contact Number: ${request.contactNumber || 'Not provided'}`,
      `Requested At: ${new Date().toISOString()}`,
      '',
      'Verify the requester before resetting credentials.',
      '',
      'Convenor, JNTUGV_RUKF-IIBMP',
    ].join('\n'),
    html: brandedEmailHtml({
      title: 'Password Reset Requested',
      intro: 'A department login password reset was requested from the admissions portal.',
      rows: [
        { label: 'Name', value: request.name || 'Not provided' },
        { label: 'Username / Email', value: request.username || 'Not provided' },
        { label: 'Role', value: request.role || 'Not provided' },
        { label: 'Contact Number', value: request.contactNumber || 'Not provided' },
      ],
      note: 'Verify the requester before resetting credentials.',
    }),
  });
};

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createPasswordResetToken = async (user) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const db = await getDb();

  if (db) {
    await db.query(`
      INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
      VALUES (?, ?, ?)
    `, [tokenHash, user.id, toMysqlDateTime(expiresAt)]);
    return { token, expiresAt };
  }

  const resets = await readJson(PASSWORD_RESETS_FILE, []);
  resets.push({
    tokenHash,
    userId: user.id,
    expiresAt: expiresAt.toISOString(),
    usedAt: '',
    createdAt: new Date().toISOString(),
  });
  await writeJson(PASSWORD_RESETS_FILE, resets);
  return { token, expiresAt };
};

const findPasswordResetUser = async (token) => {
  const tokenHash = hashResetToken(token);
  const db = await getDb();

  if (db) {
    const [rows] = await db.query(`
      SELECT password_reset_tokens.*, admin_users.username, admin_users.name, admin_users.role, admin_users.active
      FROM password_reset_tokens
      INNER JOIN admin_users ON admin_users.id = password_reset_tokens.user_id
      WHERE password_reset_tokens.token_hash = ?
      LIMIT 1
    `, [tokenHash]);
    const row = rows[0];
    if (!row || row.used_at || new Date(row.expires_at).getTime() < Date.now() || !row.active) return null;
    return {
      id: row.user_id,
      username: row.username,
      name: row.name,
      role: row.role,
    };
  }

  const resets = await readJson(PASSWORD_RESETS_FILE, []);
  const reset = resets.find(item => item.tokenHash === tokenHash);
  if (!reset || reset.usedAt || new Date(reset.expiresAt).getTime() < Date.now()) return null;
  const users = await loadAdminUsers();
  const user = users.find(item => item.id === reset.userId && item.active);
  return user ? publicUser(user) : null;
};

const consumePasswordResetToken = async (token) => {
  const tokenHash = hashResetToken(token);
  const db = await getDb();
  if (db) {
    await db.query('UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?', [
      toMysqlDateTime(new Date()),
      tokenHash,
    ]);
    return;
  }

  const resets = await readJson(PASSWORD_RESETS_FILE, []);
  const next = resets.map(item => (
    item.tokenHash === tokenHash ? { ...item, usedAt: new Date().toISOString() } : item
  ));
  await writeJson(PASSWORD_RESETS_FILE, next);
};

const updateUserPassword = async (userId, password) => {
  const users = await loadAdminUsers();
  const user = users.find(item => item.id === userId);
  if (!user) return null;
  const hashed = hashPassword(password);
  user.salt = hashed.salt;
  user.passwordHash = hashed.hash;
  await saveAdminUsers(users);
  return user;
};

const notifyPasswordResetLink = async ({ user, token, expiresAt }) => {
  const resetUrl = `${portalUrl()}/admin?resetToken=${encodeURIComponent(token)}`;
  await sendMailSafe({
    to: user.username,
    subject: 'Set Your JNTUGV Admissions Portal Password',
    text: [
      `Dear ${user.name},`,
      '',
      'Use the link below to set a new password for your admissions portal login.',
      '',
      resetUrl,
      '',
      `This link expires at ${expiresAt.toISOString()}.`,
      '',
      'If you did not request this, ignore this email and inform the Directorate of Admissions.',
      '',
      'Convenor, JNTUGV_RUKF-IIBMP',
    ].join('\n'),
    html: brandedEmailHtml({
      title: 'Set Your Password',
      intro: `Dear ${user.name}, use the secure link below to set a new admissions portal password.`,
      rows: [
        { label: 'Username', value: user.username },
        { label: 'Expires At', value: expiresAt.toISOString() },
      ],
      actionUrl: resetUrl,
      actionLabel: 'Set New Password',
      note: 'If you did not request this, ignore this email and inform the Directorate of Admissions.',
    }),
  });
};

const createApplicantPassword = () => crypto.randomBytes(6).toString('base64url');

const createDepartmentPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  const all = `${upper}${lower}${digits}${symbols}`;
  const pick = characters => characters[crypto.randomInt(characters.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const remaining = Array.from({ length: 8 }, () => pick(all));
  return [...required, ...remaining]
    .map(value => ({ value, order: crypto.randomInt(0x100000000) }))
    .sort((a, b) => a.order - b.order)
    .map(item => item.value)
    .join('');
};

const createApplicantUsername = async (year, processCode) => {
  const serialKey = `${processCode}-APPLICANT`;
  const db = await getDb();
  if (db) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(
        'SELECT last_number FROM admission_counters WHERE year = ? AND process_code = ? FOR UPDATE',
        [year, serialKey]
      );
      const nextSerial = rows.length ? Number(rows[0].last_number) + 1 : 1;
      if (rows.length) {
        await connection.query(
          'UPDATE admission_counters SET last_number = ? WHERE year = ? AND process_code = ?',
          [nextSerial, year, serialKey]
        );
      } else {
        await connection.query(
          'INSERT INTO admission_counters (year, process_code, last_number) VALUES (?, ?, ?)',
          [year, serialKey, nextSerial]
        );
      }
      await connection.commit();
      return `${processCode}${year}${String(nextSerial).padStart(5, '0')}`;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  const accounts = await readJson(APPLICANT_ACCOUNTS_FILE, []);
  return `${processCode}${year}${String(accounts.length + 1).padStart(5, '0')}`;
};

const publicApplicant = (account) => ({
  id: account.id,
  username: account.username,
  candidateEmail: account.candidateEmail,
  candidateMobile: account.candidateMobile,
  candidateName: account.candidateName,
  createdAt: account.createdAt,
});

const findApplicantByIdentity = async ({ email, mobile }) => {
  const db = await getDb();
  if (db) {
    const [rows] = await db.query(`
      SELECT * FROM applicant_accounts
      WHERE candidate_email = ? OR (? <> '' AND candidate_mobile = ?)
      ORDER BY created_at ASC
      LIMIT 1
    `, [email, mobile || '', mobile || '']);
    const row = rows[0];
    return row ? {
      id: row.id,
      username: row.username,
      candidateEmail: row.candidate_email,
      candidateMobile: row.candidate_mobile || '',
      candidateName: row.candidate_name || '',
      salt: row.salt,
      passwordHash: row.password_hash,
      createdAt: toIsoString(row.created_at),
    } : null;
  }

  const accounts = await readJson(APPLICANT_ACCOUNTS_FILE, []);
  return accounts.find(account => (
    account.candidateEmail.toLowerCase() === email.toLowerCase()
    || (mobile && account.candidateMobile === mobile)
  )) || null;
};

const findApplicantByUsername = async (username) => {
  const db = await getDb();
  if (db) {
    const [rows] = await db.query('SELECT * FROM applicant_accounts WHERE username = ? LIMIT 1', [username]);
    const row = rows[0];
    return row ? {
      id: row.id,
      username: row.username,
      candidateEmail: row.candidate_email,
      candidateMobile: row.candidate_mobile || '',
      candidateName: row.candidate_name || '',
      salt: row.salt,
      passwordHash: row.password_hash,
      createdAt: toIsoString(row.created_at),
    } : null;
  }

  const accounts = await readJson(APPLICANT_ACCOUNTS_FILE, []);
  return accounts.find(account => account.username.toLowerCase() === username.toLowerCase()) || null;
};

const saveApplicantAccount = async (account) => {
  const db = await getDb();
  if (db) {
    await db.query(`
      INSERT INTO applicant_accounts (
        id, username, candidate_email, candidate_mobile, candidate_name, salt, password_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        candidate_email = VALUES(candidate_email),
        candidate_mobile = VALUES(candidate_mobile),
        candidate_name = VALUES(candidate_name)
    `, [
      account.id,
      account.username,
      account.candidateEmail,
      account.candidateMobile,
      account.candidateName,
      account.salt,
      account.passwordHash,
      toMysqlDateTime(account.createdAt),
    ]);
    return;
  }

  const accounts = await readJson(APPLICANT_ACCOUNTS_FILE, []);
  const index = accounts.findIndex(item => item.id === account.id);
  if (index >= 0) accounts[index] = account;
  else accounts.push(account);
  await writeJson(APPLICANT_ACCOUNTS_FILE, accounts);
};

const ensureApplicantAccount = async ({ application, year, processCode }) => {
  const email = String(application?.personal?.email || '').trim().toLowerCase();
  const mobile = String(application?.personal?.mobile || '').trim();
  const candidateName = String(application?.personal?.name || '').trim();
  if (!email) {
    const error = new Error('Candidate email is required before saving server draft.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await findApplicantByIdentity({ email, mobile });
  if (existing) {
    existing.candidateMobile = mobile || existing.candidateMobile;
    existing.candidateName = candidateName || existing.candidateName;
    await saveApplicantAccount(existing);
    return { account: existing, password: '', isNew: false };
  }

  const password = createApplicantPassword();
  const hashed = hashPassword(password);
  const db = await getDb();
  if (db) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const serial = await nextSerialInTransaction(connection, year, `${processCode}-APPLICANT`);
      const account = {
        id: `applicant-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        username: `${processCode}${year}${String(serial).padStart(5, '0')}`,
        candidateEmail: email,
        candidateMobile: mobile,
        candidateName,
        salt: hashed.salt,
        passwordHash: hashed.hash,
        createdAt: new Date().toISOString(),
      };
      await connection.query(`
        INSERT INTO applicant_accounts (
          id, username, candidate_email, candidate_mobile, candidate_name, salt, password_hash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        account.id,
        account.username,
        account.candidateEmail,
        account.candidateMobile,
        account.candidateName,
        account.salt,
        account.passwordHash,
        toMysqlDateTime(account.createdAt),
      ]);
      await connection.commit();
      return { account, password, isNew: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  const account = {
    id: `applicant-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    username: await createApplicantUsername(year, processCode),
    candidateEmail: email,
    candidateMobile: mobile,
    candidateName,
    salt: hashed.salt,
    passwordHash: hashed.hash,
    createdAt: new Date().toISOString(),
  };
  await saveApplicantAccount(account);
  return { account, password, isNew: true };
};

const saveApplicantDraft = async ({ account, application, currentStep, year, processCode }) => {
  const savedAt = new Date().toISOString();
  const db = await getDb();
  if (db) {
    await db.query(`
      INSERT INTO applicant_drafts (applicant_id, year, process_code, current_step, draft_json, saved_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        year = VALUES(year),
        process_code = VALUES(process_code),
        current_step = VALUES(current_step),
        draft_json = VALUES(draft_json),
        saved_at = VALUES(saved_at)
    `, [account.id, year, processCode, Number(currentStep) || 1, JSON.stringify(application), toMysqlDateTime(savedAt)]);
  } else {
    const drafts = await readJson(APPLICANT_DRAFTS_FILE, []);
    const index = drafts.findIndex(item => item.applicantId === account.id);
    const draft = { applicantId: account.id, year, processCode, currentStep: Number(currentStep) || 1, data: application, savedAt };
    if (index >= 0) drafts[index] = draft;
    else drafts.push(draft);
    await writeJson(APPLICANT_DRAFTS_FILE, drafts);
  }
  return savedAt;
};

const loadApplicantDraft = async (accountId) => {
  const db = await getDb();
  if (db) {
    const [rows] = await db.query('SELECT * FROM applicant_drafts WHERE applicant_id = ? LIMIT 1', [accountId]);
    const row = rows[0];
    return row ? {
      data: parseStoredJson(row.draft_json, {}),
      currentStep: Number(row.current_step) || 1,
      savedAt: toIsoString(row.saved_at),
    } : null;
  }

  const drafts = await readJson(APPLICANT_DRAFTS_FILE, []);
  const draft = drafts.find(item => item.applicantId === accountId);
  return draft ? { data: draft.data, currentStep: draft.currentStep, savedAt: draft.savedAt } : null;
};

const summarizeApplicantDraft = (draft) => {
  const data = draft.data || {};
  return {
    applicantId: draft.applicantId,
    username: draft.username || '',
    candidateName: draft.candidateName || data.personal?.name || '',
    candidateEmail: draft.candidateEmail || data.personal?.email || '',
    candidateMobile: draft.candidateMobile || data.personal?.mobile || '',
    programme: data.programme?.applied || 'RUKF-IIBMP',
    currentStep: Number(draft.currentStep) || 1,
    savedAt: draft.savedAt || '',
    createdAt: draft.createdAt || '',
    status: 'Draft',
  };
};

const listApplicantDraftsForAdmin = async ({ year = DEFAULT_YEAR, processCode = DEFAULT_PROCESS, search = '' } = {}) => {
  const normalizedSearch = String(search || '').trim().toLowerCase();
  const db = await getDb();
  let drafts;

  if (db) {
    const [rows] = await db.query(`
      SELECT
        applicant_drafts.applicant_id,
        applicant_drafts.current_step,
        applicant_drafts.draft_json,
        applicant_drafts.saved_at,
        applicant_accounts.username,
        applicant_accounts.candidate_email,
        applicant_accounts.candidate_mobile,
        applicant_accounts.candidate_name,
        applicant_accounts.created_at
      FROM applicant_drafts
      INNER JOIN applicant_accounts ON applicant_accounts.id = applicant_drafts.applicant_id
      WHERE applicant_drafts.year = ? AND applicant_drafts.process_code = ?
      ORDER BY applicant_drafts.saved_at DESC
    `, [year, processCode]);

    drafts = rows.map(row => ({
      applicantId: row.applicant_id,
      username: row.username || '',
      candidateEmail: row.candidate_email || '',
      candidateMobile: row.candidate_mobile || '',
      candidateName: row.candidate_name || '',
      currentStep: row.current_step,
      data: parseStoredJson(row.draft_json, {}),
      savedAt: toIsoString(row.saved_at),
      createdAt: toIsoString(row.created_at),
    }));
  } else {
    const [draftRows, accountRows] = await Promise.all([
      readJson(APPLICANT_DRAFTS_FILE, []),
      readJson(APPLICANT_ACCOUNTS_FILE, []),
    ]);
    const accounts = new Map(accountRows.map(account => [account.id, account]));
    drafts = draftRows
      .filter(draft => draft.year === year && draft.processCode === processCode)
      .map(draft => {
        const account = accounts.get(draft.applicantId) || {};
        return {
          applicantId: draft.applicantId,
          username: account.username || '',
          candidateEmail: account.candidateEmail || '',
          candidateMobile: account.candidateMobile || '',
          candidateName: account.candidateName || '',
          currentStep: draft.currentStep,
          data: draft.data || {},
          savedAt: draft.savedAt || '',
          createdAt: account.createdAt || '',
        };
      })
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  }

  return drafts
    .map(summarizeApplicantDraft)
    .filter(draft => {
      if (!normalizedSearch) return true;
      return [
        draft.username,
        draft.candidateName,
        draft.candidateEmail,
        draft.candidateMobile,
      ].some(value => String(value || '').toLowerCase().includes(normalizedSearch));
    });
};

const summarizeApplicationReportRow = (row) => ({
  referenceNo: row.referenceNo || row.reference_no || '',
  name: row.name || '',
  phoneNumber: row.phoneNumber || row.phone_number || '',
  email: row.email || '',
  year: row.year || DEFAULT_YEAR,
  processCode: row.processCode || row.process_code || DEFAULT_PROCESS,
  programme: row.programme || '',
  category: row.category || '',
  currentStep: row.currentStep ?? row.current_step ?? null,
  applicationStatus: row.applicationStatus || row.application_status || '',
  verificationStatus: row.verificationStatus || row.verification_status || '',
  activityDate: row.activityDate || row.activity_date || '',
});

const listApplicationReportRows = async ({ year = DEFAULT_YEAR, processCode = DEFAULT_PROCESS, search = '' } = {}) => {
  const normalizedSearch = String(search || '').trim().toLowerCase();
  const db = await getDb();
  let rows;

  if (db) {
    const [result] = await db.query(`
      SELECT
        d.applicant_id AS reference_no,
        a.candidate_name AS name,
        a.candidate_mobile AS phone_number,
        a.candidate_email AS email,
        d.year,
        d.process_code,
        NULL AS programme,
        NULL AS category,
        d.current_step,
        'Under Process' AS application_status,
        NULL AS verification_status,
        d.saved_at AS activity_date
      FROM applicant_drafts d
      LEFT JOIN applicant_accounts a ON a.id = d.applicant_id
      WHERE d.year = ? AND d.process_code = ?

      UNION ALL

      SELECT
        ap.registration_no AS reference_no,
        ap.candidate_name AS name,
        ap.candidate_mobile AS phone_number,
        ap.candidate_email AS email,
        ap.year,
        ap.process_code,
        ap.programme,
        ap.category,
        NULL AS current_step,
        'Submitted' AS application_status,
        ap.status AS verification_status,
        ap.submitted_at AS activity_date
      FROM applications ap
      WHERE ap.year = ? AND ap.process_code = ?

      ORDER BY activity_date DESC
    `, [year, processCode, year, processCode]);

    rows = result.map(row => summarizeApplicationReportRow({
      ...row,
      activity_date: toIsoString(row.activity_date),
    }));
  } else {
    const [drafts, applications] = await Promise.all([
      listApplicantDraftsForAdmin({ year, processCode }),
      loadApplications(year, processCode),
    ]);

    rows = [
      ...drafts.map(draft => summarizeApplicationReportRow({
        referenceNo: draft.applicantId,
        name: draft.candidateName,
        phoneNumber: draft.candidateMobile,
        email: draft.candidateEmail,
        year,
        processCode,
        programme: '',
        category: '',
        currentStep: draft.currentStep,
        applicationStatus: 'Under Process',
        verificationStatus: '',
        activityDate: draft.savedAt,
      })),
      ...applications.map(application => summarizeApplicationReportRow({
        referenceNo: application.registrationNo,
        name: application.application?.personal?.name || '',
        phoneNumber: application.application?.personal?.mobile || '',
        email: application.application?.personal?.email || '',
        year: application.year,
        processCode: application.processCode,
        programme: application.application?.programme?.applied || 'RUKF-IIBMP',
        category: application.application?.personal?.category || '',
        currentStep: null,
        applicationStatus: 'Submitted',
        verificationStatus: application.status,
        activityDate: application.submittedAt,
      })),
    ].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  }

  return rows.filter(row => {
    if (!normalizedSearch) return true;
    return [
      row.referenceNo,
      row.name,
      row.phoneNumber,
      row.email,
      row.programme,
      row.category,
      row.applicationStatus,
      row.verificationStatus,
    ].some(value => String(value || '').toLowerCase().includes(normalizedSearch));
  });
};

const notifyApplicantCredentials = async ({ account, password }) => {
  if (!password) return { sent: false, skipped: true };
  return sendMailSafe({
    to: account.candidateEmail,
    subject: 'JNTUGV IIBMP Application Login Details',
    text: [
      `Dear ${account.candidateName || 'Candidate'},`,
      '',
      'Your application login has been created. Use these details to continue your application later if you are interrupted.',
      '',
      `Application Login: ${account.username}`,
      `Password: ${password}`,
      `Portal: ${portalUrl()}/login`,
      '',
      'After final submission, a separate submitted application registration number will be generated.',
      '',
      'Convenor, JNTUGV_RUKF-IIBMP',
    ].join('\n'),
    html: brandedEmailHtml({
      title: 'Applicant Login Details',
      intro: `Dear ${account.candidateName || 'Candidate'}, your applicant login has been created. Login first, then fill or continue your application.`,
      rows: [
        { label: 'Applicant Username', value: account.username },
        { label: 'Password', value: password },
        { label: 'Portal', value: `${portalUrl()}/login` },
      ],
      actionUrl: `${portalUrl()}/login`,
      actionLabel: 'Login and Fill Application',
      note: 'After final submission, a separate submitted application registration number will be generated.',
    }),
  });
};

const serveStoredFile = async (req, res, match) => {
  const [, year, processCode, registrationNo, encodedFilename] = match;
  const filename = decodeURIComponent(encodedFilename);
  const filePath = path.join(uploadDir(year, processCode, registrationNo), filename);
  const resolved = path.resolve(filePath);
  const allowedRoot = path.resolve(uploadDir(year, processCode, registrationNo));

  if (!resolved.startsWith(allowedRoot)) {
    return json(res, 403, { message: 'Forbidden' });
  }

  const ext = path.extname(filename).toLowerCase();
  try {
    await access(resolved);
  } catch {
    return json(res, 404, { message: 'File not found' });
  }

  res.writeHead(200, {
    'Content-Type': contentTypes[ext] || 'application/octet-stream',
    ...commonHeaders(),
  });
  createReadStream(resolved).on('error', () => res.destroy()).pipe(res);
};

const serveStaticFile = async (res, filePath) => {
  const resolved = path.resolve(filePath);
  const allowedRoot = path.resolve(STATIC_DIR);

  if (!resolved.startsWith(allowedRoot)) {
    return json(res, 403, { message: 'Forbidden' });
  }

  try {
    await access(resolved);
  } catch {
    return json(res, 404, { message: 'File not found' });
  }

  const ext = path.extname(resolved).toLowerCase();
  const isIndex = path.basename(resolved).toLowerCase() === 'index.html';
  res.writeHead(200, {
    'Content-Type': contentTypes[ext] || 'application/octet-stream',
    'Cache-Control': isIndex ? 'no-store, max-age=0' : 'public, max-age=31536000, immutable',
  });
  createReadStream(resolved).on('error', () => res.destroy()).pipe(res);
};

const serveFrontend = async (url, res) => {
  const requestedPath = decodeURIComponent(url.pathname);

  if (requestedPath.split('/').some(segment => segment.startsWith('.'))) {
    return json(res, 404, { message: 'Not found' });
  }

  const assetPath = path.join(STATIC_DIR, requestedPath === '/' ? 'index.html' : requestedPath);

  try {
    await access(assetPath);
    return serveStaticFile(res, assetPath);
  } catch {
    if (requestedPath.startsWith('/assets/') || path.extname(requestedPath)) {
      return json(res, 404, { message: 'Asset not found' });
    }
    return serveStaticFile(res, path.join(STATIC_DIR, 'index.html'));
  }
};

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, {
        ok: true,
        service: 'jntugv-admissions-api',
        storage: (await getDb()) ? 'mysql-json-hybrid' : 'yearly-file-db',
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/schemas/2026/IIBMP') {
      await ensureProcessStore(DEFAULT_YEAR, DEFAULT_PROCESS);
      return json(res, 200, await readJson(schemaFile(DEFAULT_YEAR, DEFAULT_PROCESS), IIBMP_2026_SCHEMA));
    }

    if (req.method === 'POST' && url.pathname === '/api/applicant/register') {
      const body = await readBody(req);
      const year = String(body.year || DEFAULT_YEAR);
      const processCode = String(body.processCode || DEFAULT_PROCESS);
      const application = {
        personal: {
          name: String(body.name || '').trim(),
          email: String(body.email || '').trim().toLowerCase(),
          mobile: String(body.mobile || '').trim(),
        },
        programme: {},
        education: [],
        payments: [],
        documents: {},
      };
      const { account, password, isNew } = await ensureApplicantAccount({ application, year, processCode });
      await saveApplicantDraft({ account, application, currentStep: 1, year, processCode });
      const mailResult = await notifyApplicantCredentials({ account, password });
      return json(res, 201, {
        applicant: publicApplicant(account),
        credentialsSent: Boolean(isNew && password && mailResult?.sent),
        message: isNew && mailResult?.sent
          ? 'Applicant registered. Login details were sent to the candidate email.'
          : isNew
            ? `Applicant registered, but email was not sent. Contact admissions with username ${account.username}.`
          : 'Applicant already registered. Use the previously emailed login details.',
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/applicant/drafts') {
      const body = await readBody(req);
      const year = String(body.year || body.application?.admissionYear || DEFAULT_YEAR);
      const processCode = String(body.processCode || body.application?.processCode || DEFAULT_PROCESS);
      const application = body.application || {};
      const { account, password, isNew } = await ensureApplicantAccount({ application, year, processCode });
      const savedAt = await saveApplicantDraft({
        account,
        application,
        currentStep: body.currentStep,
        year,
        processCode,
      });
      const mailResult = await notifyApplicantCredentials({ account, password });
      return json(res, 200, {
        applicant: publicApplicant(account),
        credentialsSent: Boolean(isNew && password && mailResult?.sent),
        savedAt,
        message: isNew && mailResult?.sent
          ? 'Draft saved. Applicant login details were sent to the candidate email.'
          : isNew
            ? `Draft saved, but email was not sent. Contact admissions with username ${account.username}.`
          : 'Draft saved. Use the previously emailed applicant login to continue later.',
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/applicant/login') {
      const body = await readBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');
      const account = await findApplicantByUsername(username);
      if (!account || !verifyPassword(password, account)) {
        return json(res, 401, { message: 'Invalid applicant username or password' });
      }
      const draft = await loadApplicantDraft(account.id);
      return json(res, 200, {
        applicant: publicApplicant(account),
        draft: draft || {
          data: {
            personal: {
              name: account.candidateName || '',
              email: account.candidateEmail || '',
              mobile: account.candidateMobile || '',
            },
          },
          currentStep: 1,
          savedAt: '',
        },
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/login') {
      const body = await readBody(req);
      const users = await loadAdminUsers();
      const user = users.find(item => item.username.toLowerCase() === String(body.username || '').toLowerCase() && item.active);

      if (!user || !verifyPassword(String(body.password || ''), user)) {
        return json(res, 401, { message: 'Invalid username or password' });
      }

      const token = signToken({
        id: user.id,
        username: user.username,
        role: user.role,
        expiresAt: Date.now() + (8 * 60 * 60 * 1000),
      });

      return json(res, 200, { token, user: publicUser(user) });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/password-reset-request') {
      const body = await readBody(req);
      const resetRequest = {
        name: String(body.name || '').trim(),
        username: String(body.username || '').trim(),
        role: String(body.role || '').trim(),
        contactNumber: String(body.contactNumber || '').trim(),
      };

      if (!resetRequest.username) {
        return json(res, 400, { message: 'Username/email is required.' });
      }

      const users = await loadAdminUsers();
      const user = users.find(item => item.username.toLowerCase() === resetRequest.username.toLowerCase() && item.active);

      if (user && user.username.includes('@')) {
        const reset = await createPasswordResetToken(user);
        await notifyPasswordResetLink({ user, token: reset.token, expiresAt: reset.expiresAt });
      } else {
        await notifyPasswordResetRequested(resetRequest);
      }

      return json(res, 200, { message: 'If the login exists, a password setup link has been sent to the registered email.' });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/password-reset') {
      const token = url.searchParams.get('token') || '';
      const user = token ? await findPasswordResetUser(token) : null;
      if (!user) {
        return json(res, 400, { message: 'Password setup link is invalid or expired.' });
      }
      return json(res, 200, { user });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/password-reset') {
      const body = await readBody(req);
      const token = String(body.token || '');
      const password = String(body.password || '');
      const user = token ? await findPasswordResetUser(token) : null;

      if (!user) {
        return json(res, 400, { message: 'Password setup link is invalid or expired.' });
      }

      if (password.length < 8) {
        return json(res, 400, { message: 'Password must be at least 8 characters.' });
      }

      await updateUserPassword(user.id, password);
      await consumePasswordResetToken(token);
      return json(res, 200, { message: 'Password updated. You can now login.' });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/session') {
      const user = await requireAdminUser(req, res);
      if (!user) return;
      return json(res, 200, { user: publicUser(user) });
    }

    if (url.pathname === '/api/admin/officers') {
      const adminUser = req.method === 'GET'
        ? await requireAdminUser(req, res)
        : await requireSuperAdmin(req, res);
      if (!adminUser) return;
      if (req.method === 'GET' && !['admin', 'co-convenor'].includes(adminUser.role)) {
        return json(res, 403, { message: 'Convenor or Co-convenor access required' });
      }
      const users = await loadAdminUsers();

      if (req.method === 'GET') {
        return json(res, 200, { officers: users.map(publicUser) });
      }

      if (req.method === 'POST') {
        const body = await readBody(req);
        const email = String(body.email || '').trim().toLowerCase();
        const name = String(body.name || '').trim();
        const allowedRoles = new Set(['co-convenor', 'officer']);
        const role = allowedRoles.has(body.role) ? body.role : 'officer';

        if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
          return json(res, 400, { message: 'A valid name and email address are required' });
        }

        if (users.some(user => user.username.toLowerCase() === email)) {
          return json(res, 409, { message: 'A department login already exists for this email address' });
        }

        const password = createDepartmentPassword();
        const hashed = hashPassword(password);
        const user = {
          id: `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          username: email,
          name,
          role,
          active: true,
          salt: hashed.salt,
          passwordHash: hashed.hash,
          createdAt: new Date().toISOString(),
        };
        users.push(user);
        await saveAdminUsers(users);
        const mailResult = await notifyDepartmentLoginCreated({ user, password });
        return json(res, 201, {
          user: publicUser(user),
          credentialsSent: Boolean(mailResult?.sent),
          message: mailResult?.sent
            ? `Login created and credentials sent to ${email}.`
            : `Login created, but the credentials email could not be delivered to ${email}.`,
          ...(!mailResult?.sent ? { temporaryPassword: password } : {}),
        });
      }
    }

    const officerMatch = url.pathname.match(/^\/api\/admin\/officers\/([^/]+)$/);
    if (officerMatch && req.method === 'PATCH') {
      const adminUser = await requireSuperAdmin(req, res);
      if (!adminUser) return;
      const body = await readBody(req);
      const users = await loadAdminUsers();
      const user = users.find(item => item.id === decodeURIComponent(officerMatch[1]));

      if (!user) {
        return json(res, 404, { message: 'Officer not found' });
      }

      user.name = body.name ?? user.name;
      user.role = ['admin', 'co-convenor', 'officer'].includes(body.role) ? body.role : user.role;
      user.active = typeof body.active === 'boolean' ? body.active : user.active;
      if (body.password) {
        const hashed = hashPassword(String(body.password));
        user.salt = hashed.salt;
        user.passwordHash = hashed.hash;
      }

      await saveAdminUsers(users);
      return json(res, 200, publicUser(user));
    }

    if (req.method === 'POST' && url.pathname === '/api/applications') {
      if (!APPLICATION_OPEN_OVERRIDE && Date.now() < APPLICATION_OPENS_AT) {
        return json(res, 403, {
          message: 'Online applications open on 30 July 2026 at 5:00 PM IST.',
        });
      }
      const body = await readBody(req);
      const year = String(body.year || body.application?.admissionYear || DEFAULT_YEAR);
      const processCode = String(body.processCode || body.application?.processCode || DEFAULT_PROCESS);
      const record = await createSubmittedApplicationRecord({
        year,
        processCode,
        rawApplication: body.application,
      });
      await notifyApplicationSubmitted(record);
      return json(res, 201, summarizeApplication(record));
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/applications') {
      const adminUser = await requireAdminUser(req, res);
      if (!adminUser) return;
      const year = url.searchParams.get('year') || DEFAULT_YEAR;
      const processCode = url.searchParams.get('processCode') || DEFAULT_PROCESS;
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const status = url.searchParams.get('status') || '';
      const records = await loadApplications(year, processCode);
      const filtered = records
        .filter(record => adminUser.role !== 'officer' || record.assignedOfficerId === adminUser.id)
        .filter(record => !status || record.status === status)
        .filter(record => {
          if (!search) return true;
          return [
            record.registrationNo,
            record.application?.personal?.name,
            record.application?.personal?.mobile,
            record.application?.personal?.email,
          ].some(value => String(value || '').toLowerCase().includes(search));
        })
        .map(summarizeApplication);

      return json(res, 200, { year, processCode, applications: filtered });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/applicant-drafts') {
      const adminUser = await requireSuperAdmin(req, res);
      if (!adminUser) return;
      const year = url.searchParams.get('year') || DEFAULT_YEAR;
      const processCode = url.searchParams.get('processCode') || DEFAULT_PROCESS;
      const search = url.searchParams.get('search') || '';
      const drafts = await listApplicantDraftsForAdmin({ year, processCode, search });

      return json(res, 200, { year, processCode, drafts });
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/application-reports') {
      const adminUser = await requireSuperAdmin(req, res);
      if (!adminUser) return;
      const year = url.searchParams.get('year') || DEFAULT_YEAR;
      const processCode = url.searchParams.get('processCode') || DEFAULT_PROCESS;
      const search = url.searchParams.get('search') || '';
      const reports = await listApplicationReportRows({ year, processCode, search });

      return json(res, 200, { year, processCode, reports });
    }

    const adminMatch = url.pathname.match(/^\/api\/admin\/applications\/([^/]+)$/);
    if (adminMatch) {
      const adminUser = await requireAdminUser(req, res);
      if (!adminUser) return;
      const registrationNo = decodeURIComponent(adminMatch[1]);
      const { records, record, year, processCode } = await findApplication(registrationNo);

      if (!record) {
        return json(res, 404, { message: 'Application not found' });
      }

      if (adminUser.role === 'officer' && record.assignedOfficerId !== adminUser.id) {
        return json(res, 403, { message: 'This application is not assigned to your account' });
      }

      if (req.method === 'GET') {
        return json(res, 200, record);
      }

      if (req.method === 'PATCH') {
        const body = await readBody(req);
        const previousStatus = record.status;
        const nextStatus = body.status || record.status;
        if (Array.isArray(body.payments)) {
          const existingPayments = Array.isArray(record.application?.payments) ? record.application.payments : [];
          record.application = {
            ...record.application,
            payments: PAYMENT_TITLES.map((title, index) => {
              const incoming = body.payments[index] || {};
              return {
                ...(existingPayments[index] || {}),
                title,
                amount: String(incoming.amount || incoming.fee || '').trim(),
                txn_ref: String(incoming.txn_ref || incoming.referenceNo || '').trim().toUpperCase(),
                txn_date: String(incoming.txn_date || incoming.transactionDate || '').trim(),
                mode: String(incoming.mode || '').trim().toUpperCase(),
                status: String(incoming.status || '').trim(),
              };
            }),
          };
        }
        Object.assign(record, {
          status: nextStatus,
          assignedOfficerId: ['admin', 'co-convenor'].includes(adminUser.role)
            ? body.assignedOfficerId ?? record.assignedOfficerId ?? ''
            : record.assignedOfficerId ?? '',
          verificationNotes: body.verificationNotes ?? record.verificationNotes,
          verificationStages: body.verificationStages && typeof body.verificationStages === 'object'
            ? VERIFICATION_STAGES.reduce((stages, stage) => ({
              ...stages,
              [stage]: String(body.verificationStages[stage] || ''),
            }), {})
            : record.verificationStages || {},
          verifiedBy: body.verifiedBy ?? record.verifiedBy,
          verifiedAt: ['Verified', 'Rejected', 'Needs Correction'].includes(nextStatus)
            ? new Date().toISOString()
            : record.verifiedAt,
        });
        await saveApplications(records, year, processCode);
        await notifyApplicationUpdated(record, previousStatus);
        return json(res, 200, record);
      }
    }

    const statusMatch = url.pathname.match(/^\/api\/applications\/([^/]+)$/);
    if (req.method === 'GET' && statusMatch) {
      const registrationNo = decodeURIComponent(statusMatch[1]);
      const { record } = await findApplication(registrationNo);

      if (!record) {
        return json(res, 404, { message: 'Application not found' });
      }

      return json(res, 200, {
        ...summarizeApplication(record),
        application: record.application,
      });
    }

    const fileMatch = url.pathname.match(/^\/api\/files\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/);
    if (req.method === 'GET' && fileMatch) {
      return serveStoredFile(req, res, fileMatch);
    }

    if (url.pathname.startsWith('/api')) {
      return json(res, 404, { message: 'Route not found' });
    }

    if (req.method === 'GET') {
      return serveFrontend(url, res);
    }

    return json(res, 404, { message: 'Route not found' });
  } catch (error) {
    return json(res, error.statusCode || 500, { message: error.message || 'Server error' });
  }
});

await ensureProcessStore(DEFAULT_YEAR, DEFAULT_PROCESS);
await initializeDatabase();
await loadAdminUsers();
await migrateJsonApplicationsToDatabase(DEFAULT_YEAR, DEFAULT_PROCESS);

server.listen(PORT, () => {
  console.log(`JNTUGV admissions API running at http://localhost:${PORT}`);
});
