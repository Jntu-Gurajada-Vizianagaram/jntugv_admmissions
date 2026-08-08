const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const ADMIN_TOKEN_KEY = 'jntugv_admin_token';

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) || '';
export const setAdminToken = (token) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

const request = async (path, options = {}) => {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
};

export const adminLogin = async (credentials) => {
  const result = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  setAdminToken(result.token);
  return result;
};

export const requestAdminPasswordReset = (payload) => request('/api/admin/password-reset-request', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const validateAdminPasswordReset = (token) => (
  request(`/api/admin/password-reset?${new URLSearchParams({ token }).toString()}`)
);

export const completeAdminPasswordReset = (payload) => request('/api/admin/password-reset', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const getAdminSession = () => {
  if (!getAdminToken()) {
    return Promise.resolve({ user: null });
  }
  return request('/api/admin/session');
};

export const submitApplication = (application) => request('/api/applications', {
  method: 'POST',
  body: JSON.stringify({ year: '2026', processCode: 'IIBMP', application }),
});

export const getApplicationStatus = (registrationNo) => (
  request(`/api/applications/${encodeURIComponent(registrationNo)}`)
);

export const getAdmissionSchema = (year = '2026', processCode = 'IIBMP') => (
  request(`/api/schemas/${encodeURIComponent(year)}/${encodeURIComponent(processCode)}`)
);

export const saveApplicantDraft = (payload) => request('/api/applicant/drafts', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const registerApplicant = (payload) => request('/api/applicant/register', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const applicantLogin = (credentials) => request('/api/applicant/login', {
  method: 'POST',
  body: JSON.stringify(credentials),
});

export const listAdminApplications = ({ year = '2026', processCode = 'IIBMP', search = '', status = '' } = {}) => {
  const params = new URLSearchParams({ year, processCode });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  return request(`/api/admin/applications?${params.toString()}`);
};

export const listAdminDrafts = ({ year = '2026', processCode = 'IIBMP', search = '' } = {}) => {
  const params = new URLSearchParams({ year, processCode });
  if (search) params.set('search', search);
  return request(`/api/admin/applicant-drafts?${params.toString()}`);
};

export const listAdminApplicationReports = ({ year = '2026', processCode = 'IIBMP', search = '' } = {}) => {
  const params = new URLSearchParams({ year, processCode });
  if (search) params.set('search', search);
  return request(`/api/admin/application-reports?${params.toString()}`);
};

export const getAdminApplication = (registrationNo) => (
  request(`/api/admin/applications/${encodeURIComponent(registrationNo)}`)
);

export const updateAdminApplication = (registrationNo, payload) => request(`/api/admin/applications/${encodeURIComponent(registrationNo)}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});

export const listVerificationOfficers = () => request('/api/admin/officers');

export const createVerificationOfficer = (payload) => request('/api/admin/officers', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const updateVerificationOfficer = (id, payload) => request(`/api/admin/officers/${encodeURIComponent(id)}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
});
