import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createReadStream, readFileSync } from 'node:fs';
import { access } from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const loadDotEnv = (filePath) => {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/u)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      const name = key.trim();
      const rawValue = valueParts.join('=').trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');
      if (name && process.env[name] === undefined) {
        process.env[name] = value;
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

loadDotEnv(path.join(ROOT_DIR, '.env'));

const STATIC_DIR = path.join(ROOT_DIR, 'dist');
const PORT = Number(process.env.PORT || 5000);
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || '*';
const DATA_DIR = path.join(__dirname, 'data');
const ADMISSIONS_DIR = path.join(DATA_DIR, 'admissions');
const LEGACY_APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');
const ADMIN_USERS_FILE = path.join(DATA_DIR, 'admin-users.json');
const DEFAULT_YEAR = '2026';
const DEFAULT_PROCESS = 'IIBMP';
const MAX_BODY_SIZE = 120_000_000;
const IN_PROGRESS_STATUS = 'Under Review / Verification in Progress';
const VERIFICATION_STAGES = ['Submitted', IN_PROGRESS_STATUS, 'Verified', 'Needs Correction', 'Rejected'];
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'jntugv-admissions-local-secret';
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2026';
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'Admissions Administrator';

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
    'payment',
    'declaration',
  ],
  documentRules: {
    rankCards: 'Required for every selected competitive exam',
    aadhaar: 'Required for all candidates',
    caste: 'Required when category is not OC',
    educationCertificates: 'Required on each education row',
    paymentProof: 'Required on every payment row entered',
  },
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
    await writeFile(schemaFile(year, processCode), JSON.stringify(IIBMP_2026_SCHEMA, null, 2));
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

const normalizeStatus = (status = 'Submitted') => (
  status === 'Under Review' ? IN_PROGRESS_STATUS : status
);

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
  const password = hashPassword(DEFAULT_ADMIN_PASSWORD);
  return [{
    id: 'admin',
    username: DEFAULT_ADMIN_USERNAME,
    name: DEFAULT_ADMIN_NAME,
    role: 'admin',
    active: true,
    salt: password.salt,
    passwordHash: password.hash,
    createdAt: new Date().toISOString(),
  }];
};

const syncEnvAdminUser = async (users) => {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) return users;

  const normalizedUsername = DEFAULT_ADMIN_USERNAME.toLowerCase();
  const existing = users.find(user => user.id === 'admin')
    || users.find(user => String(user.username || '').toLowerCase() === normalizedUsername);

  if (existing) {
    existing.id = 'admin';
    existing.username = DEFAULT_ADMIN_USERNAME;
    existing.name = DEFAULT_ADMIN_NAME;
    existing.role = 'admin';
    existing.active = true;
    if (!verifyPassword(DEFAULT_ADMIN_PASSWORD, existing)) {
      const password = hashPassword(DEFAULT_ADMIN_PASSWORD);
      existing.salt = password.salt;
      existing.passwordHash = password.hash;
    }
    return users;
  }

  return [...users, defaultAdminUsers()[0]];
};

const loadAdminUsers = async () => {
  const users = await readJson(ADMIN_USERS_FILE, null);
  if (users) {
    const normalizedUsers = Array.isArray(users) ? users : [users].filter(Boolean);
    const beforeSync = JSON.stringify(normalizedUsers);
    const syncedUsers = await syncEnvAdminUser(normalizedUsers);
    if (JSON.stringify(syncedUsers) !== beforeSync) {
      await writeJson(ADMIN_USERS_FILE, syncedUsers);
    }
    return syncedUsers;
  }
  const initialUsers = defaultAdminUsers();
  await writeJson(ADMIN_USERS_FILE, initialUsers);
  return initialUsers;
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
  const status = normalizeStatus(record.status || 'Submitted');
  return {
    id: record.id || record.registrationNo,
    year,
    processCode,
    schemaVersion: record.schemaVersion || `${processCode}-${year}`,
    registrationNo: record.registrationNo,
    status,
    submittedAt: record.submittedAt || new Date().toISOString(),
    verificationNotes: record.verificationNotes || '',
    verificationStages: record.verificationStages || {},
    verifiedBy: record.verifiedBy || '',
    verifiedAt: record.verifiedAt || '',
    assignedOfficerId: record.assignedOfficerId || '',
    assignedOfficerName: record.assignedOfficerName || '',
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

const createRegistrationNo = (year, processCode) => {
  const seed = Math.floor(100000 + Math.random() * 900000);
  return `JNTUGV-${processCode}-${year}-${seed}`;
};

const summarizeApplication = (record) => ({
  id: record.id,
  year: record.year,
  processCode: record.processCode,
  registrationNo: record.registrationNo,
  status: normalizeStatus(record.status),
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
  await ensureProcessStore(year, processCode);
  await migrateLegacyApplications(year, processCode);
  return readJson(applicationsFile(year, processCode), []);
};

const saveApplications = async (records, year = DEFAULT_YEAR, processCode = DEFAULT_PROCESS) => {
  await ensureProcessStore(year, processCode);
  await writeJson(applicationsFile(year, processCode), records);
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
  res.writeHead(200, {
    'Content-Type': contentTypes[ext] || 'application/octet-stream',
    ...commonHeaders(),
  });
  createReadStream(resolved).on('error', () => res.destroy()).pipe(res);
};

const serveFrontend = async (url, res) => {
  const requestedPath = decodeURIComponent(url.pathname);
  const assetPath = path.join(STATIC_DIR, requestedPath === '/' ? 'index.html' : requestedPath);

  try {
    await access(assetPath);
    return serveStaticFile(res, assetPath);
  } catch {
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
      return json(res, 200, { ok: true, service: 'jntugv-admissions-api', storage: 'yearly-file-db' });
    }

    if (req.method === 'GET' && url.pathname === '/api/schemas/2026/IIBMP') {
      await ensureProcessStore(DEFAULT_YEAR, DEFAULT_PROCESS);
      return json(res, 200, await readJson(schemaFile(DEFAULT_YEAR, DEFAULT_PROCESS), IIBMP_2026_SCHEMA));
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

    if (req.method === 'GET' && url.pathname === '/api/admin/session') {
      const user = await requireAdminUser(req, res);
      if (!user) return;
      return json(res, 200, { user: publicUser(user) });
    }

    if (url.pathname === '/api/admin/officers') {
      const adminUser = await requireSuperAdmin(req, res);
      if (!adminUser) return;
      const users = await loadAdminUsers();

      if (req.method === 'GET') {
        return json(res, 200, { officers: users.map(publicUser) });
      }

      if (req.method === 'POST') {
        const body = await readBody(req);
        const username = String(body.username || '').trim();
        const password = String(body.password || '').trim();
        const name = String(body.name || '').trim();
        const role = body.role === 'admin' ? 'admin' : 'officer';

        if (!username || !password || !name) {
          return json(res, 400, { message: 'Name, username, and password are required' });
        }

        if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
          return json(res, 409, { message: 'Username already exists' });
        }

        const hashed = hashPassword(password);
        const user = {
          id: `user-${Date.now()}`,
          username,
          name,
          role,
          active: true,
          salt: hashed.salt,
          passwordHash: hashed.hash,
          createdAt: new Date().toISOString(),
        };
        users.push(user);
        await writeJson(ADMIN_USERS_FILE, users);
        return json(res, 201, publicUser(user));
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
      user.role = body.role === 'admin' ? 'admin' : body.role === 'officer' ? 'officer' : user.role;
      user.active = typeof body.active === 'boolean' ? body.active : user.active;
      if (body.password) {
        const hashed = hashPassword(String(body.password));
        user.salt = hashed.salt;
        user.passwordHash = hashed.hash;
      }

      await writeJson(ADMIN_USERS_FILE, users);
      return json(res, 200, publicUser(user));
    }

    if (req.method === 'POST' && url.pathname === '/api/applications') {
      const body = await readBody(req);
      const year = String(body.year || body.application?.admissionYear || DEFAULT_YEAR);
      const processCode = String(body.processCode || body.application?.processCode || DEFAULT_PROCESS);
      const records = await loadApplications(year, processCode);
      const registrationNo = createRegistrationNo(year, processCode);
      const application = await persistApplicationUploads({
        application: body.application,
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
        assignedOfficerId: '',
        assignedOfficerName: '',
        application,
      };

      records.unshift(record);
      await saveApplications(records, year, processCode);
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
        .filter(record => adminUser.role === 'admin' || record.assignedOfficerId === adminUser.id)
        .filter(record => !status || normalizeStatus(record.status) === status)
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

    const adminMatch = url.pathname.match(/^\/api\/admin\/applications\/([^/]+)$/);
    if (adminMatch) {
      const adminUser = await requireAdminUser(req, res);
      if (!adminUser) return;
      const registrationNo = decodeURIComponent(adminMatch[1]);
      const { records, record, year, processCode } = await findApplication(registrationNo);

      if (!record) {
        return json(res, 404, { message: 'Application not found' });
      }

      if (adminUser.role !== 'admin' && record.assignedOfficerId !== adminUser.id) {
        return json(res, 403, { message: 'Application is not assigned to this verification officer' });
      }

      if (req.method === 'GET') {
        record.status = normalizeStatus(record.status);
        return json(res, 200, record);
      }

      if (req.method === 'PATCH') {
        const body = await readBody(req);
        const nextStatus = normalizeStatus(body.status || record.status);
        const assignment = {};

        if (Object.prototype.hasOwnProperty.call(body, 'assignedOfficerId')) {
          if (adminUser.role !== 'admin') {
            return json(res, 403, { message: 'Only Director / Convenor admin can assign applications to officers' });
          }

          const assignedOfficerId = String(body.assignedOfficerId || '');
          if (assignedOfficerId) {
            const users = await loadAdminUsers();
            const officer = users.find(user => user.id === assignedOfficerId && user.active && user.role === 'officer');
            if (!officer) {
              return json(res, 400, { message: 'Selected verification officer is not active or does not exist' });
            }
            assignment.assignedOfficerId = officer.id;
            assignment.assignedOfficerName = officer.name;
          } else {
            assignment.assignedOfficerId = '';
            assignment.assignedOfficerName = '';
          }
        }

        Object.assign(record, {
          status: nextStatus,
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
          ...assignment,
        });
        await saveApplications(records, year, processCode);
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

      return json(res, 200, summarizeApplication(record));
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

server.listen(PORT, () => {
  console.log(`JNTUGV admissions portal running at http://localhost:${PORT}`);
});
